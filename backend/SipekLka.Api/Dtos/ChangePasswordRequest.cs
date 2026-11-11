using System.ComponentModel.DataAnnotations;

namespace SipekLka.Api.Dtos;

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Password lama wajib diisi.")]
    public string PasswordLama { get; set; } = string.Empty;

    // Maksimal 72 karakter: batas yang diproses BCrypt
    [Required(ErrorMessage = "Password baru wajib diisi.")]
    [StringLength(72, MinimumLength = 8, ErrorMessage = "Password baru harus 8 sampai 72 karakter.")]
    [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$", ErrorMessage = "Password baru harus mengandung huruf dan angka.")]
    public string PasswordBaru { get; set; } = string.Empty;
}