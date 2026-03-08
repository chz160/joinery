using Microsoft.AspNetCore.Mvc;
using JoineryServer.Models;
using JoineryServer.Services;

namespace JoineryServer.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IHealthCheckService _healthCheckService;
    private readonly ILogger<HealthController> _logger;

    public HealthController(IHealthCheckService healthCheckService, ILogger<HealthController> logger)
    {
        _healthCheckService = healthCheckService;
        _logger = logger;
    }

    /// <summary>
    /// Liveness probe: confirms the process is alive and responsive.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetLiveness()
    {
        _logger.LogInformation("Liveness check requested");
        var report = await _healthCheckService.GetLivenessAsync();
        return UnhealthyOr200(report);
    }

    /// <summary>
    /// Readiness probe: confirms all required components (database, memory) are available.
    /// Returns 200 when Healthy, 503 when Degraded or Unhealthy.
    /// </summary>
    [HttpGet("ready")]
    public async Task<IActionResult> GetReadiness()
    {
        _logger.LogInformation("Readiness check requested");
        var report = await _healthCheckService.GetReadinessAsync();
        return NotHealthyOr200(report);
    }

    /// <summary>
    /// Startup probe: returns 200 once the startup grace period has elapsed, 503 during startup.
    /// </summary>
    [HttpGet("startup")]
    public async Task<IActionResult> GetStartup()
    {
        _logger.LogInformation("Startup probe requested");
        var report = await _healthCheckService.GetStartupAsync();
        return NotHealthyOr200(report);
    }

    /// <summary>
    /// Deep health check: full diagnostics including GC metrics, thread count, and uptime.
    /// </summary>
    [HttpGet("deep")]
    public async Task<IActionResult> GetDeep()
    {
        _logger.LogInformation("Deep health check requested");
        var report = await _healthCheckService.GetDeepAsync();
        return UnhealthyOr200(report);
    }

    /// <summary>Returns 503 only when Unhealthy (used for liveness and deep).</summary>
    private IActionResult UnhealthyOr200(HealthReport report) =>
        report.Status == HealthStatus.Unhealthy
            ? StatusCode(StatusCodes.Status503ServiceUnavailable, report)
            : Ok(report);

    /// <summary>Returns 503 when Degraded or Unhealthy (used for readiness and startup).</summary>
    private IActionResult NotHealthyOr200(HealthReport report) =>
        report.Status != HealthStatus.Healthy
            ? StatusCode(StatusCodes.Status503ServiceUnavailable, report)
            : Ok(report);
}