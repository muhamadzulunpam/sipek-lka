namespace SipekLka.Api.Services;

public interface IFileStorage
{
    Task<string> SaveAsync(IFormFile file, string extension);
    bool Exists(string storedName);
    Stream Open(string storedName);
    void Delete(string storedName);
}

public class LocalFileStorage : IFileStorage
{
    private readonly string _root;

    public LocalFileStorage(IConfiguration config, IHostEnvironment env)
    {
        var relative = config["Upload:RootPath"] ?? "Storage/bukti";
        _root = Path.GetFullPath(Path.Combine(env.ContentRootPath, relative));
        Directory.CreateDirectory(_root);
    }

    public async Task<string> SaveAsync(IFormFile file, string extension)
    {
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(_root, storedName);

        await using var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write);
        await file.CopyToAsync(stream);

        return storedName; // yang disimpan di database hanya nama ini, bukan path lengkap
    }

    public bool Exists(string storedName) => File.Exists(Resolve(storedName));

    public Stream Open(string storedName) =>
        new FileStream(Resolve(storedName), FileMode.Open, FileAccess.Read, FileShare.Read);

    public void Delete(string storedName)
    {
        var path = Resolve(storedName);
        if (File.Exists(path)) File.Delete(path);
    }

    // Pengaman berlapis: pastikan path akhir benar-benar berada di dalam folder penyimpanan
    private string Resolve(string storedName)
    {
        var full = Path.GetFullPath(Path.Combine(_root, storedName));
        if (!full.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            throw new InvalidOperationException("Path file tidak valid.");
        return full;
    }
}