namespace SipekLka.Api.Models;

public class User
{
    public int Id { get; set; }
    public string NamaLengkap { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public int? BidangId { get; set; }   // null untuk Pimpinan
    public Bidang? Bidang { get; set; }
    
    public bool IsAktif { get; set; } = true;
    public bool WajibGantiPassword { get; set; }
    public int TokenVersion { get; set; }
}