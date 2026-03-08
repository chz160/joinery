namespace JoineryServer.Services;

using JoineryServer.Models;

public interface IHealthCheckService
{
    /// <summary>Liveness check: is the process alive and responding?</summary>
    Task<HealthReport> GetLivenessAsync();

    /// <summary>Readiness check: are all required components available?</summary>
    Task<HealthReport> GetReadinessAsync();

    /// <summary>Startup probe: has the application finished initialising?</summary>
    Task<HealthReport> GetStartupAsync();

    /// <summary>Deep check: full diagnostics including metrics.</summary>
    Task<HealthReport> GetDeepAsync();
}
