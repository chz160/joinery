using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JoineryServer.Migrations
{
    /// <inheritdoc />
    public partial class AddLastHeadCommitShaToGitRepository : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastHeadCommitSha",
                table: "GitRepositories",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 9, 3, 37, 26, 963, DateTimeKind.Utc).AddTicks(8718), new DateTime(2026, 3, 9, 3, 37, 26, 963, DateTimeKind.Utc).AddTicks(8718) });

            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 9, 3, 37, 26, 963, DateTimeKind.Utc).AddTicks(8726), new DateTime(2026, 3, 9, 3, 37, 26, 963, DateTimeKind.Utc).AddTicks(8726) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastHeadCommitSha",
                table: "GitRepositories");

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
        }
    }
}
