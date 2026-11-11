using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Data;
using SipekLka.Api.Dtos;
using SipekLka.Api.Models;
using SipekLka.Api.Services;

namespace SipekLka.Api.Controllers;

[ApiController]
[Authorize(Roles = "Pimpinan")]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private const string BidangSudahAdaKepala =
        "Bidang ini sudah memiliki Kepala Bidang aktif. Nonaktifkan akun lama terlebih dahulu.";

    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;

    public UsersController(AppDbContext db, IAuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    // Semua endpoint hanya menyentuh akun Kepala Bidang
    private IQueryable<User> KepalaQuery => _db.Users.Where(u => u.Role.Nama == "KepalaBidang");

    private static UserResponse ToResponse(User u) =>
        new(u.Id, u.NamaLengkap, u.Email, u.BidangId, u.Bidang?.Nama, u.IsAktif, u.WajibGantiPassword);

    private static string Describe(User u) => $"{u.NamaLengkap} ({u.Email})";

    private Task<bool> BidangPunyaKepalaAktif(int bidangId, int exceptUserId = 0) =>
        KepalaQuery.AnyAsync(u => u.BidangId == bidangId && u.IsAktif && u.Id != exceptUserId);

    // GET /api/users
    [HttpGet]
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        var users = await KepalaQuery
            .AsNoTracking()
            .Include(u => u.Bidang)
            .OrderBy(u => u.BidangId).ThenBy(u => u.NamaLengkap)
            .ToListAsync();

        return Ok(users.Select(ToResponse).ToList());
    }

    // POST /api/users
    [HttpPost]
    public async Task<IActionResult> Create(UserRequest request)
    {
        var nama = request.NamaLengkap.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        if (nama.Length == 0) return BadRequest(new { message = "Nama wajib diisi." });

        var bidang = await _db.Bidangs.FirstOrDefaultAsync(b => b.Id == request.BidangId!.Value);
        if (bidang is null) return BadRequest(new { message = "Bidang tidak ditemukan." });

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Email sudah dipakai akun lain." });

        if (await BidangPunyaKepalaAktif(bidang.Id))
            return Conflict(new { message = BidangSudahAdaKepala });

        var roleId = await _db.Roles.Where(r => r.Nama == "KepalaBidang").Select(r => r.Id).FirstAsync();
        var password = PasswordGenerator.Generate();

        var user = new User
        {
            NamaLengkap = nama,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            RoleId = roleId,
            BidangId = bidang.Id,
            WajibGantiPassword = true
        };

        // Transaksi: ID akun baru baru diketahui setelah disimpan, lalu dicatat ke log
        await using var tx = await _db.Database.BeginTransactionAsync();
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        _audit.Add(AuditActions.UserDibuat, "User", user.Id, $"{Describe(user)}, bidang {bidang.Nama}");
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        user.Bidang = bidang;

        return StatusCode(StatusCodes.Status201Created,
            new UserWithPasswordResponse(ToResponse(user), password));
    }

    // PUT /api/users/5
    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserResponse>> Update(int id, UserRequest request)
    {
        var user = await KepalaQuery.Include(u => u.Bidang).FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        var nama = request.NamaLengkap.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        if (nama.Length == 0) return BadRequest(new { message = "Nama wajib diisi." });

        var bidang = await _db.Bidangs.FirstOrDefaultAsync(b => b.Id == request.BidangId!.Value);
        if (bidang is null) return BadRequest(new { message = "Bidang tidak ditemukan." });

        if (await _db.Users.AnyAsync(u => u.Email == email && u.Id != id))
            return Conflict(new { message = "Email sudah dipakai akun lain." });

        var bidangBerubah = user.BidangId != bidang.Id;
        if (bidangBerubah && user.IsAktif && await BidangPunyaKepalaAktif(bidang.Id, id))
            return Conflict(new { message = BidangSudahAdaKepala });

        // Catat perubahan SEBELUM nilai lama ditimpa
        var perubahan = new List<string>();
        if (user.NamaLengkap != nama) perubahan.Add($"nama: {user.NamaLengkap} → {nama}");
        if (user.Email != email) perubahan.Add($"email: {user.Email} → {email}");
        if (bidangBerubah) perubahan.Add($"bidang: {user.Bidang?.Nama} → {bidang.Nama}");

        user.NamaLengkap = nama;
        user.Email = email;
        user.BidangId = bidang.Id;
        user.Bidang = bidang;

        // Claim bidangId di token lama sudah tidak benar, paksa login ulang
        if (bidangBerubah) user.TokenVersion++;

        if (perubahan.Count > 0)
            _audit.Add(AuditActions.UserDiubah, "User", user.Id, string.Join("; ", perubahan));

        await _db.SaveChangesAsync();
        return Ok(ToResponse(user));
    }

    // POST /api/users/5/deactivate
    [HttpPost("{id:int}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var user = await KepalaQuery.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        user.IsAktif = false;
        user.TokenVersion++; // sesi yang sedang berjalan langsung mati
        _audit.Add(AuditActions.UserDinonaktifkan, "User", user.Id, Describe(user));
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/users/5/activate
    [HttpPost("{id:int}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        var user = await KepalaQuery.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        if (user.BidangId is int bidangId && await BidangPunyaKepalaAktif(bidangId, id))
            return Conflict(new { message = BidangSudahAdaKepala });

        user.IsAktif = true;
        _audit.Add(AuditActions.UserDiaktifkan, "User", user.Id, Describe(user));
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/users/5/reset-password
    [HttpPost("{id:int}/reset-password")]
    public async Task<ActionResult<PasswordResetResponse>> ResetPassword(int id)
    {
        var user = await KepalaQuery.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null) return NotFound();

        var password = PasswordGenerator.Generate();
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        user.WajibGantiPassword = true;
        user.TokenVersion++; // sesi lama mati

        // Password sementara TIDAK PERNAH masuk log
        _audit.Add(AuditActions.UserResetPassword, "User", user.Id, Describe(user));
        await _db.SaveChangesAsync();

        return Ok(new PasswordResetResponse(password));
    }
}