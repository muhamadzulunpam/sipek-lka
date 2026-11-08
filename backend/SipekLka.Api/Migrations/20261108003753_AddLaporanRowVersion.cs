using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SipekLka.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLaporanRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "LaporanKinerja",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "LaporanKinerja");
        }
    }
}
