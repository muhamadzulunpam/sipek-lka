using System.ComponentModel.DataAnnotations;

namespace SipekLka.Api.Dtos;

public class UserRequest
{
    [Required(ErrorMessage = "Nama wajib diisi."), StringLength(150)]
    public string NamaLengkap { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email wajib diisi."), EmailAddress, StringLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Bidang wajib dipilih.")]
    public int? BidangId { get; set; }
}

public record UserResponse(
    int Id,
    string NamaLengkap,
    string Email,
    int? BidangId,
    string? NamaBidang,
    bool IsAktif,
    bool WajibGantiPassword);

public record UserWithPasswordResponse(UserResponse User, string PasswordSementara);

public record PasswordResetResponse(string PasswordSementara);