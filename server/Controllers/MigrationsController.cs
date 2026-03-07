using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JoineryServer.Data;

namespace JoineryServer.Controllers;

/// <summary>
/// Admin-only endpoints for database migration management.
/// Provides status reporting, dry-run SQL generation, migration application,
/// and checksum validation.
/// </summary>
[ApiController]
[Route("api/migrations")]
[Authorize]
public class MigrationsController : ControllerBase
{
    private readonly IMigrationService _migrationService;
    private readonly ILogger<MigrationsController> _logger;

    public MigrationsController(IMigrationService migrationService, ILogger<MigrationsController> logger)
    {
        _migrationService = migrationService;
        _logger = logger;
    }

    /// <summary>
    /// Returns the current migration status: applied migrations, pending migrations,
    /// and whether the database is up to date.
    /// </summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(MigrationStatus), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatus()
    {
        var status = await _migrationService.GetStatusAsync();
        return Ok(status);
    }

    /// <summary>
    /// Generates the idempotent SQL script for all pending migrations without applying
    /// them (dry run). Returns plain text SQL.
    /// </summary>
    [HttpGet("script")]
    [Produces("text/plain")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetScript()
    {
        var script = await _migrationService.GenerateScriptAsync();
        return Content(script, "text/plain");
    }

    /// <summary>
    /// Applies all pending migrations.
    /// In production environments, pass <c>force=true</c> to override the production
    /// safeguard that prevents auto-application. Requires admin authorization.
    /// </summary>
    [HttpPost("apply")]
    [ProducesResponseType(typeof(MigrationApplyResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Apply([FromQuery] bool force = false)
    {
        _logger.LogInformation("Migration apply requested by {User} (force={Force})",
            User.Identity?.Name ?? "unknown", force);

        var result = await _migrationService.ApplyMigrationsAsync(forceProduction: force);
        return Ok(result);
    }

    /// <summary>
    /// Validates the checksums of all applied migrations.
    /// A mismatch indicates that a migration was modified after it was applied.
    /// </summary>
    [HttpGet("validate")]
    [ProducesResponseType(typeof(IReadOnlyList<ChecksumValidationResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Validate()
    {
        var results = await _migrationService.ValidateChecksumsAsync();
        var allValid = results.All(r => r.IsValid);
        return Ok(new
        {
            IsValid = allValid,
            Results = results
        });
    }
}
