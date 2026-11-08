namespace SipekLka.Api.Dtos;

public record BuktiResponse(
    int Id,
    string NamaFile,
    string TipeKonten,
    long UkuranByte,
    DateTime DiunggahPada);