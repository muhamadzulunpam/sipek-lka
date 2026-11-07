using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SipekLka.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReportRelatedEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BuktiLaporan",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NamaFile = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PathFile = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TipeKonten = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UkuranByte = table.Column<long>(type: "bigint", nullable: false),
                    DiunggahPada = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LaporanKinerjaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuktiLaporan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BuktiLaporan_LaporanKinerja_LaporanKinerjaId",
                        column: x => x.LaporanKinerjaId,
                        principalTable: "LaporanKinerja",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReviewLaporan",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Keputusan = table.Column<int>(type: "int", nullable: false),
                    Catatan = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DireviewPada = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LaporanKinerjaId = table.Column<int>(type: "int", nullable: false),
                    ReviewerUserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewLaporan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewLaporan_LaporanKinerja_LaporanKinerjaId",
                        column: x => x.LaporanKinerjaId,
                        principalTable: "LaporanKinerja",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReviewLaporan_Users_ReviewerUserId",
                        column: x => x.ReviewerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RiwayatStatus",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StatusLama = table.Column<int>(type: "int", nullable: false),
                    StatusBaru = table.Column<int>(type: "int", nullable: false),
                    Keterangan = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DiubahPada = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LaporanKinerjaId = table.Column<int>(type: "int", nullable: false),
                    DiubahOlehUserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiwayatStatus", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiwayatStatus_LaporanKinerja_LaporanKinerjaId",
                        column: x => x.LaporanKinerjaId,
                        principalTable: "LaporanKinerja",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RiwayatStatus_Users_DiubahOlehUserId",
                        column: x => x.DiubahOlehUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BuktiLaporan_LaporanKinerjaId",
                table: "BuktiLaporan",
                column: "LaporanKinerjaId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewLaporan_LaporanKinerjaId",
                table: "ReviewLaporan",
                column: "LaporanKinerjaId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewLaporan_ReviewerUserId",
                table: "ReviewLaporan",
                column: "ReviewerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RiwayatStatus_DiubahOlehUserId",
                table: "RiwayatStatus",
                column: "DiubahOlehUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RiwayatStatus_LaporanKinerjaId",
                table: "RiwayatStatus",
                column: "LaporanKinerjaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BuktiLaporan");

            migrationBuilder.DropTable(
                name: "ReviewLaporan");

            migrationBuilder.DropTable(
                name: "RiwayatStatus");
        }
    }
}
