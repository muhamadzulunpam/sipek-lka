using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SipekLka.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bidangs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nama = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bidangs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nama = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NamaLengkap = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    BidangId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Bidangs_BidangId",
                        column: x => x.BidangId,
                        principalTable: "Bidangs",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LaporanKinerja",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NamaKegiatan = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TanggalPelaksanaan = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Periode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tujuan = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Deskripsi = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Target = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Realisasi = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Capaian = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    KendalaTindakLanjut = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DibuatPada = table.Column<DateTime>(type: "datetime2", nullable: false),
                    BidangId = table.Column<int>(type: "int", nullable: false),
                    DibuatOlehUserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LaporanKinerja", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LaporanKinerja_Bidangs_BidangId",
                        column: x => x.BidangId,
                        principalTable: "Bidangs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LaporanKinerja_Users_DibuatOlehUserId",
                        column: x => x.DibuatOlehUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Bidangs",
                columns: new[] { "Id", "Nama" },
                values: new object[,]
                {
                    { 1, "Beasiswa" },
                    { 2, "Tracer Study Alumni dan TIK" },
                    { 3, "Organisasi Mahasiswa (ORMAWA)" },
                    { 4, "Mental Kebangsaan dan Kode Etik" },
                    { 5, "Pengembangan Karier dan Mahasiswa Internasional" }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Nama" },
                values: new object[,]
                {
                    { 1, "Pimpinan" },
                    { 2, "KepalaBidang" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_LaporanKinerja_BidangId",
                table: "LaporanKinerja",
                column: "BidangId");

            migrationBuilder.CreateIndex(
                name: "IX_LaporanKinerja_DibuatOlehUserId",
                table: "LaporanKinerja",
                column: "DibuatOlehUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_BidangId",
                table: "Users",
                column: "BidangId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LaporanKinerja");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Bidangs");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
