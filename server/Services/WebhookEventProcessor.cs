using Microsoft.EntityFrameworkCore;
using JoineryServer.Data;

namespace JoineryServer.Services;

/// <summary>
/// Background service that processes queued webhook events.
/// Retries failed events up to <see cref="MaxRetries"/> times with exponential back-off.
/// </summary>
public sealed class WebhookEventProcessor : BackgroundService
{
    private readonly IWebhookEventQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WebhookEventProcessor> _logger;

    private const int MaxRetries = 3;

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

    private async Task ProcessEventAsync(int eventId, CancellationToken stoppingToken)
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

        // Only process actionable events (push / merge)
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
            await SyncMatchingRepositoriesAsync(webhookEvent, context, gitService, stoppingToken);

            webhookEvent.Status = "completed";
            webhookEvent.ProcessedAt = DateTime.UtcNow;
            webhookEvent.ErrorMessage = null;
            await context.SaveChangesAsync(stoppingToken);

            _logger.LogInformation("WebhookEvent {EventId} processed successfully", eventId);
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

            // Re-queue for retry after exponential back-off
            if (webhookEvent.RetryCount < MaxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, webhookEvent.RetryCount));
                await Task.Delay(delay, stoppingToken);
                await _queue.QueueAsync(eventId, stoppingToken);
            }
        }
    }

    private static async Task SyncMatchingRepositoriesAsync(
        Models.WebhookEvent webhookEvent,
        JoineryDbContext context,
        IGitRepositoryService gitService,
        CancellationToken stoppingToken)
    {
        if (string.IsNullOrEmpty(webhookEvent.RepositoryFullName))
            return;

        var branch = webhookEvent.Branch ?? "";

        var candidates = await context.GitRepositories
            .Where(r => r.IsActive && r.RepositoryUrl.Contains(webhookEvent.RepositoryFullName))
            .Include(r => r.QueryFiles.Where(qf => qf.IsActive))
            .ToListAsync(stoppingToken);

        var matched = candidates.Where(r =>
        {
            var (owner, repo) = GitRepositoryService.ParseGitHubUrl(r.RepositoryUrl);
            return string.Equals($"{owner}/{repo}", webhookEvent.RepositoryFullName, StringComparison.OrdinalIgnoreCase) &&
                   string.Equals(r.Branch ?? "main", branch, StringComparison.OrdinalIgnoreCase);
        }).ToList();

        if (matched.Count == 0)
            return;

        foreach (var repository in matched)
        {
            var existingFiles = repository.QueryFiles.Where(f => f.IsActive).ToList();
            var syncResult = await gitService.IncrementalSyncRepositoryAsync(repository, existingFiles);

            context.ApplyIncrementalSyncResult(repository, syncResult);

            repository.LastSyncAt = DateTime.UtcNow;
            repository.LastHeadCommitSha = syncResult.HeadCommitSha ?? repository.LastHeadCommitSha;
            await context.SaveChangesAsync(stoppingToken);
        }
    }

    private static bool IsProcessableEvent(string provider, string eventType)
    {
        return provider switch
        {
            "github" => eventType is "push",
            "gitlab" => eventType is "push",
            _ => false
        };
    }
}
