using JoineryServer.Models;
using System.Text.Json;

namespace JoineryServer.Services;

public class GitHubAuthService : IGitHubAuthService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<GitHubAuthService> _logger;

    public GitHubAuthService(HttpClient httpClient, ILogger<GitHubAuthService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string?> ExchangeCodeForTokenAsync(string code, string redirectUri, string clientId, string clientSecret)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "JoineryServer/1.0");

            var payload = new
            {
                client_id = clientId,
                client_secret = clientSecret,
                code,
                redirect_uri = redirectUri
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync("https://github.com/login/oauth/access_token", content);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("GitHub token exchange returned {StatusCode}", response.StatusCode);
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (tokenData.TryGetProperty("error", out var errorElement))
            {
                _logger.LogWarning("GitHub token exchange error: {Error}", errorElement.GetString());
                return null;
            }

            if (tokenData.TryGetProperty("access_token", out var accessTokenElement))
            {
                return accessTokenElement.GetString();
            }

            _logger.LogWarning("GitHub token exchange response missing access_token");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging code for GitHub access token");
            return null;
        }
    }

    public async Task<GitHubUserInfo?> GetUserInfoAsync(string accessToken)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "JoineryServer/1.0");

            var response = await _httpClient.GetAsync("https://api.github.com/user");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("GitHub API returned {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var userInfo = JsonSerializer.Deserialize<GitHubUserInfo>(content);

            return userInfo;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user info from GitHub");
            return null;
        }
    }

    public string GenerateState()
    {
        return Guid.NewGuid().ToString("N");
    }

    public bool ValidateState(string storedState, string receivedState)
    {
        return !string.IsNullOrEmpty(storedState) &&
               !string.IsNullOrEmpty(receivedState) &&
               storedState == receivedState;
    }
}