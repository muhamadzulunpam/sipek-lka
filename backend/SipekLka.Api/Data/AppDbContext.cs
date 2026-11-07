using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Models;

namespace SipekLka.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Bidang> Bidangs => Set<Bidang>();
    public DbSet<User> Users => Set<User>();
    public DbSet<LaporanKinerja> LaporanKinerja => Set<LaporanKinerja>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Bidang>().Property(x => x.Nama).HasMaxLength(150).IsRequired();
        b.Entity<Role>().Property(x => x.Nama).HasMaxLength(50).IsRequired();
        b.Entity<User>().HasIndex(x => x.Email).IsUnique();
        b.Entity<LaporanKinerja>().Property(x => x.Target).HasPrecision(18, 2);
        b.Entity<LaporanKinerja>().Property(x => x.Realisasi).HasPrecision(18, 2);

        // Hindari multiple cascade path di SQL Server
        b.Entity<LaporanKinerja>()
            .HasOne(l => l.DibuatOleh).WithMany()
            .HasForeignKey(l => l.DibuatOlehUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed data awal
        b.Entity<Role>().HasData(
            new Role { Id = 1, Nama = "Pimpinan" },
            new Role { Id = 2, Nama = "KepalaBidang" });

        b.Entity<Bidang>().HasData(
            new Bidang { Id = 1, Nama = "Beasiswa" },
            new Bidang { Id = 2, Nama = "Tracer Study Alumni dan TIK" },
            new Bidang { Id = 3, Nama = "Organisasi Mahasiswa (ORMAWA)" },
            new Bidang { Id = 4, Nama = "Mental Kebangsaan dan Kode Etik" },
            new Bidang { Id = 5, Nama = "Pengembangan Karier dan Mahasiswa Internasional" });
    }
}