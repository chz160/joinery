using JoineryServer.Models;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace JoineryServer.Services;

public interface IGitRepositoryService
{
    Task<List<GitQueryFile>> SyncRepositoryAsync(GitRepository repository);
    Task<GitQueryFile?> GetQueryFileAsync(GitRepository repository, string filePath);
    Task<List<string>> GetRepositoryFoldersAsync(GitRepository repository);
    Task<List<GitQueryFile>> GetQueryFilesInFolderAsync(GitRepository repository, string folderPath = "");
}

public class GitRepositoryService : IGitRepositoryService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GitRepositoryService> _logger;

    private const long MaxFileSizeBytes = 1_048_576; // 1 MB
    private const int MaxDirectoryDepth = 10;
    private const int MaxAttempts = 4; // 1 initial attempt + 3 retries

    private static readonly JsonSerializerOptions CamelCaseOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public GitRepositoryService(IHttpClientFactory httpClientFactory, ILogger<GitRepositoryService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>Returns true when <paramref name="url"/> is a recognised GitHub repository URL.</summary>
    public static bool IsValidRepositoryUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;
        var (owner, repo) = ParseGitHubUrl(url);
        return !string.IsNullOrEmpty(owner) && !string.IsNullOrEmpty(repo);
    }

    public async Task<List<GitQueryFile>> SyncRepositoryAsync(GitRepository repository)
    {
        _logger.LogInformation("Syncing repository {RepositoryUrl}", repository.RepositoryUrl);

        if (!IsValidRepositoryUrl(repository.RepositoryUrl))
        {
            _logger.LogError("Invalid or unsupported repository URL: {RepositoryUrl}", repository.RepositoryUrl);
            throw new ArgumentException($"Invalid or unsupported repository URL: {repository.RepositoryUrl}", nameof(repository));
        }

        try
        {
            var queryFiles = await SyncGitHubRepositoryAsync(repository);
            return queryFiles;
        }
        catch (GitHubRateLimitException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing repository {RepositoryUrl}", repository.RepositoryUrl);
            return [];
        }
    }

    private async Task<List<GitQueryFile>> SyncGitHubRepositoryAsync(GitRepository repository)
    {
        var queryFiles = new List<GitQueryFile>();
        var (owner, repoName) = ParseGitHubUrl(repository.RepositoryUrl);

        var httpClient = _httpClientFactory.CreateClient();
        try
        {
            await GetRepositoryContentsRecursive(httpClient, repository, owner, repoName, "", queryFiles, depth: 0);
        }
        catch (GitHubRateLimitException ex)
        {
            _logger.LogError(ex, "GitHub API rate limit exceeded for repository {Owner}/{Repo}. Reset at {ResetTime}",
                owner, repoName, ex.ResetAt?.ToString("O") ?? "unknown");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error accessing GitHub repository {Owner}/{Repo}", owner, repoName);
        }

        return queryFiles;
    }

    private async Task GetRepositoryContentsRecursive(
        HttpClient httpClient,
        GitRepository repository,
        string owner,
        string repoName,
        string path,
        List<GitQueryFile> queryFiles,
        int depth)
    {
        if (depth >= MaxDirectoryDepth)
        {
            _logger.LogWarning("Maximum directory depth ({MaxDepth}) reached at path '{Path}'; skipping deeper contents",
                MaxDirectoryDepth, path);
            return;
        }

        var branch = repository.Branch ?? "main";
        var url = $"https://api.github.com/repos/{owner}/{repoName}/contents/{path}?ref={Uri.EscapeDataString(branch)}";

        using var response = await ExecuteWithRetryAsync(httpClient, url, repository.AccessToken);

        if (!response.IsSuccessStatusCode)
        {
            ThrowIfRateLimited(response);
            LogHttpFailure(response.StatusCode, repository.RepositoryUrl, path);
            return;
        }

        var jsonContent = await response.Content.ReadAsStringAsync();
        var contents = JsonSerializer.Deserialize<GitHubContent[]>(jsonContent, CamelCaseOptions);

        if (contents == null) return;

        foreach (var content in contents)
        {
            if (content.Type == "file" && IsQueryFile(content.Name))
            {
                if (content.Size > MaxFileSizeBytes)
                {
                    _logger.LogWarning("Skipping file '{Path}' ({Size:N0} bytes) — exceeds {LimitMb} MB limit",
                        content.Path, content.Size, MaxFileSizeBytes / 1_048_576);
                    continue;
                }

                var queryFile = await CreateQueryFileFromContent(httpClient, repository, content, owner, repoName);
                if (queryFile != null)
                {
                    queryFiles.Add(queryFile);
                }
            }
            else if (content.Type == "dir")
            {
                await GetRepositoryContentsRecursive(httpClient, repository, owner, repoName, content.Path, queryFiles, depth + 1);
            }
        }
    }

    private async Task<GitQueryFile?> CreateQueryFileFromContent(
        HttpClient httpClient,
        GitRepository repository,
        GitHubContent content,
        string owner,
        string repoName)
    {
        try
        {
            if (string.IsNullOrEmpty(content.DownloadUrl))
            {
                _logger.LogWarning("No download URL for file '{Path}'; skipping", content.Path);
                return null;
            }

            using var fileResponse = await ExecuteWithRetryAsync(httpClient, content.DownloadUrl, repository.AccessToken);
            if (!fileResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to download file '{Path}': {StatusCode}", content.Path, fileResponse.StatusCode);
                return null;
            }

            var sqlContent = await fileResponse.Content.ReadAsStringAsync();
            var commitInfo = await GetLatestCommitForFile(httpClient, owner, repoName, content.Path, repository.Branch ?? "main", repository.AccessToken);

            return new GitQueryFile
            {
                GitRepositoryId = repository.Id,
                FilePath = content.Path,
                FileName = content.Name,
                Description = ExtractCommentHeaderValue(sqlContent, "description:"),
                SqlContent = sqlContent,
                DatabaseType = ExtractCommentHeaderValue(sqlContent, "database:", "db:")
                               ?? ExtractDatabaseTypeFromFileName(content.Name),
                Tags = ExtractTagsFromContent(sqlContent),
                LastCommitSha = content.Sha,
                LastCommitAuthor = commitInfo?.Author,
                LastCommitAt = commitInfo?.Date ?? DateTime.UtcNow,
                LastSyncAt = DateTime.UtcNow,
                IsActive = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating query file from content '{Path}'", content.Path);
            return null;
        }
    }

    private async Task<CommitInfo?> GetLatestCommitForFile(
        HttpClient httpClient,
        string owner,
        string repoName,
        string filePath,
        string branch,
        string? accessToken)
    {
        try
        {
            var url = $"https://api.github.com/repos/{owner}/{repoName}/commits?path={Uri.EscapeDataString(filePath)}&sha={Uri.EscapeDataString(branch)}&per_page=1";
            using var response = await ExecuteWithRetryAsync(httpClient, url, accessToken);

            if (!response.IsSuccessStatusCode) return null;

            var jsonContent = await response.Content.ReadAsStringAsync();
            var commits = JsonSerializer.Deserialize<GitHubCommit[]>(jsonContent, CamelCaseOptions);

            var latestCommit = commits?.FirstOrDefault();
            if (latestCommit?.Commit?.Author != null)
            {
                return new CommitInfo
                {
                    Author = latestCommit.Commit.Author.Name,
                    Date = latestCommit.Commit.Author.Date
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting commit info for file '{FilePath}'", filePath);
        }

        return null;
    }

    /// <summary>Sends a GET request to <paramref name="url"/> with retries for transient failures.</summary>
    private async Task<HttpResponseMessage> ExecuteWithRetryAsync(HttpClient httpClient, string url, string? accessToken)
    {
        for (int attempt = 0; attempt < MaxAttempts; attempt++)
        {
            HttpResponseMessage? response = null;
            try
            {
                using var request = BuildGitHubRequest(url, accessToken);
                response = await httpClient.SendAsync(request);

                // Do not retry on rate-limit — extract reset time, dispose, then throw.
                if (IsRateLimited(response))
                {
                    DateTime? resetAt = null;
                    if (response.Headers.TryGetValues("X-RateLimit-Reset", out var resetValues) &&
                        long.TryParse(resetValues.FirstOrDefault(), out var resetUnix))
                    {
                        resetAt = DateTimeOffset.FromUnixTimeSeconds(resetUnix).UtcDateTime;
                    }
                    response.Dispose();
                    throw new GitHubRateLimitException(resetAt);
                }

                // Success or non-retryable client error — return as-is.
                if ((int)response.StatusCode < 500 || attempt == MaxAttempts - 1)
                {
                    return response;
                }

                // Server error — dispose and retry after exponential back-off.
                var statusCode = response.StatusCode;
                response.Dispose();
                response = null;

                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                _logger.LogWarning("Transient server error {StatusCode} for '{Url}'; retrying in {Delay}s (retry {Retry}/{MaxRetries})",
                    statusCode, url, delay.TotalSeconds, attempt + 1, MaxAttempts - 1);
                await Task.Delay(delay);
            }
            catch (HttpRequestException ex)
            {
                response?.Dispose();
                if (attempt == MaxAttempts - 1)
                    throw new InvalidOperationException($"Failed to GET '{url}' after {MaxAttempts} attempts.", ex);
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
                _logger.LogWarning(ex, "Network error for '{Url}'; retrying in {Delay}s (retry {Retry}/{MaxRetries})",
                    url, delay.TotalSeconds, attempt + 1, MaxAttempts - 1);
                await Task.Delay(delay);
            }
        }

        // Fallback: reached only if MaxAttempts <= 0 (not possible with a positive constant).
        throw new InvalidOperationException($"Failed to GET '{url}' after {MaxAttempts} attempts.");
    }

    private static HttpRequestMessage BuildGitHubRequest(string url, string? accessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Add("User-Agent", "JoineryServer/1.0");
        request.Headers.Add("X-GitHub-Api-Version", "2022-11-28");
        if (!string.IsNullOrEmpty(accessToken))
        {
            request.Headers.Add("Authorization", $"Bearer {accessToken}");
        }
        return request;
    }

    private static bool IsRateLimited(HttpResponseMessage response)
    {
        if (response.StatusCode == (HttpStatusCode)429)
            return true;

        if (response.StatusCode == HttpStatusCode.Forbidden &&
            response.Headers.TryGetValues("X-RateLimit-Remaining", out var values) &&
            values.FirstOrDefault() == "0")
        {
            return true;
        }

        return false;
    }

    private static void ThrowIfRateLimited(HttpResponseMessage response)
    {
        if (!IsRateLimited(response)) return;

        DateTime? resetAt = null;
        if (response.Headers.TryGetValues("X-RateLimit-Reset", out var resetValues) &&
            long.TryParse(resetValues.FirstOrDefault(), out var resetUnix))
        {
            resetAt = DateTimeOffset.FromUnixTimeSeconds(resetUnix).UtcDateTime;
        }

        throw new GitHubRateLimitException(resetAt);
    }

    private void LogHttpFailure(HttpStatusCode statusCode, string repositoryUrl, string path)
    {
        var message = statusCode switch
        {
            HttpStatusCode.Unauthorized =>
                $"Authentication failed for repository '{repositoryUrl}'. Verify the access token has the required scopes.",
            HttpStatusCode.Forbidden =>
                $"Access denied for repository '{repositoryUrl}'. The token may lack sufficient permissions.",
            HttpStatusCode.NotFound =>
                $"Repository or path '{path}' not found at '{repositoryUrl}'. Check the URL and branch name.",
            _ =>
                $"Failed to get contents for path '{path}' in '{repositoryUrl}': {statusCode}"
        };

        _logger.LogWarning("{Message}", message);
    }

    public async Task<GitQueryFile?> GetQueryFileAsync(GitRepository repository, string filePath)
    {
        var queryFiles = await SyncRepositoryAsync(repository);
        return queryFiles.FirstOrDefault(qf => qf.FilePath == filePath);
    }

    public async Task<List<string>> GetRepositoryFoldersAsync(GitRepository repository)
    {
        var queryFiles = await SyncRepositoryAsync(repository);
        return queryFiles
            .Select(qf => Path.GetDirectoryName(qf.FilePath)?.Replace("\\", "/") ?? "")
            .Where(folder => !string.IsNullOrEmpty(folder))
            .Distinct()
            .Order()
            .ToList();
    }

    public async Task<List<GitQueryFile>> GetQueryFilesInFolderAsync(GitRepository repository, string folderPath = "")
    {
        var queryFiles = await SyncRepositoryAsync(repository);

        if (string.IsNullOrEmpty(folderPath))
        {
            return queryFiles.Where(qf => !qf.FilePath.Contains('/')).ToList();
        }

        var normalizedFolderPath = folderPath.Replace("\\", "/").TrimEnd('/');
        return queryFiles
            .Where(qf =>
            {
                var fileDir = Path.GetDirectoryName(qf.FilePath)?.Replace("\\", "/") ?? "";
                return fileDir == normalizedFolderPath;
            })
            .ToList();
    }

    private static (string owner, string repoName) ParseGitHubUrl(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return ("", "");

        try
        {
            // https://github.com/owner/repo  or  https://github.com/owner/repo.git
            // Only HTTPS is accepted (not plain HTTP) for security.
            if (Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
                uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase) &&
                uri.Host.Equals("github.com", StringComparison.OrdinalIgnoreCase) &&
                string.IsNullOrEmpty(uri.Query) &&
                string.IsNullOrEmpty(uri.Fragment))
            {
                // AbsolutePath must contain exactly owner + repo (no extra segments).
                var segments = uri.AbsolutePath.Trim('/').Split('/');
                if (segments.Length == 2 &&
                    !string.IsNullOrEmpty(segments[0]) &&
                    !string.IsNullOrEmpty(segments[1]))
                {
                    return (segments[0], segments[1].Replace(".git", "", StringComparison.OrdinalIgnoreCase));
                }
            }
            // git@github.com:owner/repo.git
            else if (url.StartsWith("git@github.com:", StringComparison.OrdinalIgnoreCase))
            {
                var repoPath = url["git@github.com:".Length..];
                // Reject any accidental query string or fragment.
                if (repoPath.IndexOfAny(['?', '#']) >= 0) return ("", "");
                repoPath = repoPath.Replace(".git", "", StringComparison.OrdinalIgnoreCase);
                var parts = repoPath.Split('/');
                if (parts.Length == 2 &&
                    !string.IsNullOrEmpty(parts[0]) &&
                    !string.IsNullOrEmpty(parts[1]))
                {
                    return (parts[0], parts[1]);
                }
            }
        }
        catch
        {
            // Fall through to return empty values
        }

        return ("", "");
    }

    private static bool IsQueryFile(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension == ".sql" || extension == ".txt";
    }

    private static string? ExtractDatabaseTypeFromFileName(string fileName)
    {
        var lowerName = fileName.ToLowerInvariant();

        if (lowerName.Contains("postgres") || lowerName.Contains("pg")) return "PostgreSQL";
        if (lowerName.Contains("mysql")) return "MySQL";
        if (lowerName.Contains("sqlserver") || lowerName.Contains("mssql")) return "SQLServer";
        if (lowerName.Contains("sqlite")) return "SQLite";
        if (lowerName.Contains("oracle")) return "Oracle";

        return null;
    }

    /// <summary>
    /// Scans the first 15 lines of a SQL file for comment headers matching any of the provided
    /// <paramref name="keys"/> (e.g. <c>"description:"</c>) and returns the trimmed value after the key.
    /// Returns <see langword="null"/> when no matching header is found.
    /// </summary>
    private static string? ExtractCommentHeaderValue(string content, params string[] keys)
    {
        var lines = content.Split('\n');
        foreach (var line in lines.Take(15))
        {
            var trimmed = line.Trim();
            if (!trimmed.StartsWith("--", StringComparison.Ordinal)) continue;

            var body = trimmed[2..].TrimStart(); // text after "--"
            foreach (var key in keys)
            {
                if (body.StartsWith(key, StringComparison.OrdinalIgnoreCase))
                {
                    var value = body[key.Length..].Trim();
                    if (!string.IsNullOrEmpty(value)) return value;
                }
            }
        }

        return null;
    }

    private static List<string>? ExtractTagsFromContent(string content)
    {
        var tags = new List<string>();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        foreach (var line in lines.Take(15))
        {
            var trimmed = line.Trim();
            if (!trimmed.StartsWith("--", StringComparison.Ordinal)) continue;

            const string key = "tags:";
            var idx = trimmed.IndexOf(key, StringComparison.OrdinalIgnoreCase);
            if (idx >= 0)
            {
                var tagsPart = trimmed[(idx + key.Length)..].Trim();
                var fileTags = tagsPart.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => t.Trim())
                    .Where(t => !string.IsNullOrEmpty(t));
                tags.AddRange(fileTags);
            }
        }

        return tags.Count > 0 ? tags : null;
    }

    // ── GitHub API response models ────────────────────────────────────────────

    private sealed class GitHubContent
    {
        public string Name { get; set; } = "";
        public string Path { get; set; } = "";
        public string Sha { get; set; } = "";
        public string Type { get; set; } = "";
        [JsonPropertyName("download_url")]
        public string? DownloadUrl { get; set; }
        public long Size { get; set; }
    }

    private sealed class GitHubCommit
    {
        public GitHubCommitDetails Commit { get; set; } = new();
    }

    private sealed class GitHubCommitDetails
    {
        public GitHubAuthor Author { get; set; } = new();
    }

    private sealed class GitHubAuthor
    {
        public string Name { get; set; } = "";
        public DateTime Date { get; set; }
    }

    private sealed class CommitInfo
    {
        public string Author { get; set; } = "";
        public DateTime Date { get; set; }
    }
}

/// <summary>Thrown when the GitHub API rate limit has been exceeded.</summary>
public sealed class GitHubRateLimitException : Exception
{
    public DateTime? ResetAt { get; }

    public GitHubRateLimitException(DateTime? resetAt)
        : base(resetAt.HasValue
            ? $"GitHub API rate limit exceeded. Limit resets at {resetAt.Value:O}."
            : "GitHub API rate limit exceeded.")
    {
        ResetAt = resetAt;
    }
}
