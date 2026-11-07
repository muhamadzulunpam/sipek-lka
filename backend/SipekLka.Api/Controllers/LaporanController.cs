using System.Linq.Expressions;
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
public class LaporanController : ControllerBase
{
    private readonly AppDbContext _db;

    public LaporanController(AppDbContext db)
    {
        _db = db;
    }

    // --- Informasi user dari token ---
    private int CurrentUserId => int.Parse(User.FindFirst("sub")!.Value);
    private int? CurrentBidangId =>
        int.TryParse(User.FindFirst("bidangId")?.Value, out var id) ? id : null;
    private bool IsPimpinan => User.IsInRole("Pimpinan");

    // --- Query dasar yang sudah dibatasi sesuai siapa yang login ---
    private IQueryable<LaporanKinerja> ScopedQuery()
    {
        if (IsPimpinan)
            return _db.LaporanKinerja.Where(l => l.Status != StatusLaporan.Draft);

        var bidangId = CurrentBidangId;
        return _db.LaporanKinerja.Where(l => l.BidangId == bidangId);
    }

    private static readonly Expression<Func<LaporanKinerja, LaporanResponse>> ToResponse =
        l => new LaporanResponse(
            l.Id, l.NamaKegiatan, l.TanggalPelaksanaan, l.Periode, l.Tujuan, l.Deskripsi,
            l.Target, l.Realisasi, l.Capaian, l.KendalaTindakLanjut, l.Status, l.DibuatPada,
            l.BidangId, l.Bidang.Nama, l.DibuatOleh.NamaLengkap);

    private static void Apply(LaporanKinerja laporan, LaporanRequest r)
    {
        laporan.NamaKegiatan = r.NamaKegiatan;
        laporan.TanggalPelaksanaan = r.TanggalPelaksanaan!.Value;
        laporan.Periode = r.Periode;
        laporan.Tujuan = r.Tujuan;
        laporan.Deskripsi = r.Deskripsi;
        laporan.Target = r.Target;
        laporan.Realisasi = r.Realisasi;
        laporan.Capaian = r.Capaian;
        laporan.KendalaTindakLanjut = r.KendalaTindakLanjut;
    }

    // GET /api/laporan?periode=2026-11&status=Draft&bidangId=1&page=1&pageSize=10
    [HttpGet]
    public async Task<ActionResult<PagedResult<LaporanListItem>>> GetAll(
        [FromQuery] string? periode,
        [FromQuery] StatusLaporan? status,
        [FromQuery] int? bidangId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = ScopedQuery();

        if (!string.IsNullOrWhiteSpace(periode))
            query = query.Where(l => l.Periode == periode);
        if (status.HasValue)
            query = query.Where(l => l.Status == status.Value);
        if (IsPimpinan && bidangId.HasValue)
            query = query.Where(l => l.BidangId == bidangId.Value);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.DibuatPada)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LaporanListItem(
                l.Id, l.NamaKegiatan, l.Periode, l.Target, l.Realisasi,
                l.Status, l.DibuatPada, l.BidangId, l.Bidang.Nama))
            .ToListAsync();

        return Ok(new PagedResult<LaporanListItem>(items, page, pageSize, total));
    }

    // GET /api/laporan/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<LaporanResponse>> GetById(int id)
    {
        var laporan = await ScopedQuery()
            .Where(l => l.Id == id)
            .Select(ToResponse)
            .FirstOrDefaultAsync();

        return laporan is null ? NotFound() : Ok(laporan);
    }

    // POST /api/laporan
    [HttpPost]
    [Authorize(Roles = "KepalaBidang")]
    public async Task<ActionResult<LaporanResponse>> Create(LaporanRequest request)
    {
        var bidangId = CurrentBidangId;
        if (bidangId is null) return Forbid();

        var laporan = new LaporanKinerja
        {
            Status = StatusLaporan.Draft,
            BidangId = bidangId.Value,        // dari token, bukan dari request
            DibuatOlehUserId = CurrentUserId  // dari token
        };
        Apply(laporan, request);

        _db.LaporanKinerja.Add(laporan);
        await _db.SaveChangesAsync();

        var response = await _db.LaporanKinerja
            .Where(l => l.Id == laporan.Id)
            .Select(ToResponse)
            .FirstAsync();

        return CreatedAtAction(nameof(GetById), new { id = laporan.Id }, response);
    }

    // PUT /api/laporan/5
    [HttpPut("{id:int}")]
    [Authorize(Roles = "KepalaBidang")]
    public async Task<IActionResult> Update(int id, LaporanRequest request)
    {
        var laporan = await ScopedQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (laporan is null) return NotFound();

        if (laporan.Status is not (StatusLaporan.Draft or StatusLaporan.Revision))
            return Conflict(new { message = "Laporan hanya bisa diubah saat berstatus Draft atau Revision." });

        Apply(laporan, request);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // DELETE /api/laporan/5
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "KepalaBidang")]
    public async Task<IActionResult> Delete(int id)
    {
        var laporan = await ScopedQuery().FirstOrDefaultAsync(l => l.Id == id);
        if (laporan is null) return NotFound();

        if (laporan.Status != StatusLaporan.Draft)
            return Conflict(new { message = "Hanya laporan berstatus Draft yang bisa dihapus." });

        _db.LaporanKinerja.Remove(laporan);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}