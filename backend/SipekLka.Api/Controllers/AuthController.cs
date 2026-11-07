using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Data;
using SipekLka.Api.Dtos;
using SipekLka.Api.Services;

namespace SipekLka.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwt;

    public AuthController(AppDbContext db, IJwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .Include(u => u.Bidang)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Email atau password salah." });

        var (token, expiresAt) = _jwt.CreateToken(user);

        return Ok(new LoginResponse(
            token, expiresAt, user.NamaLengkap, user.Role.Nama, user.BidangId, user.Bidang?.Nama));
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value,
            nama = User.FindFirst("name")?.Value,
            role = User.FindFirst("role")?.Value,
            bidangId = User.FindFirst("bidangId")?.Value
        });
    }

}