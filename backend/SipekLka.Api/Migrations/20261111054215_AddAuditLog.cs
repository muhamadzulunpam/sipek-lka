using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SipekLka.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WaktuUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    NamaPengguna = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Aksi = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TipeData = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DataId = table.Column<int>(type: "int", nullable: true),
                    Keterangan = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Aksi",
                table: "AuditLogs",
                column: "Aksi");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_WaktuUtc",
                table: "AuditLogs",
                column: "WaktuUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");
        }
    }
}
