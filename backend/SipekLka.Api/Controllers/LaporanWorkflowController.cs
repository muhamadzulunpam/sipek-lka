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
[Route("api/laporan/{laporanId:int}")]
public class LaporanWorkflowController : ControllerBase
{
    private readonly AppDbContext _db;

    public LaporanWorkflowController(AppDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirst("sub")!.Value);

    // Menyimpan semua perubahan dalam satu transaksi.
    // Mengembalikan null jika sukses, atau respons 409 jika data sudah diubah pihak lain.
    private async Task<IActionResult?> TrySaveAsync()
    {
        try
        {
            await _db.SaveChangesAsync();
            return null;
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "Laporan baru saja diubah oleh pengguna lain. Muat ulang lalu coba lagi." });
        }
    }

    // POST /api/laporan/5/submit
    [HttpPost("submit")]
    [Authorize(Roles = "KepalaBidang")]
    public async Task<IActionResult> Submit(int laporanId)
    {
        var laporan = await _db.LaporanKinerja.ScopedFor(User)
            .FirstOrDefaultAsync(l => l.Id == laporanId);
        if (laporan is null) return NotFound();

        if (laporan.Status is not (StatusLaporan.Draft or StatusLaporan.Revision))
            return Conflict(new { message = "Hanya laporan berstatus Draft atau Revision yang bisa dikirim." });

        var jumlahBukti = await _db.BuktiLaporan.CountAsync(b => b.LaporanKinerjaId == laporanId);
        if (jumlahBukti == 0)
            return BadRequest(new { message = "Unggah minimal satu bukti sebelum mengirim laporan." });

        var statusLama = laporan.Status;
        laporan.Status = StatusLaporan.Submitted;

        _db.RiwayatStatus.Add(new RiwayatStatus
        {
            LaporanKinerjaId = laporan.Id,
            StatusLama = statusLama,
            StatusBaru = StatusLaporan.Submitted,
            Keterangan = statusLama == StatusLaporan.Revision
                ? "Laporan dikirim ulang setelah revisi"
                : "Laporan dikirim",
            DiubahOlehUserId = CurrentUserId
        });

        var error = await TrySaveAsync();
        if (error is not null) return error;

        return Ok(new { status = laporan.Status });
    }

    // POST /api/laporan/5/review
    [HttpPost("review")]
    [Authorize(Roles = "Pimpinan")]
    public async Task<IActionResult> Review(int laporanId, ReviewRequest request)
    {
        var keputusan = request.Keputusan!.Value;

        if (keputusan is not (StatusLaporan.Approved or StatusLaporan.Rejected or StatusLaporan.Revision))
            return BadRequest(new { message = "Keputusan harus Approved, Rejected, atau Revision." });

        var catatan = request.Catatan?.Trim() ?? string.Empty;
        if (keputusan != StatusLaporan.Approved && catatan.Length == 0)
            return BadRequest(new { message = "Catatan wajib diisi untuk keputusan Rejected atau Revision." });

        var laporan = await _db.LaporanKinerja.ScopedFor(User)
            .FirstOrDefaultAsync(l => l.Id == laporanId);
        if (laporan is null) return NotFound();

        if (laporan.Status != StatusLaporan.Submitted)
            return Conflict(new { message = "Hanya laporan berstatus Submitted yang bisa direview." });

        var statusLama = laporan.Status;
        laporan.Status = keputusan;

        _db.ReviewLaporan.Add(new ReviewLaporan
        {
            LaporanKinerjaId = laporan.Id,
            Keputusan = keputusan,
            Catatan = catatan,
            ReviewerUserId = CurrentUserId
        });

        _db.RiwayatStatus.Add(new RiwayatStatus
        {
            LaporanKinerjaId = laporan.Id,
            StatusLama = statusLama,
            StatusBaru = keputusan,
            Keterangan = "Hasil review pimpinan",
            DiubahOlehUserId = CurrentUserId
        });

        var error = await TrySaveAsync();
        if (error is not null) return error;

        return Ok(new { status = laporan.Status });
    }

    // GET /api/laporan/5/review
    [HttpGet("review")]
    public async Task<ActionResult<List<ReviewResponse>>> GetReviews(int laporanId)
    {
        var visible = await _db.LaporanKinerja.ScopedFor(User).AnyAsync(l => l.Id == laporanId);
        if (!visible) return NotFound();

        var items = await _db.ReviewLaporan
            .Where(r => r.LaporanKinerjaId == laporanId)
            .OrderByDescending(r => r.DireviewPada)
            .Select(r => new ReviewResponse(
                r.Id, r.Keputusan, r.Catatan, r.DireviewPada, r.Reviewer.NamaLengkap))
            .ToListAsync();

        return Ok(items);
    }

    // GET /api/laporan/5/riwayat
    [HttpGet("riwayat")]
    public async Task<ActionResult<List<RiwayatResponse>>> GetRiwayat(int laporanId)
    {
        var visible = await _db.LaporanKinerja.ScopedFor(User).AnyAsync(l => l.Id == laporanId);
        if (!visible) return NotFound();

        var items = await _db.RiwayatStatus
            .Where(r => r.LaporanKinerjaId == laporanId)
            .OrderBy(r => r.DiubahPada).ThenBy(r => r.Id)
            .Select(r => new RiwayatResponse(
                r.Id, r.StatusLama, r.StatusBaru, r.Keterangan, r.DiubahPada, r.DiubahOleh.NamaLengkap))
            .ToListAsync();

        return Ok(items);
    }
}