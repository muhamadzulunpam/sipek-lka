using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SipekLka.Api.Models;

namespace SipekLka.Api.Services;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(User user);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public (string Token, DateTime ExpiresAt) CreateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpireMinutes"]!));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("name", user.NamaLengkap),
            new("email", user.Email),
            new("role", user.Role.Nama)
        };

        if (user.BidangId.HasValue)
            claims.Add(new Claim("bidangId", user.BidangId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}