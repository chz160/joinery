using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using JoineryServer.Data;
using JoineryServer.Models;
using JoineryServer.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Add Entity Framework — use PostgreSQL when a connection string is provided,
// otherwise fall back to the in-memory provider (useful for testing / quick start).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<JoineryDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString))
        options.UseNpgsql(connectionString,
            npgsql => npgsql.MigrationsAssembly(typeof(JoineryDbContext).Assembly.GetName().Name));
    else
        options.UseInMemoryDatabase("JoineryDatabase");
});

// Migration management service
builder.Services.AddScoped<IMigrationService, MigrationService>();

builder.Services.AddControllers();

// Add HTTP client for Git repository service
builder.Services.AddHttpClient();

// Add Git repository service
builder.Services.AddScoped<IGitRepositoryService, GitRepositoryService>();

// Add team permission service
builder.Services.AddScoped<ITeamPermissionService, TeamPermissionService>();

// Add AWS IAM service
builder.Services.AddScoped<IAwsIamService, AwsIamService>();

// Add Entra ID service
builder.Services.AddScoped<IEntraIdService, EntraIdService>();

// Add authentication services
builder.Services.AddScoped<IGitHubAuthService, GitHubAuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IConfigService, ConfigService>();
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();

// Add session management services
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddHostedService<SessionCleanupService>();

// Add webhook event processing services
builder.Services.AddSingleton<IWebhookEventQueue, WebhookEventQueue>();
builder.Services.AddHostedService<WebhookEventProcessor>();

// Configure authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtConfig = builder.Configuration.GetSection("JWT");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfig["Issuer"],
            ValidAudience = jwtConfig["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig["SecretKey"] ?? "default-secret-key"))
        };
    })
    .AddGitHub(options =>
    {
        var githubConfig = builder.Configuration.GetSection("Authentication:GitHub");
        options.ClientId = githubConfig["ClientId"] ?? "";
        options.ClientSecret = githubConfig["ClientSecret"] ?? "";
        options.CallbackPath = "/signin-github";
        options.Scope.Add("user:email");
        // Ensure secure token transmission
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
        options.CorrelationCookie.SameSite = SameSiteMode.None;
    })
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("Authentication:Microsoft"));

// Configure authorization
builder.Services.AddAuthorization(options =>
{
    // "Admin" policy: JWT users automatically succeed (full access);
    // API key users must have the "admin" scope claim.
    options.AddPolicy("Admin", policy =>
        policy.AddRequirements(new JoineryServer.Authorization.RequireScopeAttribute("admin")));
});
builder.Services.AddSingleton<IAuthorizationHandler, JoineryServer.Authorization.ScopeAuthorizationHandler>();

// Configure Swagger/OpenAPI with security definitions
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Joinery Server API",
        Version = "v1",
        Description = "A minimal MVP API for sharing database queries with authentication"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    // Add API Key authentication to Swagger
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "API Key Authorization header using the ApiKey scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "ApiKey"
    });

    c.AddSecurityDefinition("X-API-Key", new OpenApiSecurityScheme
    {
        Description = "API Key in X-API-Key header",
        Name = "X-API-Key",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "ApiKey"
                }
            },
            new string[] {}
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "X-API-Key"
                }
            },
            new string[] {}
        }
    });
});

// Add health check services
builder.Services.Configure<JoineryServer.Models.HealthCheckConfig>(builder.Configuration.GetSection("HealthChecks"));
builder.Services.AddSingleton<IHealthCheckService, HealthCheckService>();

// Add rate limiting services
builder.Services.Configure<RateLimitConfig>(builder.Configuration.GetSection("RateLimit"));

// Add CORS configuration
builder.Services.Configure<CorsConfig>(builder.Configuration.GetSection("Cors"));

// Configure CORS
var corsConfig = builder.Configuration.GetSection("Cors").Get<CorsConfig>() ?? new CorsConfig();
builder.Services.AddCors(options =>
{
    options.AddPolicy("JoineryCorsPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment() && corsConfig.AllowAnyOriginInDevelopment)
        {
            // Development: Allow any origin for convenience
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .WithExposedHeaders(corsConfig.ExposedHeaders.ToArray());
        }
        else
        {
            // Production: Strict origin validation
            if (corsConfig.AllowedOrigins.Any())
            {
                policy.WithOrigins(corsConfig.AllowedOrigins.ToArray());
            }

            if (corsConfig.AllowedMethods.Any())
            {
                policy.WithMethods(corsConfig.AllowedMethods.ToArray());
            }

            if (corsConfig.AllowedHeaders.Any())
            {
                policy.WithHeaders(corsConfig.AllowedHeaders.ToArray());
            }

            if (corsConfig.ExposedHeaders.Any())
            {
                policy.WithExposedHeaders(corsConfig.ExposedHeaders.ToArray());
            }

            if (corsConfig.AllowCredentials)
            {
                policy.AllowCredentials();
            }

            policy.SetPreflightMaxAge(TimeSpan.FromSeconds(corsConfig.PreflightMaxAge));
        }
    });
});
builder.Services.AddSingleton<MemoryRateLimitStore>();
builder.Services.AddSingleton<IRateLimitStore>(serviceProvider =>
{
    var config = serviceProvider.GetRequiredService<IOptions<RateLimitConfig>>().Value;
    var logger = serviceProvider.GetRequiredService<ILogger<RedisRateLimitStore>>();
    var memoryStore = serviceProvider.GetRequiredService<MemoryRateLimitStore>();

    if (config.EnableDistributedCache)
    {
        return new RedisRateLimitStore(logger, memoryStore);
    }

    return memoryStore;
});
builder.Services.AddSingleton<IRateLimitingService, RateLimitingService>();

var app = builder.Build();

// Eagerly instantiate the health check singleton so _startTime reflects actual process start,
// not the time of the first incoming health probe.
_ = app.Services.GetRequiredService<IHealthCheckService>();

// Auto-apply pending migrations in Development only.
// In Production, migrations must be applied intentionally via POST /api/migrations/apply.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var migrationService = scope.ServiceProvider.GetRequiredService<IMigrationService>();
    try
    {
        await migrationService.ApplyMigrationsAsync(forceProduction: false);
    }
    catch (Exception ex)
    {
        var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        startupLogger.LogError(ex, "An error occurred while applying database migrations on startup.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Joinery Server API V1");
        c.RoutePrefix = "swagger"; // Set Swagger UI at /swagger endpoint
    });
}

// Add CORS middleware - must be before routing and after authentication
app.UseCors("JoineryCorsPolicy");

app.UseHttpsRedirection();

// Add rate limiting middleware before authentication
app.UseMiddleware<JoineryServer.Middleware.RateLimitMiddleware>();

app.UseAuthentication();
app.UseMiddleware<JoineryServer.Middleware.ApiKeyAuthenticationMiddleware>();
app.UseMiddleware<JoineryServer.Middleware.JwtValidationMiddleware>();
app.UseMiddleware<JoineryServer.Middleware.SessionValidationMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Make the implicit Program class public for testing
public partial class Program { }
