namespace SipekLka.Api.Models;

public class ReviewLaporan
{
    public int Id { get; set; }
    public StatusLaporan Keputusan { get; set; }   // Revision, Approved, atau Rejected
    public string Catatan { get; set; } = string.Empty;
    public DateTime DireviewPada { get; set; } = DateTime.UtcNow;

    public int LaporanKinerjaId { get; set; }
    public LaporanKinerja LaporanKinerja { get; set; } = null!;

    public int ReviewerUserId { get; set; }
    public User Reviewer { get; set; } = null!;
}