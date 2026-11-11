namespace SipekLka.Api.Models;

public class AuditLog
{
    public long Id { get; set; }
    public DateTime WaktuUtc { get; set; } = DateTime.UtcNow;

    // Salinan, bukan foreign key: log tetap utuh walau akun berubah atau dihapus
    public int? UserId { get; set; }
    public string NamaPengguna { get; set; } = string.Empty;

    public string Aksi { get; set; } = string.Empty;   // kode, contoh: LoginBerhasil
    public string? TipeData { get; set; }              // User, Bidang, atau Laporan
    public int? DataId { get; set; }
    public string? Keterangan { get; set; }
    public string? IpAddress { get; set; }
}