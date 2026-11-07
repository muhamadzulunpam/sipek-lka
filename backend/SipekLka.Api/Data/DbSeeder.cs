using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Models;

namespace SipekLka.Api.Data;

public static class DbSeeder
{
    public static async Task SeedUsersAsync(AppDbContext db, string defaultPassword)
    {
        if (await db.Users.AnyAsync()) return;

        string Hash() => BCrypt.Net.BCrypt.HashPassword(defaultPassword);

        db.Users.AddRange(
            new User { NamaLengkap = "Andri Priadi, S.E., M.M.", Email = "pimpinan@lka.local", PasswordHash = Hash(), RoleId = 1 },
            new User { NamaLengkap = "Aisyah Al-Baroroh", Email = "beasiswa@lka.local", PasswordHash = Hash(), RoleId = 2, BidangId = 1 },
            new User { NamaLengkap = "Ir. Tri Prasetyo", Email = "tracer@lka.local", PasswordHash = Hash(), RoleId = 2, BidangId = 2 },
            new User { NamaLengkap = "Roeslan Djutalov", Email = "ormawa@lka.local", PasswordHash = Hash(), RoleId = 2, BidangId = 3 },
            new User { NamaLengkap = "M. Ahsan Tampubolon", Email = "mental@lka.local", PasswordHash = Hash(), RoleId = 2, BidangId = 4 },
            new User { NamaLengkap = "Risza Putri Elburdah", Email = "karier@lka.local", PasswordHash = Hash(), RoleId = 2, BidangId = 5 }
        );

        await db.SaveChangesAsync();
    }
}