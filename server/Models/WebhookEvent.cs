namespace JoineryServer.Models;

/// <summary>
/// Tracks received webhook events for auditing, status monitoring, and retry management.
/// </summary>
public class WebhookEvent
{
    public int Id { get; set; }

    /// <summary>The webhook provider: "github", "gitlab".</summary>
    public string Provider { get; set; } = "";

    /// <summary>The event type: "push", "pull_request", "merge_request", etc.</summary>
    public string EventType { get; set; } = "";

    /// <summary>Provider-assigned delivery identifier (e.g. X-GitHub-Delivery).</summary>
    public string? DeliveryId { get; set; }

    /// <summary>Processing status: pending, processing, completed, failed, skipped.</summary>
    public string Status { get; set; } = "pending";

    /// <summary>The raw JSON payload for reprocessing on retry.</summary>
    public string? Payload { get; set; }

    /// <summary>Number of processing attempts so far.</summary>
    public int RetryCount { get; set; }

    /// <summary>Error message from the most recent failed attempt.</summary>
    public string? ErrorMessage { get; set; }

    /// <summary>When the webhook was received.</summary>
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    /// <summary>When processing completed (or last failed).</summary>
    public DateTime? ProcessedAt { get; set; }

    /// <summary>Repository full name from the payload (e.g. "owner/repo").</summary>
    public string? RepositoryFullName { get; set; }

    /// <summary>Branch ref from the payload.</summary>
    public string? Branch { get; set; }
}
