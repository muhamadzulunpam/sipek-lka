using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Data;
using SipekLka.Api.Dtos;
using SipekLka.Api.Models;
using SipekLka.Api.Services;

namespace SipekLka.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BidangController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuditLogger _audit;

    public BidangController(AppDbContext db, IAuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    [HttpGet]
    public async Task<ActionResult<List<BidangResponse>>> GetAll()
    {
        var data = await _db.Bidangs
            .OrderBy(b => b.Id)
            .Select(b => new BidangResponse(b.Id, b.Nama))
            .ToListAsync();

        return Ok(data);
    }

    [HttpPost]
    [Authorize(Roles = "Pimpinan")]
    public async Task<IActionResult> Create(BidangRequest request)
    {
        var nama = request.Nama.Trim();
        if (nama.Length == 0) return BadRequest(new { message = "Nama bidang wajib diisi." });

        if (await _db.Bidangs.AnyAsync(b => b.Nama == nama))
            return Conflict(new { message = "Nama bidang sudah ada." });

        var bidang = new Bidang { Nama = nama };

        await using var tx = await _db.Database.BeginTransactionAsync();
        _db.Bidangs.Add(bidang);
        await _db.SaveChangesAsync();
        _audit.Add(AuditActions.BidangDibuat, "Bidang", bidang.Id, bidang.Nama);
        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        return StatusCode(StatusCodes.Status201Created, new BidangResponse(bidang.Id, bidang.Nama));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Pimpinan")]
    public async Task<ActionResult<BidangResponse>> Update(int id, BidangRequest request)
    {
        var bidang = await _db.Bidangs.FirstOrDefaultAsync(b => b.Id == id);
        if (bidang is null) return NotFound();

        var nama = request.Nama.Trim();
        if (nama.Length == 0) return BadRequest(new { message = "Nama bidang wajib diisi." });

        if (await _db.Bidangs.AnyAsync(b => b.Nama == nama && b.Id != id))
            return Conflict(new { message = "Nama bidang sudah ada." });

        if (bidang.Nama != nama)
        {
            _audit.Add(AuditActions.BidangDiubah, "Bidang", bidang.Id, $"{bidang.Nama} → {nama}");
            bidang.Nama = nama;
        }

        await _db.SaveChangesAsync();

        return Ok(new BidangResponse(bidang.Id, bidang.Nama));
    }
}