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
[Route("api/laporan/{laporanId:int}/bukti")]
public class BuktiController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IFileStorage _storage;
    private readonly IAuditLogger _audit;

    public BuktiController(AppDbContext db, IFileStorage storage, IAuditLogger audit)
    {
        _db = db;
        _storage = storage;
        _audit = audit;
    }

    private static bool CanEdit(StatusLaporan s) =>
        s is StatusLaporan.Draft or StatusLaporan.Revision;

    private static BuktiResponse ToResponse(BuktiLaporan b) =>
        new(b.Id, b.NamaFile, b.TipeKonten, b.UkuranByte, b.DiunggahPada);

    // GET /api/laporan/5/bukti
    [HttpGet]
    public async Task<ActionResult<List<BuktiResponse>>> GetAll(int laporanId)
    {
        var visible = await _db.LaporanKinerja.ScopedFor(User).AnyAsync(l => l.Id == laporanId);
        if (!visible) return NotFound();

        var items = await _db.BuktiLaporan
            .Where(b => b.LaporanKinerjaId == laporanId)
            .OrderBy(b => b.DiunggahPada)
            .Select(b => new BuktiResponse(b.Id, b.NamaFile, b.TipeKonten, b.UkuranByte, b.DiunggahPada))
            .ToListAsync();

        return Ok(items);
    }

    // POST /api/laporan/5/bukti   (form-data, key: file)
    [HttpPost]
    [Authorize(Roles = "KepalaBidang")]
    [RequestSizeLimit(UploadRules.MaxFileSizeBytes + 1_048_576)] // batas kasar di level server
    public async Task<ActionResult<BuktiResponse>> Upload(int laporanId, IFormFile file)
    {
        var laporan = await _db.LaporanKinerja.ScopedFor(User)
            .Where(l => l.Id == laporanId)
            .Select(l => new { l.Status, JumlahBukti = l.Bukti.Count })
            .FirstOrDefaultAsync();

        if (laporan is null) return NotFound();

        if (!CanEdit(laporan.Status))
            return Conflict(new { message = "Bukti hanya bisa diubah saat laporan berstatus Draft atau Revision." });

        if (laporan.JumlahBukti >= UploadRules.MaxFilesPerLaporan)
            return Conflict(new { message = $"Maksimal {UploadRules.MaxFilesPerLaporan} bukti per laporan." });

        if (file.Length == 0)
            return BadRequest(new { message = "File kosong." });

        if (file.Length > UploadRules.MaxFileSizeBytes)
            return BadRequest(new { message = "Ukuran file maksimal 5 MB." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!UploadRules.Allowed.TryGetValue(extension, out var rule))
            return BadRequest(new { message = "Tipe file tidak diizinkan. Gunakan PDF, JPG, PNG, DOCX, atau XLSX." });

        if (!await UploadRules.HasValidSignatureAsync(file, rule))
            return BadRequest(new { message = "Isi file tidak sesuai dengan ekstensinya." });

        var storedName = await _storage.SaveAsync(file, extension);

        var originalName = Path.GetFileName(file.FileName);
        if (originalName.Length > 255) originalName = originalName[^255..]; // ambil bagian akhir agar ekstensi tetap ada

        var bukti = new BuktiLaporan
        {
            LaporanKinerjaId = laporanId,
            NamaFile = originalName,
            PathFile = storedName,
            TipeKonten = rule.ContentType, // dari whitelist kita, bukan dari klien
            UkuranByte = file.Length
        };

        _audit.Add(AuditActions.BuktiDiunggah, "Laporan", laporanId, originalName);

        _db.BuktiLaporan.Add(bukti);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch
        {
            _storage.Delete(storedName); // jangan tinggalkan file yatim jika database gagal
            throw;
        }

        return CreatedAtAction(nameof(Download),
            new { laporanId, buktiId = bukti.Id }, ToResponse(bukti));
    }

    // GET /api/laporan/5/bukti/12
    [HttpGet("{buktiId:int}")]
    public async Task<IActionResult> Download(int laporanId, int buktiId)
    {
        var visible = await _db.LaporanKinerja.ScopedFor(User).AnyAsync(l => l.Id == laporanId);
        if (!visible) return NotFound();

        var bukti = await _db.BuktiLaporan
            .FirstOrDefaultAsync(b => b.Id == buktiId && b.LaporanKinerjaId == laporanId);

        if (bukti is null || !_storage.Exists(bukti.PathFile)) return NotFound();

        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(_storage.Open(bukti.PathFile), bukti.TipeKonten, bukti.NamaFile);
    }

    // DELETE /api/laporan/5/bukti/12
    [HttpDelete("{buktiId:int}")]
    [Authorize(Roles = "KepalaBidang")]
    public async Task<IActionResult> Delete(int laporanId, int buktiId)
    {
        var status = await _db.LaporanKinerja.ScopedFor(User)
            .Where(l => l.Id == laporanId)
            .Select(l => (StatusLaporan?)l.Status)
            .FirstOrDefaultAsync();

        if (status is null) return NotFound();

        if (!CanEdit(status.Value))
            return Conflict(new { message = "Bukti hanya bisa dihapus saat laporan berstatus Draft atau Revision." });

        var bukti = await _db.BuktiLaporan
            .FirstOrDefaultAsync(b => b.Id == buktiId && b.LaporanKinerjaId == laporanId);
        if (bukti is null) return NotFound();

        _audit.Add(AuditActions.BuktiDihapus, "Laporan", laporanId, bukti.NamaFile);

        _db.BuktiLaporan.Remove(bukti);
        await _db.SaveChangesAsync();
        _storage.Delete(bukti.PathFile); // database dulu, baru file

        return NoContent();
    }
}