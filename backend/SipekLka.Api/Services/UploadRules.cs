using Microsoft.AspNetCore.Http;

namespace SipekLka.Api.Services;

public record UploadRule(string ContentType, byte[][] Signatures);

public static class UploadRules
{
    public const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
    public const int MaxFilesPerLaporan = 10;

    private static readonly byte[] Zip = { 0x50, 0x4B, 0x03, 0x04 }; // docx dan xlsx adalah file zip

    public static readonly Dictionary<string, UploadRule> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"]  = new("application/pdf", new[] { new byte[] { 0x25, 0x50, 0x44, 0x46 } }),
        [".png"]  = new("image/png", new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47 } }),
        [".jpg"]  = new("image/jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } }),
        [".jpeg"] = new("image/jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } }),
        [".docx"] = new("application/vnd.openxmlformats-officedocument.wordprocessingml.document", new[] { Zip }),
        [".xlsx"] = new("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new[] { Zip })
    };

    public static async Task<bool> HasValidSignatureAsync(IFormFile file, UploadRule rule)
    {
        var buffer = new byte[8];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAtLeastAsync(buffer.AsMemory(), 4, throwOnEndOfStream: false);

        return rule.Signatures.Any(sig =>
            read >= sig.Length && buffer.Take(sig.Length).SequenceEqual(sig));
    }
}