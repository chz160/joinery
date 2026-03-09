using System.Threading.Channels;

namespace JoineryServer.Services;

/// <summary>In-process queue for webhook events awaiting processing.</summary>
public interface IWebhookEventQueue
{
    /// <summary>Enqueue a webhook event ID for background processing.</summary>
    ValueTask QueueAsync(int webhookEventId, CancellationToken cancellationToken = default);

    /// <summary>Dequeue the next webhook event ID. Blocks until one is available.</summary>
    ValueTask<int> DequeueAsync(CancellationToken cancellationToken);
}

/// <summary>
/// Channel-backed implementation of <see cref="IWebhookEventQueue"/>.
/// Bounded to 1 000 items to apply back-pressure if the processor falls behind.
/// </summary>
public sealed class WebhookEventQueue : IWebhookEventQueue
{
    private readonly Channel<int> _channel =
        Channel.CreateBounded<int>(new BoundedChannelOptions(1_000)
        {
            FullMode = BoundedChannelFullMode.Wait
        });

    public ValueTask QueueAsync(int webhookEventId, CancellationToken cancellationToken = default)
        => _channel.Writer.WriteAsync(webhookEventId, cancellationToken);

    public ValueTask<int> DequeueAsync(CancellationToken cancellationToken)
        => _channel.Reader.ReadAsync(cancellationToken);
}
