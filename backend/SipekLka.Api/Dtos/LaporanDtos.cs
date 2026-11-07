using System.ComponentModel.DataAnnotations;
using SipekLka.Api.Models;

namespace SipekLka.Api.Dtos;

// Dipakai untuk membuat DAN mengubah laporan.
// Perhatikan: tidak ada BidangId, Status, atau DibuatOleh. Itu ditentukan server.
public class LaporanRequest
{
    [Required, StringLength(200)]
    public string NamaKegiatan { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tanggal pelaksanaan wajib diisi.")]
    public DateTime? TanggalPelaksanaan { get; set; }

    [Required]
    [RegularExpression(@"^\d{4}-(0[1-9]|1[0-2])$",
        ErrorMessage = "Format periode harus YYYY-MM, contoh 2026-11.")]
    public string Periode { get; set; } = string.Empty;

    [Required, StringLength(1000)]
    public string Tujuan { get; set; } = string.Empty;

    [Required, StringLength(4000)]
    public string Deskripsi { get; set; } = string.Empty;

    [Range(0, 1_000_000_000)]
    public decimal Target { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal Realisasi { get; set; }

    [Required, StringLength(2000)]
    public string Capaian { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? KendalaTindakLanjut { get; set; }
}

public record LaporanResponse(
    int Id,
    string NamaKegiatan,
    DateTime TanggalPelaksanaan,
    string Periode,
    string Tujuan,
    string Deskripsi,
    decimal Target,
    decimal Realisasi,
    string Capaian,
    string? KendalaTindakLanjut,
    StatusLaporan Status,
    DateTime DibuatPada,
    int BidangId,
    string NamaBidang,
    string DibuatOleh);

// Versi ringkas untuk tabel daftar
public record LaporanListItem(
    int Id,
    string NamaKegiatan,
    string Periode,
    decimal Target,
    decimal Realisasi,
    StatusLaporan Status,
    DateTime DibuatPada,
    int BidangId,
    string NamaBidang);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems)
{
    public int TotalPages => (int)Math.Ceiling(TotalItems / (double)PageSize);
}