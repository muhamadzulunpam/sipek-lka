using System.Text.RegularExpressions;
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
public class DashboardController : ControllerBase
{
    private static readonly Regex PeriodePattern = new(@"^\d{4}-(0[1-9]|1[0-2])$");

    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/dashboard?periode=2026-11
    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get([FromQuery] string? periode)
    {
        periode = periode?.Trim();
        if (string.IsNullOrEmpty(periode)) periode = null;

        if (periode is not null && !PeriodePattern.IsMatch(periode))
            return BadRequest(new { message = "Format periode harus YYYY-MM, contoh 2026-11." });

        var isPimpinan = User.IsInRole("Pimpinan");
        int.TryParse(User.FindFirst("bidangId")?.Value, out var myBidangId);

        // Aturan akses yang sama persis dengan daftar laporan
        var query = _db.LaporanKinerja.ScopedFor(User);
        if (periode is not null)
            query = query.Where(l => l.Periode == periode);

        // Satu query SQL: hitung per bidang dan per status
        var stats = await query
            .GroupBy(l => l.BidangId)
            .Select(g => new
            {
                BidangId = g.Key,
                Draft = g.Count(l => l.Status == StatusLaporan.Draft),
                Submitted = g.Count(l => l.Status == StatusLaporan.Submitted),
                Revision = g.Count(l => l.Status == StatusLaporan.Revision),
                Approved = g.Count(l => l.Status == StatusLaporan.Approved),
                Rejected = g.Count(l => l.Status == StatusLaporan.Rejected)
            })
            .ToListAsync();

        // Daftar bidang diambil terpisah supaya bidang tanpa laporan tetap tampil (angka 0)
        var bidangQuery = _db.Bidangs.AsNoTracking();
        if (!isPimpinan)
            bidangQuery = bidangQuery.Where(b => b.Id == myBidangId);

        var bidangs = await bidangQuery
            .OrderBy(b => b.Id)
            .Select(b => new { b.Id, b.Nama })
            .ToListAsync();

        var perBidang = bidangs.Select(b =>
        {
            var s = stats.FirstOrDefault(x => x.BidangId == b.Id);
            return new BidangStat(
                b.Id, b.Nama,
                s?.Draft ?? 0, s?.Submitted ?? 0, s?.Revision ?? 0,
                s?.Approved ?? 0, s?.Rejected ?? 0);
        }).ToList();

        int? totalKepala = isPimpinan
            ? await _db.Users.CountAsync(u => u.Role.Nama == "KepalaBidang")
            : null;

        return Ok(new DashboardResponse(
            periode,
            perBidang.Sum(b => b.Total),
            perBidang.Sum(b => b.Draft),
            perBidang.Sum(b => b.Submitted),
            perBidang.Sum(b => b.Revision),
            perBidang.Sum(b => b.Approved),
            perBidang.Sum(b => b.Rejected),
            totalKepala,
            perBidang));
    }
}