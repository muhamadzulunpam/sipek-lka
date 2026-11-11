using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SipekLka.Api.Data;
using SipekLka.Api.Dtos;
using SipekLka.Api.Models;
using SipekLka.Api.Services;

namespace SipekLka.Api.Controllers;

[ApiController]
[Authorize(Roles = "Pimpinan")]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/audit/aksi : isi dropdown filter
    [HttpGet("aksi")]
    public ActionResult<List<AuditAksiItem>> Aksi() =>
        Ok(AuditActions.Labels.Select(x => new AuditAksiItem(x.Key, x.Value)).ToList());

    // GET /api/audit?aksi=LoginGagal&pengguna=ais&dari=...&sampai=...&page=1&pageSize=20
    // dari: inklusif. sampai: eksklusif. Keduanya berupa waktu (ISO 8601 dengan zona, mis. akhiran Z)
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogItem>>> GetAll(
        [FromQuery] string? aksi,
        [FromQuery] string? pengguna,
        [FromQuery] DateTimeOffset? dari,
        [FromQuery] DateTimeOffset? sampai,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        IQueryable<AuditLog> query = _db.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(aksi))
            query = query.Where(a => a.Aksi == aksi);

        if (!string.IsNullOrWhiteSpace(pengguna))
        {
            var p = pengguna.Trim();
            if (p.Length > 100) p = p[..100];
            query = query.Where(a => a.NamaPengguna.Contains(p));
        }

        // DateTimeOffset dipakai (bukan DateTime) supaya akhiran "Z" tidak diubah ke waktu server
        if (dari.HasValue)
        {
            var d = dari.Value.UtcDateTime;
            query = query.Where(a => a.WaktuUtc >= d);
        }
        if (sampai.HasValue)
        {
            var s = sampai.Value.UtcDateTime;
            query = query.Where(a => a.WaktuUtc < s);
        }

        var total = await query.CountAsync();

        var rows = await query
            .OrderByDescending(a => a.WaktuUtc).ThenByDescending(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = rows.Select(a => new AuditLogItem(
            a.Id, a.WaktuUtc, a.UserId, a.NamaPengguna, a.Aksi, AuditActions.LabelOf(a.Aksi),
            a.TipeData, a.DataId, a.Keterangan, a.IpAddress)).ToList();

        return Ok(new PagedResult<AuditLogItem>(items, page, pageSize, total));
    }
}