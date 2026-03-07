using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using JoineryServer.Models;

namespace JoineryServer.Data.Configurations;

public class GitQueryFileConfiguration : IEntityTypeConfiguration<GitQueryFile>
{
    public void Configure(EntityTypeBuilder<GitQueryFile> entity)
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.GitRepositoryId).IsRequired();
        entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
        entity.Property(e => e.FileName).IsRequired().HasMaxLength(200);
        entity.Property(e => e.Description).HasMaxLength(1000);
        entity.Property(e => e.DatabaseType).HasMaxLength(50);
        entity.Property(e => e.LastCommitAuthor).HasMaxLength(100);
        entity.Property(e => e.Tags)
            .HasConversion(
                v => string.Join(',', v ?? new List<string>()),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
            )
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (a, b) =>
                    ReferenceEquals(a, b)
                    || (a == null && b == null)
                    || (a != null && b != null && a.SequenceEqual(b)),
                v => v == null ? 0 : v.Aggregate(0, (a, s) => HashCode.Combine(a, s.GetHashCode())),
                v => v == null ? null! : v.ToList()));

        // Relationship: GitQueryFile -> GitRepository
        entity.HasOne(e => e.GitRepository)
              .WithMany(r => r.QueryFiles)
              .HasForeignKey(e => e.GitRepositoryId)
              .OnDelete(DeleteBehavior.Cascade);

        // Ensure unique combination of GitRepositoryId and FilePath
        entity.HasIndex(e => new { e.GitRepositoryId, e.FilePath }).IsUnique();
    }
}