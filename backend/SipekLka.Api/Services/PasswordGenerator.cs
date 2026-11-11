using System.Security.Cryptography;

namespace SipekLka.Api.Services;

public static class PasswordGenerator
{
    // Tanpa karakter yang mudah tertukar (0/O, 1/l/I) supaya mudah disampaikan
    private const string Letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private const string Digits = "23456789";

    public static string Generate(int length = 12)
    {
        const string all = Letters + Digits;
        var chars = new char[length];

        chars[0] = Letters[RandomNumberGenerator.GetInt32(Letters.Length)]; // minimal satu huruf
        chars[1] = Digits[RandomNumberGenerator.GetInt32(Digits.Length)];   // minimal satu angka
        for (var i = 2; i < length; i++)
            chars[i] = all[RandomNumberGenerator.GetInt32(all.Length)];

        RandomNumberGenerator.Shuffle(chars.AsSpan());
        return new string(chars);
    }
}