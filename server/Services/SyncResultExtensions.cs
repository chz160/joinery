using JoineryServer.Data;
using JoineryServer.Models;

namespace JoineryServer.Services;

/// <summary>
/// Extension methods for applying an <see cref="IncrementalSyncResult"/> to a
/// <see cref="JoineryDbContext"/>.  Centralises the update/add/remove logic so it
/// does not need to be duplicated across controllers.
/// </summary>
internal static class SyncResultExtensions
{
    /// <summary>
    /// Applies <paramref name="syncResult"/> to the database context for the given
    /// <paramref name="repository"/>.  Caller is responsible for calling
    /// <c>SaveChangesAsync</c> and updating <see cref="GitRepository.LastSyncAt"/> /
    /// <see cref="GitRepository.LastHeadCommitSha"/> after this method returns.
    /// </summary>
    internal static void ApplyIncrementalSyncResult(
        this JoineryDbContext context,
        GitRepository repository,
        IncrementalSyncResult syncResult)
    {
        if (syncResult.IsNoOp) return;

        if (syncResult.IsFullSync)
        {
            // Full sync replaces all existing files — remove them all before re-adding.
            context.GitQueryFiles.RemoveRange(repository.QueryFiles);
        }
        else
        {
            // Incremental — only remove files that were explicitly deleted/renamed away.
            foreach (var deletedPath in syncResult.DeletedFilePaths)
            {
                var toRemove = repository.QueryFiles.FirstOrDefault(
                    f => string.Equals(f.FilePath, deletedPath, StringComparison.OrdinalIgnoreCase));
                if (toRemove != null)
                    context.GitQueryFiles.Remove(toRemove);
            }

            // Update modified files in-place.
            foreach (var mod in syncResult.Modified)
            {
                var existing = repository.QueryFiles.FirstOrDefault(f => f.Id == mod.Id);
                if (existing != null)
                {
                    existing.SqlContent = mod.SqlContent;
                    existing.Description = mod.Description;
                    existing.DatabaseType = mod.DatabaseType;
                    existing.Tags = mod.Tags;
                    existing.LastCommitSha = mod.LastCommitSha;
                    existing.LastCommitAuthor = mod.LastCommitAuthor;
                    existing.LastCommitAt = mod.LastCommitAt;
                    existing.LastSyncAt = mod.LastSyncAt;
                }
            }
        }

        // Add newly discovered files (both incremental and full-sync).
        foreach (var added in syncResult.Added)
            context.GitQueryFiles.Add(added);
    }
}
