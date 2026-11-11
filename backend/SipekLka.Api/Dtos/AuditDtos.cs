namespace SipekLka.Api.Dtos;

public record AuditLogItem(
    long Id,
    DateTime WaktuUtc,
    int? UserId,
    string NamaPengguna,
    string Aksi,
    string AksiLabel,
    string? TipeData,
    int? DataId,
    string? Keterangan,
    string? IpAddress);

public record AuditAksiItem(string Kode, string Label);