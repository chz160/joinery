using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JoineryServer.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationNameUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 8, 22, 39, 51, 395, DateTimeKind.Utc).AddTicks(6930), new DateTime(2026, 3, 8, 22, 39, 51, 395, DateTimeKind.Utc).AddTicks(6931) });

            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 8, 22, 39, 51, 395, DateTimeKind.Utc).AddTicks(6939), new DateTime(2026, 3, 8, 22, 39, 51, 395, DateTimeKind.Utc).AddTicks(6940) });

            migrationBuilder.CreateIndex(
                name: "IX_Organizations_Name",
                table: "Organizations",
                column: "Name",
                unique: true,
                filter: "\"IsActive\" = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Organizations_Name",
                table: "Organizations");

            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 7, 23, 12, 35, 434, DateTimeKind.Utc).AddTicks(8415), new DateTime(2026, 3, 7, 23, 12, 35, 434, DateTimeKind.Utc).AddTicks(8416) });

            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 7, 23, 12, 35, 434, DateTimeKind.Utc).AddTicks(8425), new DateTime(2026, 3, 7, 23, 12, 35, 434, DateTimeKind.Utc).AddTicks(8425) });
        }
    }
}
