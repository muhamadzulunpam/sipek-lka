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
    public DbSet<BuktiLaporan> BuktiLaporan => Set<BuktiLaporan>();
    public DbSet<ReviewLaporan> ReviewLaporan => Set<ReviewLaporan>();
    public DbSet<RiwayatStatus> RiwayatStatus => Set<RiwayatStatus>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();


    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Bidang>().Property(x => x.Nama).HasMaxLength(150).IsRequired();
        b.Entity<Role>().Property(x => x.Nama).HasMaxLength(50).IsRequired();
        b.Entity<User>().HasIndex(x => x.Email).IsUnique();
        b.Entity<LaporanKinerja>().Property(x => x.Target).HasPrecision(18, 2);
        b.Entity<LaporanKinerja>().Property(x => x.Realisasi).HasPrecision(18, 2);
        b.Entity<BuktiLaporan>().Property(x => x.NamaFile).HasMaxLength(255).IsRequired();
        b.Entity<BuktiLaporan>().Property(x => x.PathFile).HasMaxLength(500).IsRequired();
        b.Entity<BuktiLaporan>().Property(x => x.TipeKonten).HasMaxLength(100);
        b.Entity<ReviewLaporan>().Property(x => x.Catatan).HasMaxLength(2000);
        b.Entity<RiwayatStatus>().Property(x => x.Keterangan).HasMaxLength(500);


        // Hindari multiple cascade path di SQL Server
        b.Entity<LaporanKinerja>()
            .HasOne(l => l.DibuatOleh).WithMany()
            .HasForeignKey(l => l.DibuatOlehUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Review & Riwayat: ikut terhapus bersama laporan, tapi user tidak boleh terhapus otomatis
        b.Entity<ReviewLaporan>()
            .HasOne(r => r.Reviewer).WithMany()
            .HasForeignKey(r => r.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<RiwayatStatus>()
            .HasOne(r => r.DiubahOleh).WithMany()
            .HasForeignKey(r => r.DiubahOlehUserId)
            .OnDelete(DeleteBehavior.Restrict);

        b.Entity<LaporanKinerja>().Property(x => x.RowVersion).IsRowVersion();

        // Default true di database, supaya akun yang sudah ada tidak menjadi nonaktif saat migration
        b.Entity<User>().Property(x => x.IsAktif).HasDefaultValue(true);
        b.Entity<Bidang>().HasIndex(x => x.Nama).IsUnique();

        b.Entity<AuditLog>().Property(x => x.NamaPengguna).HasMaxLength(150).IsRequired();
        b.Entity<AuditLog>().Property(x => x.Aksi).HasMaxLength(50).IsRequired();
        b.Entity<AuditLog>().Property(x => x.TipeData).HasMaxLength(50);
        b.Entity<AuditLog>().Property(x => x.Keterangan).HasMaxLength(500);
        b.Entity<AuditLog>().Property(x => x.IpAddress).HasMaxLength(45);
        b.Entity<AuditLog>().HasIndex(x => x.WaktuUtc);
        b.Entity<AuditLog>().HasIndex(x => x.UserId);
        b.Entity<AuditLog>().HasIndex(x => x.Aksi);
            
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