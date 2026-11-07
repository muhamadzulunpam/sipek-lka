namespace SipekLka.Api.Models;

public class LaporanKinerja
{
    public int Id { get; set; }
    public string NamaKegiatan { get; set; } = string.Empty;
    public DateTime TanggalPelaksanaan { get; set; }
    public string Periode { get; set; } = string.Empty; // contoh: "2026-11"
    public string Tujuan { get; set; } = string.Empty;
    public string Deskripsi { get; set; } = string.Empty;
    public decimal Target { get; set; }
    public decimal Realisasi { get; set; }
    public string Capaian { get; set; } = string.Empty;
    public string? KendalaTindakLanjut { get; set; }
    public StatusLaporan Status { get; set; } = StatusLaporan.Draft;
    public DateTime DibuatPada { get; set; } = DateTime.UtcNow;

    public int BidangId { get; set; }
    public Bidang Bidang { get; set; } = null!;

    public int DibuatOlehUserId { get; set; }
    public User DibuatOleh { get; set; } = null!;

    public ICollection<BuktiLaporan> Bukti { get; set; } = new List<BuktiLaporan>();
    public ICollection<ReviewLaporan> Reviews { get; set; } = new List<ReviewLaporan>();
    public ICollection<RiwayatStatus> Riwayat { get; set; } = new List<RiwayatStatus>();
}