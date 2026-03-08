using System.Text.Json.Serialization;
using JoineryServer.Models;

namespace JoineryServer.Services;

public interface IGitHubAuthService
{
    Task<string?> ExchangeCodeForTokenAsync(string code, string redirectUri, string clientId, string clientSecret);
    Task<GitHubUserInfo?> GetUserInfoAsync(string accessToken);
    string GenerateState();
    bool ValidateState(string storedState, string receivedState);
}

public class GitHubUserInfo
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("login")]
    public string Login { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }
}