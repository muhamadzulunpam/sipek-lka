# SIPEK-LKA
### Sistem Informasi Pelaporan Kinerja Lembaga Kemahasiswaan dan Alumni

SIPEK-LKA merupakan aplikasi berbasis web yang dikembangkan untuk membantu proses pengelolaan pelaporan kinerja bulanan Lembaga Kemahasiswaan dan Alumni (LKA) Universitas Pamulang.

Aplikasi ini bertujuan untuk mempermudah kepala bidang dalam menyampaikan laporan kegiatan dan pencapaian kinerja, serta membantu pimpinan LKA dalam melakukan pemeriksaan, verifikasi, dan persetujuan laporan secara terstruktur.

---

## 🎯 Tujuan Pengembangan

1. Digitalisasi proses pelaporan kinerja bulanan LKA.
2. Mempermudah kepala bidang dalam menyampaikan laporan kegiatan.
3. Menyediakan dokumentasi dan bukti pendukung kegiatan secara terpusat.
4. Mempermudah pimpinan LKA dalam memantau dan mengevaluasi pencapaian kinerja setiap bidang.
5. Meningkatkan efektivitas, transparansi, dan akuntabilitas pelaporan.

## 👥 Pengguna Sistem

Sistem ini dirancang untuk dua jenis pengguna utama:

| Pengguna | Hak Akses |
|---|---|
| Pimpinan LKA | Melihat laporan seluruh bidang, memberikan persetujuan atau penolakan laporan, dan memantau kinerja. |
| Kepala Bidang | Membuat, mengelola, dan mengirim laporan bulanan sesuai bidang masing-masing. |

## 🧩 Fitur Utama

Fitur yang direncanakan dalam pengembangan awal:

- [ ] Autentikasi dan login pengguna.
- [ ] Manajemen data pengguna.
- [ ] Manajemen data bidang LKA.
- [ ] Pembuatan laporan kinerja bulanan.
- [ ] Pengelolaan detail kegiatan dan pencapaian.
- [ ] Unggah bukti pendukung kegiatan.
- [ ] Pengiriman laporan kepada pimpinan.
- [ ] Persetujuan dan penolakan laporan.
- [ ] Catatan revisi dari pimpinan.
- [ ] Dashboard monitoring laporan.

## 🏢 Bidang LKA

Sistem ini dirancang untuk mendukung lima bidang:

1. Beasiswa.
2. Tracer Study Alumni dan TIK.
3. Organisasi Mahasiswa (ORMAWA).
4. Mental Kebangsaan dan Kode Etik.
5. Pengembangan Karier dan Mahasiswa Internasional/Asing.

## 🛠️ Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| C# | Bahasa pemrograman backend |
| ASP.NET Core Web API | Pengembangan REST API |
| Angular | Pengembangan frontend |
| TypeScript | Bahasa pemrograman frontend |
| SQL Server | Database |
| Entity Framework Core | ORM dan pengelolaan database |
| Git & GitHub | Version control dan kolaborasi |
| Visual Studio Code | Code editor |

## 📁 Rencana Struktur Project

```text
SIPEK-LKA/
│
├── backend/
│   └── SipekLka.API/
│       ├── Controllers/
│       ├── Models/
│       ├── Data/
│       ├── DTOs/
│       ├── Services/
│       └── Program.cs
│
├── frontend/
│   └── sipek-lka/
│       ├── src/
│       ├── public/
│       └── angular.json
│
├── docs/
│   ├── SRS.md
│   ├── USE-CASE.md
│   └── ERD.md
│
└── README.md
```

*Struktur di atas merupakan rancangan awal dan dapat berubah selama proses pengembangan.*

## 🔄 Alur Kerja Sistem

1. Kepala bidang login ke dalam sistem.
2. Kepala bidang membuat laporan kinerja bulanan.
3. Kepala bidang menambahkan detail kegiatan, pencapaian, dan bukti pendukung.
4. Kepala bidang mengirim laporan kepada pimpinan LKA.
5. Pimpinan memeriksa laporan yang telah dikirim.
6. Pimpinan memberikan persetujuan atau penolakan disertai catatan revisi jika diperlukan.
7. Kepala bidang dapat memperbaiki dan mengirim ulang laporan yang ditolak.

## 🚧 Status Pengembangan

<text>**Tahap: Inisialisasi Proyek (Phase 1)**</text>

| Tahapan | Status |
|---|---|
| Analisis kebutuhan sistem | Dalam persiapan |
| Perancangan sistem | Dalam persiapan |
| Persiapan development environment | Belum selesai |
| Pengembangan backend | Belum dimulai |
| Pengembangan frontend | Belum dimulai |
| Integrasi database | Belum dimulai |
| Pengujian sistem | Belum dimulai |
| Deployment | Belum dimulai |

## 📌 Roadmap Pengembangan

- [ ] **Phase 1:** Persiapan development environment dan inisialisasi project.
- [ ] **Phase 2:** Perancangan database dan pengembangan backend.
- [ ] **Phase 3:** Pengembangan frontend menggunakan Angular.
- [ ] **Phase 4:** Integrasi frontend, backend, dan database.
- [ ] **Phase 5:** Implementasi autentikasi dan hak akses pengguna.
- [ ] **Phase 6:** Pengujian dan penyempurnaan sistem.
- [ ] **Phase 7:** Deployment aplikasi.

## 👨‍💻 Developer

**Project:** SIPEK-LKA  
**Institusi:** Universitas Pamulang  
**Bidang:** Lembaga Kemahasiswaan dan Alumni  
**Repository:** `sipek-lka`

---

*SIPEK-LKA — Digitalisasi Pelaporan Kinerja untuk Mendukung Pengelolaan Lembaga Kemahasiswaan dan Alumni yang Lebih Terstruktur dan Akuntabel.*