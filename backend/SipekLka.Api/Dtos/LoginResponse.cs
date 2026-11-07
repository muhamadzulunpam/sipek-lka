namespace SipekLka.Api.Dtos;

public record LoginResponse(
    string Token,
    DateTime ExpiresAt,
    string NamaLengkap,
    string Role,
    int? BidangId,
    string? NamaBidang);