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

    [Fact]
    public async Task QueueWhenFull_ThrowsInvalidOperationException()
    {
        // The queue is bounded. Fill it and verify the next write throws.
        var queue = new WebhookEventQueue();
        for (var i = 0; i < WebhookEventQueue.Capacity; i++)
            await queue.QueueAsync(i);

        Assert.Throws<InvalidOperationException>(() =>
            queue.QueueAsync(9999).AsTask().GetAwaiter().GetResult());
    }

    [Fact]
    public void Queue_CancelledToken_ThrowsOperationCanceled()
    {
        var queue = new WebhookEventQueue();
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        Assert.ThrowsAny<OperationCanceledException>(() =>
            queue.QueueAsync(1, cts.Token).AsTask().GetAwaiter().GetResult());
    }
}
