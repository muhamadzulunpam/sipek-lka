using System.ComponentModel.DataAnnotations;
using SipekLka.Api.Models;

namespace SipekLka.Api.Dtos;

public class ReviewRequest
{
    [Required(ErrorMessage = "Keputusan wajib diisi.")]
    public StatusLaporan? Keputusan { get; set; }   // Approved, Rejected, atau Revision

    [StringLength(2000)]
    public string? Catatan { get; set; }
}

public record ReviewResponse(
    int Id,
    StatusLaporan Keputusan,
    string Catatan,
    DateTime DireviewPada,
    string Reviewer);

public record RiwayatResponse(
    int Id,
    StatusLaporan StatusLama,
    StatusLaporan StatusBaru,
    string? Keterangan,
    DateTime DiubahPada,
    string DiubahOleh);