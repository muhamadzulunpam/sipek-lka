namespace SipekLka.Api.Dtos;

public record BidangStat(
    int BidangId,
    string NamaBidang,
    int Draft,
    int Submitted,
    int Revision,
    int Approved,
    int Rejected)
{
    public int Total => Draft + Submitted + Revision + Approved + Rejected;
}

public record DashboardResponse(
    string? Periode,
    int Total,
    int Draft,
    int Submitted,
    int Revision,
    int Approved,
    int Rejected,
    int? TotalKepalaBidang,          // hanya diisi untuk Pimpinan
    IReadOnlyList<BidangStat> PerBidang);