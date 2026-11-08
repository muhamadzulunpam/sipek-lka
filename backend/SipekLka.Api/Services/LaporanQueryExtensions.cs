using System.Security.Claims;
using SipekLka.Api.Models;

namespace SipekLka.Api.Services;

public static class LaporanQueryExtensions
{
    // Pimpinan: semua laporan non-Draft. Kepala Bidang: hanya laporan bidangnya.
    public static IQueryable<LaporanKinerja> ScopedFor(
        this IQueryable<LaporanKinerja> query, ClaimsPrincipal user)
    {
        if (user.IsInRole("Pimpinan"))
            return query.Where(l => l.Status != StatusLaporan.Draft);

        int.TryParse(user.FindFirst("bidangId")?.Value, out var bidangId); // 0 jika tidak ada, tidak cocok dengan bidang mana pun
        return query.Where(l => l.BidangId == bidangId);
    }
}