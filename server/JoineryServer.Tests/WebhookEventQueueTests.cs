using Xunit;
using JoineryServer.Services;

namespace JoineryServer.Tests;

/// <summary>Unit tests for <see cref="WebhookEventQueue"/>.</summary>
public class WebhookEventQueueTests
{
    [Fact]
    public async Task QueueAndDequeue_RoundTrips()
    {
        var queue = new WebhookEventQueue();

        await queue.QueueAsync(42);
        var result = await queue.DequeueAsync(CancellationToken.None);

        Assert.Equal(42, result);
    }

    [Fact]
    public async Task QueueMultiple_DequeuedInOrder()
    {
        var queue = new WebhookEventQueue();

        await queue.QueueAsync(1);
        await queue.QueueAsync(2);
        await queue.QueueAsync(3);

        Assert.Equal(1, await queue.DequeueAsync(CancellationToken.None));
        Assert.Equal(2, await queue.DequeueAsync(CancellationToken.None));
        Assert.Equal(3, await queue.DequeueAsync(CancellationToken.None));
    }

    [Fact]
    public async Task Dequeue_CancellationThrows()
    {
        var queue = new WebhookEventQueue();
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => queue.DequeueAsync(cts.Token).AsTask());
    }
}
