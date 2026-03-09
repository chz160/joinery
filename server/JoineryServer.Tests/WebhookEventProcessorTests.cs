using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using JoineryServer.Data;
using JoineryServer.Models;
using JoineryServer.Services;

namespace JoineryServer.Tests;

/// <summary>Unit tests for <see cref="WebhookEventProcessor"/> behaviour.</summary>
public class WebhookEventProcessorTests
{
    // ── IsProcessableEvent ──────────────────────────────────────────────────

    [Theory]
    [InlineData("github", "push", true)]
    [InlineData("gitlab", "push", true)]
    [InlineData("github", "pull_request", false)]
    [InlineData("gitlab", "merge_request", false)]
    [InlineData("bitbucket", "push", false)]
    [InlineData("github", "", false)]
    public void IsProcessableEvent_ReturnsExpected(string provider, string eventType, bool expected)
    {
        Assert.Equal(expected, WebhookEventProcessor.IsProcessableEvent(provider, eventType));
    }

    // ── ExtractRepoFullName ─────────────────────────────────────────────────

    [Theory]
    [InlineData("https://github.com/owner/repo", "github", "owner/repo")]
    [InlineData("https://github.com/owner/repo.git", "github", "owner/repo")]
    [InlineData("git@github.com:owner/repo.git", "github", "owner/repo")]
    [InlineData("https://gitlab.com/owner/repo", "gitlab", "owner/repo")]
    [InlineData("https://gitlab.com/owner/repo.git", "gitlab", "owner/repo")]
    [InlineData("git@gitlab.com:owner/repo.git", "gitlab", "owner/repo")]
    [InlineData("", "github", "")]
    [InlineData("", "gitlab", "")]
    public void ExtractRepoFullName_ReturnsExpected(string url, string provider, string expected)
    {
        Assert.Equal(expected, WebhookEventProcessor.ExtractRepoFullName(url, provider));
    }

    // ── ParseGenericGitUrl ──────────────────────────────────────────────────

    [Theory]
    [InlineData("https://gitlab.com/owner/repo", "owner/repo")]
    [InlineData("https://gitlab.com/owner/repo.git", "owner/repo")]
    [InlineData("git@gitlab.com:owner/repo.git", "owner/repo")]
    [InlineData("git@gitlab.com:owner/repo", "owner/repo")]
    [InlineData("https://self-hosted.example.com/org/project.git", "org/project")]
    [InlineData("not-a-url", "")]
    [InlineData("", "")]
    public void ParseGenericGitUrl_ReturnsExpected(string url, string expected)
    {
        Assert.Equal(expected, WebhookEventProcessor.ParseGenericGitUrl(url));
    }

    // ── ProcessEventAsync status lifecycle ───────────────────────────────────

    [Fact]
    public async Task ProcessEvent_NonActionableEvent_MarkedSkipped()
    {
        // Arrange
        var dbName = "WebhookTests_" + Guid.NewGuid();
        var (processor, setupContext) = CreateProcessorWithInMemoryDb(dbName);
        var webhookEvent = new WebhookEvent
        {
            Provider = "github",
            EventType = "pull_request",
            Status = "pending",
            ReceivedAt = DateTime.UtcNow
        };
        setupContext.WebhookEvents.Add(webhookEvent);
        await setupContext.SaveChangesAsync();

        // Act
        await processor.ProcessEventAsync(webhookEvent.Id, CancellationToken.None);

        // Assert — read from a fresh context to verify the DB state
        var verifyContext = CreateContext(dbName);
        var updated = await verifyContext.WebhookEvents.FindAsync(webhookEvent.Id);
        Assert.NotNull(updated);
        Assert.Equal("skipped", updated!.Status);
        Assert.NotNull(updated.ProcessedAt);
    }

    [Fact]
    public async Task ProcessEvent_NoMatchingRepos_MarkedSkipped()
    {
        // Arrange — push event with a repo full name that doesn't match anything
        var dbName = "WebhookTests_" + Guid.NewGuid();
        var (processor, setupContext) = CreateProcessorWithInMemoryDb(dbName);
        var webhookEvent = new WebhookEvent
        {
            Provider = "github",
            EventType = "push",
            Status = "pending",
            RepositoryFullName = "nonexistent/repo",
            Branch = "main",
            ReceivedAt = DateTime.UtcNow
        };
        setupContext.WebhookEvents.Add(webhookEvent);
        await setupContext.SaveChangesAsync();

        // Act
        await processor.ProcessEventAsync(webhookEvent.Id, CancellationToken.None);

        // Assert
        var verifyContext = CreateContext(dbName);
        var updated = await verifyContext.WebhookEvents.FindAsync(webhookEvent.Id);
        Assert.NotNull(updated);
        Assert.Equal("skipped", updated!.Status);
        Assert.Equal("No matching repositories found for sync.", updated.ErrorMessage);
    }

    [Fact]
    public async Task ProcessEvent_MissingEvent_DoesNotThrow()
    {
        // Arrange
        var (processor, _) = CreateProcessorWithInMemoryDb("WebhookTests_" + Guid.NewGuid());

        // Act — should not throw for a non-existent event ID
        await processor.ProcessEventAsync(99999, CancellationToken.None);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static JoineryDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<JoineryDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;
        return new JoineryDbContext(options);
    }

    private static (WebhookEventProcessor processor, JoineryDbContext context) CreateProcessorWithInMemoryDb(string dbName)
    {
        var services = new ServiceCollection();
        services.AddDbContext<JoineryDbContext>(opts =>
            opts.UseInMemoryDatabase(dbName));
        services.AddScoped<IGitRepositoryService, StubGitRepositoryService>();
        var sp = services.BuildServiceProvider();

        var scopeFactory = sp.GetRequiredService<IServiceScopeFactory>();
        var queue = new WebhookEventQueue();
        var logger = NullLogger<WebhookEventProcessor>.Instance;
        var processor = new WebhookEventProcessor(queue, scopeFactory, logger);

        // Resolve the DbContext from a scope for test setup
        var scope = sp.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<JoineryDbContext>();

        return (processor, context);
    }

    /// <summary>Stub that always returns a no-op sync result.</summary>
    private sealed class StubGitRepositoryService : IGitRepositoryService
    {
        public Task<List<GitQueryFile>> SyncRepositoryAsync(GitRepository repository)
            => Task.FromResult(new List<GitQueryFile>());

        public Task<IncrementalSyncResult> IncrementalSyncRepositoryAsync(
            GitRepository repository, IReadOnlyList<GitQueryFile> existingFiles)
            => Task.FromResult(new IncrementalSyncResult(null, [], [], [], IsNoOp: true));

        public Task<GitQueryFile?> GetQueryFileAsync(GitRepository repository, string filePath)
            => Task.FromResult<GitQueryFile?>(null);

        public Task<List<string>> GetRepositoryFoldersAsync(GitRepository repository)
            => Task.FromResult(new List<string>());

        public Task<List<GitQueryFile>> GetQueryFilesInFolderAsync(GitRepository repository, string folderPath = "")
            => Task.FromResult(new List<GitQueryFile>());
    }
}
