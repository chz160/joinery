using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using JoineryServer.Data;
using JoineryServer.Models;

namespace JoineryServer.Services;

public class HealthCheckService : IHealthCheckService
{
    private readonly DateTime _startTime = DateTime.UtcNow;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HealthCheckConfig _config;
    private readonly ILogger<HealthCheckService> _logger;

    public HealthCheckService(
        IServiceScopeFactory scopeFactory,
        IOptions<HealthCheckConfig> config,
        ILogger<HealthCheckService> logger)
    {
        _scopeFactory = scopeFactory;
        _config = config.Value;
        _logger = logger;
    }

    public Task<HealthReport> GetLivenessAsync()
    {
        var report = new HealthReport(
            Status: HealthStatus.Healthy,
            Timestamp: DateTime.UtcNow,
            Components: new[] { new ComponentHealth("process", HealthStatus.Healthy, "Process is alive") },
            Metrics: null
        );
        return Task.FromResult(report);
    }

    public async Task<HealthReport> GetReadinessAsync()
    {
        var components = new List<ComponentHealth>
        {
            await CheckDatabaseAsync(),
            CheckMemory()
        };

        var status = AggregateStatus(components);
        return new HealthReport(status, DateTime.UtcNow, components, null);
    }

    public Task<HealthReport> GetStartupAsync()
    {
        var elapsed = DateTime.UtcNow - _startTime;
        var gracePeriod = TimeSpan.FromSeconds(_config.StartupGracePeriodSeconds);
        var isReady = elapsed >= gracePeriod;

        var component = new ComponentHealth(
            "startup",
            isReady ? HealthStatus.Healthy : HealthStatus.Degraded,
            isReady ? "Application has completed startup" : $"Application is still starting up (elapsed: {elapsed.TotalSeconds:F0}s, grace: {gracePeriod.TotalSeconds}s)",
            new Dictionary<string, object>
            {
                ["startTime"] = _startTime,
                ["elapsedSeconds"] = (int)elapsed.TotalSeconds,
                ["gracePeriodSeconds"] = _config.StartupGracePeriodSeconds,
                ["isReady"] = isReady
            }
        );

        var status = isReady ? HealthStatus.Healthy : HealthStatus.Degraded;
        return Task.FromResult(new HealthReport(status, DateTime.UtcNow, new[] { component }, null));
    }

    public async Task<HealthReport> GetDeepAsync()
    {
        var sw = Stopwatch.StartNew();

        var components = new List<ComponentHealth>
        {
            await CheckDatabaseAsync(),
            CheckMemory(),
            (await GetStartupAsync()).Components[0]
        };

        sw.Stop();

        var process = Process.GetCurrentProcess();
        var metrics = new Dictionary<string, object>
        {
            ["uptimeSeconds"] = (int)(DateTime.UtcNow - _startTime).TotalSeconds,
            ["totalCheckDurationMs"] = sw.ElapsedMilliseconds,
            ["workingSetBytes"] = process.WorkingSet64,
            ["gcTotalMemoryBytes"] = GC.GetTotalMemory(forceFullCollection: false),
            ["threadCount"] = process.Threads.Count,
            ["gen0Collections"] = GC.CollectionCount(0),
            ["gen1Collections"] = GC.CollectionCount(1),
            ["gen2Collections"] = GC.CollectionCount(2)
        };

        var status = AggregateStatus(components);
        return new HealthReport(status, DateTime.UtcNow, components, metrics);
    }

    private async Task<ComponentHealth> CheckDatabaseAsync()
    {
        var sw = Stopwatch.StartNew();
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<JoineryDbContext>();

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_config.DatabaseTimeoutSeconds));
            var canConnect = await dbContext.Database.CanConnectAsync(cts.Token);
            if (!canConnect)
                throw new InvalidOperationException("Database reports it cannot be connected to.");

            sw.Stop();
            return new ComponentHealth(
                "database",
                HealthStatus.Healthy,
                "Database connection is healthy",
                new Dictionary<string, object> { ["responseTimeMs"] = sw.ElapsedMilliseconds },
                sw.Elapsed
            );
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogWarning(ex, "Database health check failed");
            return new ComponentHealth(
                "database",
                HealthStatus.Unhealthy,
                $"Database connection failed: {ex.Message}",
                new Dictionary<string, object> { ["responseTimeMs"] = sw.ElapsedMilliseconds },
                sw.Elapsed
            );
        }
    }

    private ComponentHealth CheckMemory()
    {
        var allocated = GC.GetTotalMemory(forceFullCollection: false);
        HealthStatus status;
        string description;

        if (allocated >= _config.MemoryUnhealthyThresholdBytes)
        {
            status = HealthStatus.Unhealthy;
            description = "Memory usage exceeds unhealthy threshold";
        }
        else if (allocated >= _config.MemoryDegradedThresholdBytes)
        {
            status = HealthStatus.Degraded;
            description = "Memory usage exceeds degraded threshold";
        }
        else
        {
            status = HealthStatus.Healthy;
            description = "Memory usage is within acceptable limits";
        }

        return new ComponentHealth(
            "memory",
            status,
            description,
            new Dictionary<string, object>
            {
                ["allocatedBytes"] = allocated,
                ["unhealthyThresholdBytes"] = _config.MemoryUnhealthyThresholdBytes,
                ["degradedThresholdBytes"] = _config.MemoryDegradedThresholdBytes
            }
        );
    }

    private static HealthStatus AggregateStatus(IEnumerable<ComponentHealth> components)
    {
        var statuses = components.Select(c => c.Status).ToList();
        if (statuses.Any(s => s == HealthStatus.Unhealthy)) return HealthStatus.Unhealthy;
        if (statuses.Any(s => s == HealthStatus.Degraded)) return HealthStatus.Degraded;
        return HealthStatus.Healthy;
    }
}
