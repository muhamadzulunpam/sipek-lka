using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SipekLka.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAccountFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAktif",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "TokenVersion",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "WajibGantiPassword",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Bidangs_Nama",
                table: "Bidangs",
                column: "Nama",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bidangs_Nama",
                table: "Bidangs");

            migrationBuilder.DropColumn(
                name: "IsAktif",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TokenVersion",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "WajibGantiPassword",
                table: "Users");
        }
    }
}
