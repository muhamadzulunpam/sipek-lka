namespace SipekLka.Api.Models;

public class Bidang
{
    public int Id { get; set; }
    public string Nama { get; set; } = string.Empty;
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<LaporanKinerja> Laporan { get; set; } = new List<LaporanKinerja>();
}