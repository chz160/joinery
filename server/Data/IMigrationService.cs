namespace JoineryServer.Data;

/// <summary>
/// Provides migration management: status, dry-run SQL generation, apply, and checksum validation.
/// </summary>
public interface IMigrationService
{
    /// <summary>Returns the current migration status (applied + pending migrations).</summary>
    Task<MigrationStatus> GetStatusAsync();

    /// <summary>
    /// Generates the SQL script for all pending migrations without applying them (dry run).
    /// </summary>
    Task<string> GenerateScriptAsync();

    /// <summary>
    /// Applies all pending migrations.
    /// In production environments the method is a no-op and logs a warning instead of applying;
    /// pass <paramref name="forceProduction"/> = <c>true</c> (via admin API) to override.
    /// </summary>
    Task<MigrationApplyResult> ApplyMigrationsAsync(bool forceProduction = false);

    /// <summary>
    /// Validates the checksums of every applied migration.
    /// A mismatch indicates that a migration file was modified after it was applied.
    /// </summary>
    Task<IReadOnlyList<ChecksumValidationResult>> ValidateChecksumsAsync();
}

public sealed record MigrationStatus
{
    public IReadOnlyList<string> AppliedMigrations { get; init; } = [];
    public IReadOnlyList<string> PendingMigrations { get; init; } = [];
    public bool IsUpToDate => PendingMigrations.Count == 0;
    public bool IsRelational { get; init; }
}

public sealed record MigrationApplyResult
{
    public bool Applied { get; init; }
    public IReadOnlyList<string> MigrationsApplied { get; init; } = [];
    public IReadOnlyList<string> PendingMigrations { get; init; } = [];
    public string Message { get; init; } = string.Empty;
}

public sealed record ChecksumValidationResult
{
    public string MigrationId { get; init; } = string.Empty;
    public bool IsValid { get; init; }
    public string Message { get; init; } = string.Empty;
}

public sealed record ChecksumValidationReport
{
    public bool IsValid { get; init; }
    public IReadOnlyList<ChecksumValidationResult> Results { get; init; } = [];
}
