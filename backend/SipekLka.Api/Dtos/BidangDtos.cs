using System.ComponentModel.DataAnnotations;

namespace SipekLka.Api.Dtos;

public class BidangRequest
{
    [Required(ErrorMessage = "Nama bidang wajib diisi."), StringLength(150)]
    public string Nama { get; set; } = string.Empty;
}

public record BidangResponse(int Id, string Nama);