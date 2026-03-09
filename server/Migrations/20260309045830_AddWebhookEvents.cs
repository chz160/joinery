using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace JoineryServer.Migrations
{
    /// <inheritdoc />
    public partial class AddWebhookEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WebhookEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    DeliveryId = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Payload = table.Column<string>(type: "text", nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RepositoryFullName = table.Column<string>(type: "text", nullable: true),
                    Branch = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookEvents", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 9, 4, 58, 30, 337, DateTimeKind.Utc).AddTicks(4728), new DateTime(2026, 3, 9, 4, 58, 30, 337, DateTimeKind.Utc).AddTicks(4729) });

            migrationBuilder.UpdateData(
                table: "DatabaseQueries",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "UpdatedAt" },
                values: new object[] { new DateTime(2026, 3, 9, 4, 58, 30, 337, DateTimeKind.Utc).AddTicks(4745), new DateTime(2026, 3, 9, 4, 58, 30, 337, DateTimeKind.Utc).AddTicks(4745) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WebhookEvents");

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
    }
}
