using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Data;
using SipekLka.Api.Dtos;
using SipekLka.Api.Models;

namespace SipekLka.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BidangController : ControllerBase
{
    private readonly AppDbContext _db;

    public BidangController(AppDbContext db)
    {
        _db = db;
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
        _db.Bidangs.Add(bidang);
        await _db.SaveChangesAsync();

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

        bidang.Nama = nama;
        await _db.SaveChangesAsync();

        return Ok(new BidangResponse(bidang.Id, bidang.Nama));
    }
}