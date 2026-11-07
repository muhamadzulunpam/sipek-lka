using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Data;
using Microsoft.AspNetCore.Authorization;

namespace SipekLka.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BidangController : ControllerBase
{
    private readonly AppDbContext _db;

    public BidangController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _db.Bidangs
            .OrderBy(b => b.Id)
            .Select(b => new { b.Id, b.Nama })
            .ToListAsync();

        return Ok(data);
    }
}