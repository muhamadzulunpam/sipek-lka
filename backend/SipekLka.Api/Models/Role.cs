namespace SipekLka.Api.Models;

public class Role
{
    public int Id { get; set; }
    public string Nama { get; set; } = string.Empty; // "Pimpinan" atau "KepalaBidang"
    public ICollection<User> Users { get; set; } = new List<User>();
}