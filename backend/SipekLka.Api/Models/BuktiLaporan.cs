namespace SipekLka.Api.Models;

public class BuktiLaporan
{
    public int Id { get; set; }
    public string NamaFile { get; set; } = string.Empty;    // nama asli dari user
    public string PathFile { get; set; } = string.Empty;    // lokasi tersimpan di server
    public string TipeKonten { get; set; } = string.Empty;  // contoh: application/pdf
    public long UkuranByte { get; set; }
    public DateTime DiunggahPada { get; set; } = DateTime.UtcNow;

    public int LaporanKinerjaId { get; set; }
    public LaporanKinerja LaporanKinerja { get; set; } = null!;
}