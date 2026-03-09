using Xunit;
using JoineryServer.Controllers;

namespace JoineryServer.Tests;

/// <summary>Unit tests for <see cref="WebhooksController"/> signature and token validation.</summary>
public class WebhooksControllerTests
{
    // ── GitHub HMAC-SHA256 Signature Validation ─────────────────────────────

    [Fact]
    public void ValidateGitHubSignature_WithCorrectSignature_ReturnsTrue()
    {
        const string secret = "my-webhook-secret";
        const string body = """{"ref":"refs/heads/main","repository":{"full_name":"owner/repo"}}""";

        var signature = ComputeSha256Signature(body, secret);

        Assert.True(WebhooksController.ValidateGitHubSignature(body, secret, signature));
    }

    [Fact]
    public void ValidateGitHubSignature_WithWrongSecret_ReturnsFalse()
    {
        const string body = "payload";
        var signature = ComputeSha256Signature(body, "correct-secret");

        Assert.False(WebhooksController.ValidateGitHubSignature(body, "wrong-secret", signature));
    }

    [Fact]
    public void ValidateGitHubSignature_WithTamperedBody_ReturnsFalse()
    {
        const string secret = "my-secret";
        var signature = ComputeSha256Signature("original body", secret);

        Assert.False(WebhooksController.ValidateGitHubSignature("tampered body", secret, signature));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("md5=abc123")]
    [InlineData("noprefix")]
    public void ValidateGitHubSignature_WithMissingOrMalformedHeader_ReturnsFalse(string? header)
    {
        Assert.False(WebhooksController.ValidateGitHubSignature("body", "secret", header));
    }

    [Fact]
    public void ValidateGitHubSignature_WithEmptyBody_StillValidatesCorrectly()
    {
        const string secret = "s";
        const string body = "";
        var signature = ComputeSha256Signature(body, secret);

        Assert.True(WebhooksController.ValidateGitHubSignature(body, secret, signature));
    }

    [Theory]
    [InlineData("sha256=ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")]
    [InlineData("sha256=not-hex-at-all!!")]
    public void ValidateGitHubSignature_WithInvalidHexInHeader_ReturnsFalse(string malformedHeader)
    {
        Assert.False(WebhooksController.ValidateGitHubSignature("body", "secret", malformedHeader));
    }

    // ── GitLab Token Validation ─────────────────────────────────────────────

    [Fact]
    public void ValidateGitLabToken_WithMatchingToken_ReturnsTrue()
    {
        const string secret = "my-gitlab-secret";
        Assert.True(WebhooksController.ValidateGitLabToken(secret, secret));
    }

    [Fact]
    public void ValidateGitLabToken_WithWrongToken_ReturnsFalse()
    {
        Assert.False(WebhooksController.ValidateGitLabToken("correct-secret", "wrong-secret"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void ValidateGitLabToken_WithMissingToken_ReturnsFalse(string? token)
    {
        Assert.False(WebhooksController.ValidateGitLabToken("secret", token));
    }

    [Fact]
    public void ValidateGitLabToken_IsCaseSensitive()
    {
        Assert.False(WebhooksController.ValidateGitLabToken("MySecret", "mysecret"));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string ComputeSha256Signature(string body, string secret)
    {
        var secretBytes = System.Text.Encoding.UTF8.GetBytes(secret);
        var bodyBytes = System.Text.Encoding.UTF8.GetBytes(body);
        var hash = System.Security.Cryptography.HMACSHA256.HashData(secretBytes, bodyBytes);
        return "sha256=" + Convert.ToHexString(hash).ToLowerInvariant();
    }
}
