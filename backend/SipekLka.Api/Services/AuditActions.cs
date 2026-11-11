namespace SipekLka.Api.Services;

public static class AuditActions
{
    public const string LoginBerhasil = "LoginBerhasil";
    public const string LoginGagal = "LoginGagal";
    public const string LoginDitolak = "LoginDitolak";
    public const string GantiPassword = "GantiPassword";
    public const string GantiPasswordGagal = "GantiPasswordGagal";

    public const string UserDibuat = "UserDibuat";
    public const string UserDiubah = "UserDiubah";
    public const string UserDinonaktifkan = "UserDinonaktifkan";
    public const string UserDiaktifkan = "UserDiaktifkan";
    public const string UserResetPassword = "UserResetPassword";

    public const string BidangDibuat = "BidangDibuat";
    public const string BidangDiubah = "BidangDiubah";

    public const string LaporanDibuat = "LaporanDibuat";
    public const string LaporanDiubah = "LaporanDiubah";
    public const string LaporanDihapus = "LaporanDihapus";
    public const string LaporanDikirim = "LaporanDikirim";
    public const string LaporanDireview = "LaporanDireview";

    public const string BuktiDiunggah = "BuktiDiunggah";
    public const string BuktiDihapus = "BuktiDihapus";

    // Satu sumber kebenaran: dipakai API untuk mengisi dropdown filter di Angular
    public static readonly IReadOnlyDictionary<string, string> Labels = new Dictionary<string, string>
    {
        [LoginBerhasil] = "Login berhasil",
        [LoginGagal] = "Login gagal",
        [LoginDitolak] = "Login ditolak (akun nonaktif)",
        [GantiPassword] = "Ganti password",
        [GantiPasswordGagal] = "Ganti password gagal",
        [UserDibuat] = "Akun dibuat",
        [UserDiubah] = "Akun diubah",
        [UserDinonaktifkan] = "Akun dinonaktifkan",
        [UserDiaktifkan] = "Akun diaktifkan",
        [UserResetPassword] = "Password direset",
        [BidangDibuat] = "Bidang dibuat",
        [BidangDiubah] = "Bidang diubah",
        [LaporanDibuat] = "Laporan dibuat",
        [LaporanDiubah] = "Laporan diubah",
        [LaporanDihapus] = "Laporan dihapus",
        [LaporanDikirim] = "Laporan dikirim",
        [LaporanDireview] = "Laporan direview",
        [BuktiDiunggah] = "Bukti diunggah",
        [BuktiDihapus] = "Bukti dihapus",
    };

    public static string LabelOf(string aksi) => Labels.TryGetValue(aksi, out var l) ? l : aksi;
}