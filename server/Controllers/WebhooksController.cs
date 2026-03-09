using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using JoineryServer.Data;
using JoineryServer.Models;
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
    private readonly IWebhookEventQueue _queue;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        JoineryDbContext context,
        IWebhookEventQueue queue,
        IConfiguration configuration,
        ILogger<WebhooksController> logger)
    {
        _context = context;
        _queue = queue;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Receives GitHub webhook events and queues them for background processing.
    /// Supports push and pull_request events.
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

        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        if (!ValidateGitHubSignature(rawBody, secret, Request.Headers["X-Hub-Signature-256"].FirstOrDefault()))
        {
            _logger.LogWarning("GitHub webhook signature validation failed");
            return Unauthorized(new { message = "Invalid webhook signature." });
        }

        var eventType = Request.Headers["X-GitHub-Event"].FirstOrDefault() ?? "";
        var deliveryId = Request.Headers["X-GitHub-Delivery"].FirstOrDefault();
        _logger.LogInformation("GitHub webhook received: event={Event}, delivery={DeliveryId}", eventType, deliveryId);

        var (repoFullName, branch) = ParseGitHubPayload(eventType, rawBody);

        var webhookEvent = new WebhookEvent
        {
            Provider = "github",
            EventType = eventType,
            DeliveryId = deliveryId,
            Payload = rawBody,
            RepositoryFullName = repoFullName,
            Branch = branch,
            ReceivedAt = DateTime.UtcNow
        };

        _context.WebhookEvents.Add(webhookEvent);
        await _context.SaveChangesAsync(HttpContext.RequestAborted);

        try
        {
            await _queue.QueueAsync(webhookEvent.Id, HttpContext.RequestAborted);
        }
        catch (InvalidOperationException)
        {
            _logger.LogWarning("Webhook event queue is full; GitHub event {EventId} persisted but not queued", webhookEvent.Id);
            return StatusCode(503, new { message = "Webhook event queue is saturated. Event was persisted but could not be queued for processing.", eventId = webhookEvent.Id });
        }

        _logger.LogInformation("GitHub webhook event {EventId} queued for processing (type={EventType})",
            webhookEvent.Id, eventType);

        return Ok(new { message = $"Event '{eventType}' received and queued for processing.", eventId = webhookEvent.Id });
    }

    /// <summary>
    /// Receives GitLab webhook events and queues them for background processing.
    /// Validates the shared secret via the <c>X-Gitlab-Token</c> header.
    /// Supports push and merge_request events.
    /// </summary>
    [HttpPost("gitlab")]
    public async Task<IActionResult> GitLabWebhook()
    {
        var secret = _configuration["GitLab:WebhookSecret"];
        if (string.IsNullOrEmpty(secret))
        {
            _logger.LogWarning("GitLab webhook received but GitLab:WebhookSecret is not configured; rejecting request");
            return StatusCode(503, new { message = "Webhook processing is not configured." });
        }

        var token = Request.Headers["X-Gitlab-Token"].FirstOrDefault();
        if (!ValidateGitLabToken(secret, token))
        {
            _logger.LogWarning("GitLab webhook token validation failed");
            return Unauthorized(new { message = "Invalid webhook token." });
        }

        string rawBody;
        using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
        {
            rawBody = await reader.ReadToEndAsync();
        }

        var eventType = Request.Headers["X-Gitlab-Event"].FirstOrDefault() ?? "";
        // Normalise: "Push Hook" → "push", "Merge Request Hook" → "merge_request"
        var normalisedEventType = NormaliseGitLabEvent(eventType);

        _logger.LogInformation("GitLab webhook received: event={Event}", eventType);

        var (repoFullName, branch) = ParseGitLabPayload(normalisedEventType, rawBody);

        var webhookEvent = new WebhookEvent
        {
            Provider = "gitlab",
            EventType = normalisedEventType,
            Payload = rawBody,
            RepositoryFullName = repoFullName,
            Branch = branch,
            ReceivedAt = DateTime.UtcNow
        };

        _context.WebhookEvents.Add(webhookEvent);
        await _context.SaveChangesAsync(HttpContext.RequestAborted);

        try
        {
            await _queue.QueueAsync(webhookEvent.Id, HttpContext.RequestAborted);
        }
        catch (InvalidOperationException)
        {
            _logger.LogWarning("Webhook event queue is full; GitLab event {EventId} persisted but not queued", webhookEvent.Id);
            return StatusCode(503, new { message = "Webhook event queue is saturated. Event was persisted but could not be queued for processing.", eventId = webhookEvent.Id });
        }

        _logger.LogInformation("GitLab webhook event {EventId} queued for processing (type={EventType})",
            webhookEvent.Id, normalisedEventType);

        return Ok(new { message = $"Event '{normalisedEventType}' received and queued for processing.", eventId = webhookEvent.Id });
    }

    // ── GitHub signature validation ──────────────────────────────────────────

    /// <summary>
    /// Validates the HMAC-SHA256 signature from GitHub.
    /// Expected header format: <c>sha256=&lt;hex-digest&gt;</c>
    /// </summary>
    public static bool ValidateGitHubSignature(string rawBody, string secret, string? signatureHeader)
    {
        if (string.IsNullOrEmpty(signatureHeader) ||
            !signatureHeader.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            return false;

        var receivedHex = signatureHeader["sha256=".Length..];
        var secretBytes = Encoding.UTF8.GetBytes(secret);
        var bodyBytes = Encoding.UTF8.GetBytes(rawBody);

        var expectedBytes = HMACSHA256.HashData(secretBytes, bodyBytes);

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

    /// <summary>
    /// Validates the <c>X-Gitlab-Token</c> header against the configured secret.
    /// Both values are hashed with SHA-256 before comparison so that
    /// <see cref="CryptographicOperations.FixedTimeEquals"/> always compares
    /// equal-length byte arrays, preventing length-based timing leaks.
    /// </summary>
    public static bool ValidateGitLabToken(string secret, string? tokenHeader)
    {
        if (string.IsNullOrEmpty(tokenHeader))
            return false;

        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
        var receivedHash = SHA256.HashData(Encoding.UTF8.GetBytes(tokenHeader));

        return CryptographicOperations.FixedTimeEquals(receivedHash, expectedHash);
    }

    // ── Payload parsing ──────────────────────────────────────────────────────

    private static (string? repoFullName, string? branch) ParseGitHubPayload(string eventType, string rawBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(rawBody);
            var root = doc.RootElement;

            var repoFullName = root.TryGetProperty("repository", out var repo) &&
                               repo.TryGetProperty("full_name", out var fn)
                ? fn.GetString()
                : null;

            string? branch = null;
            if (eventType == "push" && root.TryGetProperty("ref", out var refProp))
            {
                branch = refProp.GetString()?.Replace("refs/heads/", "");
            }
            else if (eventType == "pull_request" && root.TryGetProperty("pull_request", out var pr) &&
                     pr.TryGetProperty("base", out var baseProp) &&
                     baseProp.TryGetProperty("ref", out var baseRef))
            {
                branch = baseRef.GetString();
            }

            return (repoFullName, branch);
        }
        catch (JsonException)
        {
            return (null, null);
        }
    }

    private static (string? repoFullName, string? branch) ParseGitLabPayload(string normalisedEventType, string rawBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(rawBody);
            var root = doc.RootElement;

            var repoFullName = root.TryGetProperty("project", out var project) &&
                               project.TryGetProperty("path_with_namespace", out var ns)
                ? ns.GetString()
                : null;

            string? branch = null;
            if (normalisedEventType == "push" && root.TryGetProperty("ref", out var refProp))
            {
                branch = refProp.GetString()?.Replace("refs/heads/", "");
            }
            else if (normalisedEventType == "merge_request" &&
                     root.TryGetProperty("object_attributes", out var attrs) &&
                     attrs.TryGetProperty("target_branch", out var targetBranch))
            {
                branch = targetBranch.GetString();
            }

            return (repoFullName, branch);
        }
        catch (JsonException)
        {
            return (null, null);
        }
    }

    private static string NormaliseGitLabEvent(string gitlabEvent)
    {
        var lower = gitlabEvent.ToLowerInvariant();
        return lower switch
        {
            "push hook" => "push",
            "merge request hook" => "merge_request",
            "tag push hook" => "tag_push",
            "note hook" => "note",
            "issue hook" => "issue",
            _ => lower.Replace(" hook", "").Replace(" ", "_")
        };
    }
}
