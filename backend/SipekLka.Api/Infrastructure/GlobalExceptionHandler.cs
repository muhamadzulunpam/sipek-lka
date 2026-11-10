using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace SipekLka.Api.Infrastructure;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly string[] _corsOrigins;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IConfiguration config)
    {
        _logger = logger;
        _corsOrigins = config.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        // Klien menutup koneksi sendiri (pindah halaman, batal): bukan error server
        if (exception is OperationCanceledException && context.RequestAborted.IsCancellationRequested)
            return true;

        var (status, message) = exception switch
        {
            DbUpdateConcurrencyException =>
                (StatusCodes.Status409Conflict,
                 "Data baru saja diubah oleh pengguna lain. Muat ulang lalu coba lagi."),
            BadHttpRequestException { StatusCode: StatusCodes.Status413PayloadTooLarge } =>
                (StatusCodes.Status413PayloadTooLarge, "Ukuran data yang dikirim terlalu besar."),
            BadHttpRequestException bad =>
                (bad.StatusCode, "Permintaan tidak valid."),
            _ =>
                (StatusCodes.Status500InternalServerError, "Terjadi kesalahan pada server. Coba lagi nanti.")
        };

        if (status >= 500)
            _logger.LogError(exception, "Unhandled exception. TraceId: {TraceId}", context.TraceIdentifier);
        else
            _logger.LogWarning("Request ditolak ({Status}): {Type}. TraceId: {TraceId}",
                status, exception.GetType().Name, context.TraceIdentifier);

        // Middleware exception handler dapat menghapus header respons, termasuk header CORS.
        // Tanpa ini, browser menampilkan "blocked by CORS policy" dan pesan error tidak terbaca Angular.
        var origin = context.Request.Headers.Origin.ToString();
        if (origin.Length > 0 && _corsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
            context.Response.Headers.Append("Vary", "Origin");
        }

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(
            new { message, traceId = context.TraceIdentifier }, cancellationToken);

        return true;
    }
}