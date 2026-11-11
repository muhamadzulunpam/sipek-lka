using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Models;

namespace SipekLka.Api.Data;

public static class DbSeeder
{
    public static async Task SeedUsersAsync(AppDbContext db, string defaultPassword)
    {
        if (await db.Users.AnyAsync()) return;

        User Make(string nama, string email, int roleId, int? bidangId) => new()
        {
            NamaLengkap = nama,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword),
            RoleId = roleId,
            BidangId = bidangId,
            WajibGantiPassword = true
        };

        db.Users.AddRange(
            Make("Andri Priadi, S.E., M.M.", "pimpinan@lka.local", 1, null),
            Make("Aisyah Al-Baroroh", "beasiswa@lka.local", 2, 1),
            Make("Ir. Tri Prasetyo", "tracer@lka.local", 2, 2),
            Make("Roeslan Djutalov", "ormawa@lka.local", 2, 3),
            Make("M. Ahsan Tampubolon", "mental@lka.local", 2, 4),
            Make("Risza Putri Elburdah", "karier@lka.local", 2, 5));

        await db.SaveChangesAsync();
    }
}