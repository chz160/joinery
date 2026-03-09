using Microsoft.EntityFrameworkCore;
using JoineryServer.Data;

namespace JoineryServer.Services;

/// <summary>
/// Background service that processes queued webhook events.
/// Retries failed events up to <see cref="MaxRetries"/> times with exponential back-off.
/// On startup, rehydrates any pending/processing events from the database into the queue.
/// </summary>
public sealed class WebhookEventProcessor : BackgroundService
{
    private readonly IWebhookEventQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WebhookEventProcessor> _logger;

    internal const int MaxRetries = 3;

    public WebhookEventProcessor(
        IWebhookEventQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<WebhookEventProcessor> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("WebhookEventProcessor started");

        await RehydratePendingEventsAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            int eventId;
            try
            {
                eventId = await _queue.DequeueAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await ProcessEventAsync(eventId, stoppingToken);
        }

        _logger.LogInformation("WebhookEventProcessor stopped");
    }

    /// <summary>
    /// Re-queues any events that were left in "pending" or "processing" state
    /// (e.g. after a service restart) so they are not stranded.
    /// </summary>
    private async Task RehydratePendingEventsAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<JoineryDbContext>();

            var strandedIds = await context.WebhookEvents
                .Where(e => e.Status == "pending" || e.Status == "processing")
                .OrderBy(e => e.ReceivedAt)
                .Select(e => e.Id)
                .ToListAsync(stoppingToken);

            foreach (var id in strandedIds)
            {
                try
                {
                    await _queue.QueueAsync(id, stoppingToken);
                }
                catch (InvalidOperationException)
                {
                    _logger.LogWarning("Queue full during rehydration; skipping remaining {Count} events",
                        strandedIds.Count - strandedIds.IndexOf(id));
                    break;
                }
            }

            if (strandedIds.Count > 0)
                _logger.LogInformation("Rehydrated {Count} pending webhook events into the queue", strandedIds.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Failed to rehydrate pending webhook events on startup");
        }
    }

    internal async Task ProcessEventAsync(int eventId, CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<JoineryDbContext>();
        var gitService = scope.ServiceProvider.GetRequiredService<IGitRepositoryService>();

        var webhookEvent = await context.WebhookEvents.FindAsync(new object[] { eventId }, stoppingToken);
        if (webhookEvent == null)
        {
            _logger.LogWarning("WebhookEvent {EventId} not found in database; skipping", eventId);
            return;
        }

        // Only process actionable events (push triggers sync; PR/MR events are
        // tracked for auditing but do not trigger a sync because the subsequent
        // merge push event will handle synchronisation).
        if (!IsProcessableEvent(webhookEvent.Provider, webhookEvent.EventType))
        {
            webhookEvent.Status = "skipped";
            webhookEvent.ProcessedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("WebhookEvent {EventId} ({Provider}/{EventType}) skipped — not actionable",
                eventId, webhookEvent.Provider, webhookEvent.EventType);
            return;
        }

        webhookEvent.Status = "processing";
        await context.SaveChangesAsync(stoppingToken);

        try
        {
            var syncedCount = await SyncMatchingRepositoriesAsync(webhookEvent, context, gitService, stoppingToken);

            if (syncedCount == 0)
            {
                webhookEvent.Status = "skipped";
                webhookEvent.ErrorMessage = "No matching repositories found for sync.";
                _logger.LogInformation("WebhookEvent {EventId} skipped — no matching repositories", eventId);
            }
            else
            {
                webhookEvent.Status = "completed";
                webhookEvent.ErrorMessage = null;
                _logger.LogInformation("WebhookEvent {EventId} processed successfully — synced {Count} repository/repositories",
                    eventId, syncedCount);
            }

            webhookEvent.ProcessedAt = DateTime.UtcNow;
            await context.SaveChangesAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            webhookEvent.RetryCount++;
            webhookEvent.ErrorMessage = ex.Message;

            if (webhookEvent.RetryCount >= MaxRetries)
            {
                webhookEvent.Status = "failed";
                webhookEvent.ProcessedAt = DateTime.UtcNow;
                _logger.LogError(ex, "WebhookEvent {EventId} permanently failed after {Retries} retries",
                    eventId, webhookEvent.RetryCount);
            }
            else
            {
                webhookEvent.Status = "pending";
                _logger.LogWarning(ex, "WebhookEvent {EventId} failed (attempt {Attempt}/{Max}); re-queuing",
                    eventId, webhookEvent.RetryCount, MaxRetries);
            }

            await context.SaveChangesAsync(stoppingToken);

            // Re-queue for retry after exponential back-off without blocking the processor
            if (webhookEvent.RetryCount < MaxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, webhookEvent.RetryCount));
                _ = ScheduleRetryAsync(eventId, delay, stoppingToken);
            }
        }
    }

    private static async Task<int> SyncMatchingRepositoriesAsync(
        Models.WebhookEvent webhookEvent,
        JoineryDbContext context,
        IGitRepositoryService gitService,
        CancellationToken stoppingToken)
    {
        if (string.IsNullOrEmpty(webhookEvent.RepositoryFullName))
            return 0;

        var branch = webhookEvent.Branch ?? "";

        // Use case-insensitive filter for PostgreSQL compatibility.
        var candidates = await context.GitRepositories
            .Where(r => r.IsActive && EF.Functions.ILike(r.RepositoryUrl, "%" + webhookEvent.RepositoryFullName + "%"))
            .Include(r => r.QueryFiles.Where(qf => qf.IsActive))
            .ToListAsync(stoppingToken);

        var matched = candidates.Where(r =>
        {
            var repoFullName = ExtractRepoFullName(r.RepositoryUrl, webhookEvent.Provider);
            return string.Equals(repoFullName, webhookEvent.RepositoryFullName, StringComparison.OrdinalIgnoreCase) &&
                   string.Equals(r.Branch ?? "main", branch, StringComparison.OrdinalIgnoreCase);
        }).ToList();

        if (matched.Count == 0)
            return 0;

        var syncedCount = 0;
        foreach (var repository in matched)
        {
            var existingFiles = repository.QueryFiles.Where(f => f.IsActive).ToList();
            var syncResult = await gitService.IncrementalSyncRepositoryAsync(repository, existingFiles);

            context.ApplyIncrementalSyncResult(repository, syncResult);

            repository.LastSyncAt = DateTime.UtcNow;
            repository.LastHeadCommitSha = syncResult.HeadCommitSha ?? repository.LastHeadCommitSha;
            await context.SaveChangesAsync(stoppingToken);
            syncedCount++;
        }

        return syncedCount;
    }

    /// <summary>
    /// Extracts the "owner/repo" full name from a repository URL, selecting the
    /// appropriate parser based on the webhook provider.
    /// </summary>
    internal static string ExtractRepoFullName(string repositoryUrl, string provider)
    {
        if (string.IsNullOrWhiteSpace(repositoryUrl))
            return "";

        // For GitHub, reuse the canonical ParseGitHubUrl helper.
        if (provider == "github")
        {
            var (owner, repo) = GitRepositoryService.ParseGitHubUrl(repositoryUrl);
            return string.IsNullOrEmpty(owner) ? "" : $"{owner}/{repo}";
        }

        // For GitLab (and others), parse generic HTTPS/SSH URLs.
        return ParseGenericGitUrl(repositoryUrl);
    }

    /// <summary>
    /// Parses owner/repo from generic Git HTTPS or SSH URLs.
    /// Supports: https://gitlab.com/owner/repo(.git) and git@gitlab.com:owner/repo(.git)
    /// </summary>
    internal static string ParseGenericGitUrl(string url)
    {
        try
        {
            if (Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
                (uri.Scheme == "https" || uri.Scheme == "http"))
            {
                var segments = uri.AbsolutePath.Trim('/').Split('/');
                if (segments.Length >= 2 &&
                    !string.IsNullOrEmpty(segments[0]) &&
                    !string.IsNullOrEmpty(segments[1]))
                {
                    var repo = segments[1].Replace(".git", "", StringComparison.OrdinalIgnoreCase);
                    return $"{segments[0]}/{repo}";
                }
            }
            else if (url.Contains('@') && url.Contains(':'))
            {
                // git@host:owner/repo.git format
                var colonIdx = url.IndexOf(':');
                var repoPath = url[(colonIdx + 1)..].Replace(".git", "", StringComparison.OrdinalIgnoreCase);
                var parts = repoPath.Split('/');
                if (parts.Length >= 2 &&
                    !string.IsNullOrEmpty(parts[0]) &&
                    !string.IsNullOrEmpty(parts[1]))
                {
                    return $"{parts[0]}/{parts[1]}";
                }
            }
        }
        catch
        {
            // Fall through
        }

        return "";
    }

    internal static bool IsProcessableEvent(string provider, string eventType)
    {
        return provider switch
        {
            "github" => eventType is "push",
            "gitlab" => eventType is "push",
            _ => false
        };
    }

    /// <summary>
    /// Schedules a retry by waiting the specified delay and then re-queuing the event.
    /// Runs independently so the main processing loop is not blocked.
    /// </summary>
    private async Task ScheduleRetryAsync(int eventId, TimeSpan delay, CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(delay, stoppingToken);
            await _queue.QueueAsync(eventId, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to schedule retry for webhook event {EventId} after delay {Delay}",
                eventId, delay);
        }
    }
}
