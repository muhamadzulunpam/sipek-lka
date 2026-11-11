using SipekLka.Api.Data;
using SipekLka.Api.Models;

namespace SipekLka.Api.Services;

public interface IAuditLogger
{
    // Menambahkan ke DbContext TANPA menyimpan: ikut tersimpan di SaveChanges milik pemanggil (atomik)
    void Add(string aksi, string? tipeData = null, int? dataId = null, string? keterangan = null,
             int? userId = null, string? namaPengguna = null);

    // Menambahkan lalu langsung menyimpan: untuk kejadian yang tidak mengubah data lain (mis. login gagal)
    Task WriteAsync(string aksi, string? tipeData = null, int? dataId = null, string? keterangan = null,
                    int? userId = null, string? namaPengguna = null);
}

public class AuditLogger : IAuditLogger
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _http;

    public AuditLogger(AppDbContext db, IHttpContextAccessor http)
    {
        _db = db;
        _http = http;
    }

    public void Add(string aksi, string? tipeData = null, int? dataId = null, string? keterangan = null,
                    int? userId = null, string? namaPengguna = null)
    {
        var ctx = _http.HttpContext;

        // Pelaku diambil dari token, kecuali diisi eksplisit (login belum punya token)
        if (userId is null && int.TryParse(ctx?.User.FindFirst("sub")?.Value, out var id))
            userId = id;
        namaPengguna ??= ctx?.User.FindFirst("name")?.Value ?? "(anonim)";

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            NamaPengguna = Cut(namaPengguna, 150)!,
            Aksi = aksi,
            TipeData = tipeData,
            DataId = dataId,
            Keterangan = Cut(keterangan, 500),
            IpAddress = Cut(ctx?.Connection.RemoteIpAddress?.ToString(), 45)
        });
    }

    public async Task WriteAsync(string aksi, string? tipeData = null, int? dataId = null, string? keterangan = null,
                                 int? userId = null, string? namaPengguna = null)
    {
        Add(aksi, tipeData, dataId, keterangan, userId, namaPengguna);
        await _db.SaveChangesAsync();
    }

    // Buang baris baru (mencegah baris log palsu) dan batasi panjang
    private static string? Cut(string? s, int max)
    {
        if (s is null) return null;
        s = s.ReplaceLineEndings(" ").Trim();
        return s.Length <= max ? s : s[..max];
    }
}