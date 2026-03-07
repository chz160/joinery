using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using System.Security.Cryptography;
using System.Text;

namespace JoineryServer.Data;

/// <summary>
/// Implements <see cref="IMigrationService"/> using EF Core and PostgreSQL advisory locks.
/// When a relational database is not configured the service falls back gracefully to the
/// in-memory provider (no-op for migration operations).
/// </summary>
public sealed class MigrationService : IMigrationService
{
    // Raw table name for storing per-migration checksums.
    private const string ChecksumTable = "__MigrationChecksums";

    private readonly JoineryDbContext _context;
    private readonly ILogger<MigrationService> _logger;
    private readonly IHostEnvironment _environment;

    public MigrationService(
        JoineryDbContext context,
        ILogger<MigrationService> logger,
        IHostEnvironment environment)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
    }

    // -------------------------------------------------------------------------
    // Status
    // -------------------------------------------------------------------------

    public async Task<MigrationStatus> GetStatusAsync()
    {
        if (!_context.Database.IsRelational())
        {
            return new MigrationStatus
            {
                AppliedMigrations = [],
                PendingMigrations = [],
                IsRelational = false
            };
        }

        var applied = (await _context.Database.GetAppliedMigrationsAsync()).ToList();
        var pending = (await _context.Database.GetPendingMigrationsAsync()).ToList();

        return new MigrationStatus
        {
            AppliedMigrations = applied,
            PendingMigrations = pending,
            IsRelational = true
        };
    }

    // -------------------------------------------------------------------------
    // Dry run
    // -------------------------------------------------------------------------

    public Task<string> GenerateScriptAsync()
    {
        if (!_context.Database.IsRelational())
            return Task.FromResult("-- In-memory database: no SQL script available.");

        var migrator = _context.Database.GetService<IMigrator>();
        // Idempotent wraps each statement in an existence check so the script
        // can be safely re-run.
        var script = migrator.GenerateScript(options: MigrationsSqlGenerationOptions.Idempotent);
        return Task.FromResult(string.IsNullOrWhiteSpace(script)
            ? "-- No pending migrations."
            : script);
    }

    // -------------------------------------------------------------------------
    // Apply
    // -------------------------------------------------------------------------

    public async Task<MigrationApplyResult> ApplyMigrationsAsync(bool forceProduction = false)
    {
        if (!_context.Database.IsRelational())
        {
            _logger.LogInformation("In-memory database configured; ensuring schema is created.");
            await _context.Database.EnsureCreatedAsync();
            return new MigrationApplyResult
            {
                Applied = false,
                Message = "In-memory database: EnsureCreated used instead of migrations."
            };
        }

        var pending = (await _context.Database.GetPendingMigrationsAsync()).ToList();

        if (pending.Count == 0)
        {
            _logger.LogInformation("No pending migrations.");
            return new MigrationApplyResult { Applied = false, Message = "Already up to date." };
        }

        // Production safeguard: require an explicit opt-in.
        if (_environment.IsProduction() && !forceProduction)
        {
            _logger.LogWarning(
                "Production environment: {Count} pending migration(s) detected but auto-apply is disabled. " +
                "Call POST /api/migrations/apply with admin authorization to apply.",
                pending.Count);
            return new MigrationApplyResult
            {
                Applied = false,
                MigrationsApplied = pending,
                Message = $"Production safeguard: {pending.Count} migration(s) pending. " +
                          "POST /api/migrations/apply to apply."
            };
        }

        _logger.LogInformation("Applying {Count} pending migration(s)...", pending.Count);

        // EF Core / Npgsql uses PostgreSQL advisory locks internally to prevent
        // concurrent migration runs.
        await _context.Database.MigrateAsync();

        await EnsureChecksumTableAsync();
        await StoreChecksumsAsync(pending);

        _logger.LogInformation("Successfully applied {Count} migration(s).", pending.Count);

        return new MigrationApplyResult
        {
            Applied = true,
            MigrationsApplied = pending,
            Message = $"Applied {pending.Count} migration(s) successfully."
        };
    }

    // -------------------------------------------------------------------------
    // Checksum validation
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<ChecksumValidationResult>> ValidateChecksumsAsync()
    {
        if (!_context.Database.IsRelational())
            return [];

        await EnsureChecksumTableAsync();

        var applied = (await _context.Database.GetAppliedMigrationsAsync())
            .OrderBy(m => m)
            .ToList();

        if (applied.Count == 0)
            return [];

        var results = new List<ChecksumValidationResult>(applied.Count);
        var migrator = _context.Database.GetService<IMigrator>();

        for (var i = 0; i < applied.Count; i++)
        {
            var migrationId = applied[i];
            var fromMigration = i == 0 ? null : applied[i - 1];
            var currentChecksum = ComputeChecksum(migrator, fromMigration, migrationId);
            var storedChecksum = await GetStoredChecksumAsync(migrationId);

            if (storedChecksum is null)
            {
                results.Add(new ChecksumValidationResult
                {
                    MigrationId = migrationId,
                    IsValid = false,
                    Message = "No checksum stored — migration was applied before checksum tracking was introduced."
                });
                continue;
            }

            var isValid = string.Equals(storedChecksum, currentChecksum, StringComparison.Ordinal);
            results.Add(new ChecksumValidationResult
            {
                MigrationId = migrationId,
                IsValid = isValid,
                Message = isValid
                    ? "OK"
                    : "Checksum mismatch — migration may have been modified after it was applied."
            });
        }

        return results;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Creates the <c>__MigrationChecksums</c> table if it does not yet exist.
    /// Using raw DDL keeps this table outside the EF Core model to avoid a
    /// chicken-and-egg bootstrapping problem.
    /// NOTE: This DDL uses PostgreSQL-specific syntax (TIMESTAMPTZ, now()) and is
    /// therefore tied to the PostgreSQL provider used in production.
    /// </summary>
    private async Task EnsureChecksumTableAsync()
    {
        await _context.Database.ExecuteSqlRawAsync($$"""
            CREATE TABLE IF NOT EXISTS "{{ChecksumTable}}" (
                "MigrationId"  TEXT        NOT NULL PRIMARY KEY,
                "Checksum"     TEXT        NOT NULL,
                "AppliedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """);
    }

    private async Task StoreChecksumsAsync(IEnumerable<string> migrationIds)
    {
        var orderedIds = migrationIds.OrderBy(m => m).ToList();
        var allApplied = (await _context.Database.GetAppliedMigrationsAsync())
            .OrderBy(m => m)
            .ToList();

        var migrator = _context.Database.GetService<IMigrator>();

        foreach (var id in orderedIds)
        {
            var idx = allApplied.IndexOf(id);
            var fromMigration = idx > 0 ? allApplied[idx - 1] : null;
            var checksum = ComputeChecksum(migrator, fromMigration, id);

            await _context.Database.ExecuteSqlRawAsync(
                $$"""
                INSERT INTO "{{ChecksumTable}}" ("MigrationId", "Checksum")
                VALUES ({0}, {1})
                ON CONFLICT ("MigrationId") DO UPDATE SET "Checksum" = excluded."Checksum"
                """,
                id, checksum);
        }
    }

    private async Task<string?> GetStoredChecksumAsync(string migrationId)
    {
        // Use raw SQL to avoid requiring the checksum entity in the EF model.
        var conn = _context.Database.GetDbConnection();
        var wasOpen = conn.State == System.Data.ConnectionState.Open;
        if (!wasOpen) await conn.OpenAsync();

        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText =
                $$"""SELECT "Checksum" FROM "{{ChecksumTable}}" WHERE "MigrationId" = @id""";
            var param = cmd.CreateParameter();
            param.ParameterName = "@id";
            param.Value = migrationId;
            cmd.Parameters.Add(param);

            var result = await cmd.ExecuteScalarAsync();
            return result as string;
        }
        finally
        {
            if (!wasOpen) await conn.CloseAsync();
        }
    }

    /// <summary>
    /// Computes a SHA-256 checksum of the idempotent SQL generated for the migration
    /// range [<paramref name="fromMigration"/>, <paramref name="toMigration"/>].
    /// </summary>
    private static string ComputeChecksum(IMigrator migrator, string? fromMigration, string toMigration)
    {
        var sql = migrator.GenerateScript(
            fromMigration: fromMigration,
            toMigration: toMigration,
            options: MigrationsSqlGenerationOptions.Idempotent);

        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(sql));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
