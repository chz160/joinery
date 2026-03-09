using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JoineryServer.Data;
using JoineryServer.Services;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace JoineryServer.Controllers;

[ApiController]
[Route("api/webhooks")]
[AllowAnonymous]
public class WebhooksController : ControllerBase
{
    private readonly JoineryDbContext _context;
    private readonly IGitRepositoryService _gitService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        JoineryDbContext context,
        IGitRepositoryService gitService,
        IConfiguration configuration,
        ILogger<WebhooksController> logger)
    {
        _context = context;
        _gitService = gitService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Receives GitHub webhook push events and triggers an incremental sync
    /// for the affected repository.
    /// </summary>
    [HttpPost("github")]
    public async Task<IActionResult> GitHubWebhook()
    {
        var secret = _configuration["GitHub:WebhookSecret"];
        if (string.IsNullOrEmpty(secret))
        {
            _logger.LogWarning("GitHub webhook received but GitHub:WebhookSecret is not configured; rejecting request");
            return StatusCode(503, new { message = "Webhook processing is not configured." });
        }

        // Buffer the raw body so we can verify the signature.
        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        if (!ValidateSignature(rawBody, secret, Request.Headers["X-Hub-Signature-256"].FirstOrDefault()))
        {
            _logger.LogWarning("GitHub webhook signature validation failed");
            return Unauthorized(new { message = "Invalid webhook signature." });
        }

        var eventType = Request.Headers["X-GitHub-Event"].FirstOrDefault();
        _logger.LogInformation("GitHub webhook received: event={Event}", eventType);

        if (eventType != "push")
        {
            // Accept but ignore non-push events.
            return Ok(new { message = $"Event '{eventType}' acknowledged but not processed." });
        }

        GitHubPushEvent? pushEvent;
        try
        {
            pushEvent = JsonSerializer.Deserialize<GitHubPushEvent>(rawBody, JsonOptions);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize GitHub push event");
            return BadRequest(new { message = "Invalid push event payload." });
        }

        if (pushEvent?.Repository == null)
        {
            return BadRequest(new { message = "Missing repository in push event payload." });
        }

        var pushedBranch = pushEvent.Ref?.Replace("refs/heads/", "") ?? "";
        var repoFullName = pushEvent.Repository.FullName; // "owner/repo"

        _logger.LogInformation("Push event for repository {FullName} on branch {Branch}",
            repoFullName, pushedBranch);

        // Pre-filter in the database using a URL substring match to avoid loading every
        // repository into memory, then apply exact matching via the canonical URL parser.
        var candidates = await _context.GitRepositories
            .Where(r => r.IsActive && r.RepositoryUrl.Contains(repoFullName))
            .Include(r => r.QueryFiles.Where(qf => qf.IsActive))
            .ToListAsync();

        var matched = candidates.Where(r =>
        {
            var (owner, repo) = GitRepositoryService.ParseGitHubUrl(r.RepositoryUrl);
            return string.Equals($"{owner}/{repo}", repoFullName, StringComparison.OrdinalIgnoreCase) &&
                   string.Equals(r.Branch ?? "main", pushedBranch, StringComparison.OrdinalIgnoreCase);
        }).ToList();

        if (matched.Count == 0)
        {
            _logger.LogInformation("No tracked repositories match {FullName}@{Branch}", repoFullName, pushedBranch);
            return Ok(new { message = "No matching repository found." });
        }

        var syncedCount = 0;
        foreach (var repository in matched)
        {
            try
            {
                var existingFiles = repository.QueryFiles.Where(f => f.IsActive).ToList();
                var syncResult = await _gitService.IncrementalSyncRepositoryAsync(repository, existingFiles);

                _context.ApplyIncrementalSyncResult(repository, syncResult);

                repository.LastSyncAt = DateTime.UtcNow;
                repository.LastHeadCommitSha = syncResult.HeadCommitSha ?? repository.LastHeadCommitSha;
                await _context.SaveChangesAsync();
                syncedCount++;

                _logger.LogInformation(
                    "Webhook sync for repository {Id}: +{Added} ~{Modified} -{Deleted} (noOp={NoOp}, fullSync={FullSync})",
                    repository.Id, syncResult.Added.Count, syncResult.Modified.Count,
                    syncResult.DeletedFilePaths.Count, syncResult.IsNoOp, syncResult.IsFullSync);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Webhook sync failed for repository {RepositoryId}", repository.Id);
            }
        }

        return Ok(new { message = $"Sync triggered for {syncedCount} repository/repositories." });
    }

    /// <summary>
    /// Validates the HMAC-SHA256 signature from GitHub.
    /// Expected header format: <c>sha256=&lt;hex-digest&gt;</c>
    /// </summary>
    public static bool ValidateSignature(string rawBody, string secret, string? signatureHeader)
    {
        if (string.IsNullOrEmpty(signatureHeader) ||
            !signatureHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            return false;

        var receivedHex = signatureHeader["sha256=".Length..];
        var secretBytes = Encoding.UTF8.GetBytes(secret);
        var bodyBytes = Encoding.UTF8.GetBytes(rawBody);

        var expectedBytes = Convert.FromHexString(
            Convert.ToHexString(HMACSHA256.HashData(secretBytes, bodyBytes)));

        // Guard: return false immediately for any invalid hex rather than letting
        // Convert.FromHexString throw a FormatException at comparison time.
        byte[] receivedBytes;
        try
        {
            receivedBytes = Convert.FromHexString(receivedHex);
        }
        catch (FormatException)
        {
            return false;
        }

        return CryptographicOperations.FixedTimeEquals(receivedBytes, expectedBytes);
    }

    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

    private sealed class GitHubPushEvent
    {
        [JsonPropertyName("ref")]
        public string? Ref { get; set; }

        [JsonPropertyName("repository")]
        public GitHubPushRepository? Repository { get; set; }
    }

    private sealed class GitHubPushRepository
    {
        [JsonPropertyName("full_name")]
        public string FullName { get; set; } = "";
    }
}

