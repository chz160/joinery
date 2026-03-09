using Xunit;
using JoineryServer.Controllers;

namespace JoineryServer.Tests;

/// <summary>Unit tests for <see cref="WebhooksController"/> signature validation.</summary>
public class WebhooksControllerTests
{
    // --- ValidateSignature ---

    [Fact]
    public void ValidateSignature_WithCorrectSignature_ReturnsTrue()
    {
        const string secret = "my-webhook-secret";
        const string body = """{"ref":"refs/heads/main","repository":{"full_name":"owner/repo"}}""";

        var signature = ComputeSha256Signature(body, secret);

        Assert.True(WebhooksController.ValidateSignature(body, secret, signature));
    }

    [Fact]
    public void ValidateSignature_WithWrongSecret_ReturnsFalse()
    {
        const string body = "payload";
        var signature = ComputeSha256Signature(body, "correct-secret");

        Assert.False(WebhooksController.ValidateSignature(body, "wrong-secret", signature));
    }

    [Fact]
    public void ValidateSignature_WithTamperedBody_ReturnsFalse()
    {
        const string secret = "my-secret";
        var signature = ComputeSha256Signature("original body", secret);

        Assert.False(WebhooksController.ValidateSignature("tampered body", secret, signature));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("md5=abc123")]
    [InlineData("noprefix")]
    public void ValidateSignature_WithMissingOrMalformedHeader_ReturnsFalse(string? header)
    {
        Assert.False(WebhooksController.ValidateSignature("body", "secret", header));
    }

    [Fact]
    public void ValidateSignature_WithEmptyBody_StillValidatesCorrectly()
    {
        const string secret = "s";
        const string body = "";
        var signature = ComputeSha256Signature(body, secret);

        Assert.True(WebhooksController.ValidateSignature(body, secret, signature));
    }

    [Theory]
    [InlineData("sha256=ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ")]
    [InlineData("sha256=not-hex-at-all!!")]
    public void ValidateSignature_WithInvalidHexInHeader_ReturnsFalse(string malformedHeader)
    {
        // Should not throw FormatException — must return false instead.
        Assert.False(WebhooksController.ValidateSignature("body", "secret", malformedHeader));
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
