using System.Threading.Channels;

namespace JoineryServer.Services;

/// <summary>In-process queue for webhook events awaiting processing.</summary>
public interface IWebhookEventQueue
{
    /// <summary>
    /// Enqueue a webhook event ID for background processing.
    /// Throws <see cref="InvalidOperationException"/> when the queue is full.
    /// </summary>
    ValueTask QueueAsync(int webhookEventId, CancellationToken cancellationToken = default);

    /// <summary>Dequeue the next webhook event ID. Blocks until one is available.</summary>
    ValueTask<int> DequeueAsync(CancellationToken cancellationToken);
}

/// <summary>
/// Channel-backed implementation of <see cref="IWebhookEventQueue"/>.
/// Bounded to <see cref="Capacity"/> items; an <see cref="InvalidOperationException"/>
/// is thrown when the queue is full so the caller can return a non-2xx response.
/// </summary>
public sealed class WebhookEventQueue : IWebhookEventQueue
{
    internal const int Capacity = 1_000;

    private readonly Channel<int> _channel =
        Channel.CreateBounded<int>(new BoundedChannelOptions(Capacity)
        {
            SingleReader = true
        });

    public ValueTask QueueAsync(int webhookEventId, CancellationToken cancellationToken = default)
    {
        if (_channel.Writer.TryWrite(webhookEventId))
            return ValueTask.CompletedTask;

        throw new InvalidOperationException("Webhook event queue is full.");
    }

    public ValueTask<int> DequeueAsync(CancellationToken cancellationToken)
        => _channel.Reader.ReadAsync(cancellationToken);
}
