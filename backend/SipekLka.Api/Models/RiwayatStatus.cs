namespace SipekLka.Api.Models;

public class RiwayatStatus
{
    public int Id { get; set; }
    public StatusLaporan StatusLama { get; set; }
    public StatusLaporan StatusBaru { get; set; }
    public string? Keterangan { get; set; }
    public DateTime DiubahPada { get; set; } = DateTime.UtcNow;

    public int LaporanKinerjaId { get; set; }
    public LaporanKinerja LaporanKinerja { get; set; } = null!;

    public int DiubahOlehUserId { get; set; }
    public User DiubahOleh { get; set; } = null!;
}