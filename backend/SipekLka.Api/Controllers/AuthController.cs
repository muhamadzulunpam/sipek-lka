using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Data;
using SipekLka.Api.Dtos;
using SipekLka.Api.Models;
using SipekLka.Api.Services;

namespace SipekLka.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IAuditLogger _audit;

    public AuthController(AppDbContext db, IJwtTokenService jwt, IAuditLogger audit)
    {
        _db = db;
        _jwt = jwt;
        _audit = audit;
    }

    private LoginResponse ToResponse(User user)
    {
        var (token, expiresAt) = _jwt.CreateToken(user);
        return new LoginResponse(
            token, expiresAt, user.NamaLengkap, user.Role.Nama,
            user.BidangId, user.Bidang?.Nama, user.WajibGantiPassword);
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim();

        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.Bidang)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            // Respons ke klien tetap sama untuk kedua kasus; perbedaannya hanya tercatat di log
            await _audit.WriteAsync(AuditActions.LoginGagal,
                keterangan: user is null ? $"Email tidak terdaftar: {email}" : $"Password salah: {email}",
                userId: user?.Id, namaPengguna: user?.NamaLengkap);
            return Unauthorized(new { message = "Email atau password salah." });
        }

        // Pesan khusus hanya diberikan setelah password terbukti benar
        if (!user.IsAktif)
        {
            await _audit.WriteAsync(AuditActions.LoginDitolak,
                keterangan: "Akun nonaktif", userId: user.Id, namaPengguna: user.NamaLengkap);
            return StatusCode(StatusCodes.Status403Forbidden,
                new { message = "Akun Anda dinonaktifkan. Hubungi pimpinan LKA." });
        }

        await _audit.WriteAsync(AuditActions.LoginBerhasil,
            userId: user.Id, namaPengguna: user.NamaLengkap);

        return Ok(ToResponse(user));
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value,
            nama = User.FindFirst("name")?.Value,
            role = User.FindFirst("role")?.Value,
            bidangId = User.FindFirst("bidangId")?.Value
        });
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<LoginResponse>> ChangePassword(ChangePasswordRequest request)
    {
        var userId = int.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);

        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.Bidang)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null || !user.IsAktif) return Unauthorized();

        // 400, bukan 401: 401 membuat Angular mengeluarkan pengguna dari aplikasi
        if (!BCrypt.Net.BCrypt.Verify(request.PasswordLama, user.PasswordHash))
        {
            await _audit.WriteAsync(AuditActions.GantiPasswordGagal,
                "User", user.Id, "Password lama salah");
            return BadRequest(new { message = "Password lama salah." });
        }

        if (request.PasswordLama == request.PasswordBaru)
            return BadRequest(new { message = "Password baru harus berbeda dari password lama." });

        var wajib = user.WajibGantiPassword;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.PasswordBaru);
        user.WajibGantiPassword = false;
        user.TokenVersion++; // token lama (termasuk yang membawa claim mcp) tidak berlaku lagi

        _audit.Add(AuditActions.GantiPassword, "User", user.Id,
            wajib ? "Penggantian wajib (password bawaan atau hasil reset)" : "Ganti password sukarela");
        await _db.SaveChangesAsync(); // data dan log tersimpan bersamaan

        return Ok(ToResponse(user)); // token baru
    }
}