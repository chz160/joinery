using Xunit;
using JoineryServer.Services;

namespace JoineryServer.Tests;

/// <summary>Tests for pure/static logic in <see cref="GitRepositoryService"/>.</summary>
public class GitRepositoryServiceTests
{
    // --- IsValidRepositoryUrl ---

    [Theory]
    [InlineData("https://github.com/owner/repo", true)]
    [InlineData("https://github.com/owner/repo.git", true)]
    [InlineData("git@github.com:owner/repo.git", true)]
    [InlineData("git@github.com:owner/repo", true)]
    [InlineData("http://github.com/owner/repo", false)]   // plain HTTP not accepted
    [InlineData("https://github.com/owner", false)]       // missing repo segment
    [InlineData("https://gitlab.com/owner/repo", false)]  // not GitHub
    [InlineData("", false)]
    [InlineData("   ", false)]
    [InlineData("not-a-url", false)]
    public void IsValidRepositoryUrl_ReturnsExpected(string url, bool expected)
    {
        Assert.Equal(expected, GitRepositoryService.IsValidRepositoryUrl(url));
    }

    // --- IncrementalSyncResult ---

    [Fact]
    public void IncrementalSyncResult_NoOp_HasZeroCounts()
    {
        var result = new IncrementalSyncResult("abc123", [], [], [], IsNoOp: true);

        Assert.True(result.IsNoOp);
        Assert.Empty(result.Added);
        Assert.Empty(result.Modified);
        Assert.Empty(result.DeletedFilePaths);
        Assert.Equal("abc123", result.HeadCommitSha);
    }

    [Fact]
    public void IncrementalSyncResult_WithChanges_IsNotNoOp()
    {
        var added = new List<JoineryServer.Models.GitQueryFile>
        {
            new() { FilePath = "queries/new.sql", FileName = "new.sql" }
        };

        var result = new IncrementalSyncResult(
            "newsha",
            added,
            [],
            ["queries/deleted.sql"],
            IsNoOp: false);

        Assert.False(result.IsNoOp);
        Assert.Single(result.Added);
        Assert.Empty(result.Modified);
        Assert.Single(result.DeletedFilePaths);
    }
}
