namespace JoineryServer.Models;

public class HealthCheckConfig
{
    public int StartupGracePeriodSeconds { get; set; } = 30;
    public int DatabaseTimeoutSeconds { get; set; } = 5;
    public int ExternalServiceTimeoutSeconds { get; set; } = 10;
    public long MemoryUnhealthyThresholdBytes { get; set; } = 1_073_741_824; // 1 GB
    public long MemoryDegradedThresholdBytes { get; set; } = 536_870_912;    // 512 MB
}

public enum HealthStatus
{
    Healthy,
    Degraded,
    Unhealthy
}

public record ComponentHealth(
    string Component,
    HealthStatus Status,
    string? Description = null,
    IReadOnlyDictionary<string, object>? Data = null,
    TimeSpan? Duration = null
);

public record HealthReport(
    HealthStatus Status,
    DateTime Timestamp,
    IReadOnlyList<ComponentHealth> Components,
    IReadOnlyDictionary<string, object>? Metrics = null
);
