using Xunit;
using JoineryServer.Models;

namespace JoineryServer.Tests;

public class TeamMemberTests
{
    [Fact]
    public void GetEffectivePermissions_WhenPermissionsExplicitlySet_ReturnsExplicitPermissions()
    {
        var member = new TeamMember
        {
            Role = TeamRole.Member,
            Permissions = TeamPermission.EditQueries | TeamPermission.DeleteQueries
        };

        var result = member.GetEffectivePermissions();

        Assert.Equal(TeamPermission.EditQueries | TeamPermission.DeleteQueries, result);
    }

    [Fact]
    public void GetEffectivePermissions_WhenRoleIsAdministratorAndNoExplicitPermissions_ReturnsFullAccess()
    {
        var member = new TeamMember
        {
            Role = TeamRole.Administrator,
            Permissions = null
        };

        var result = member.GetEffectivePermissions();

        Assert.Equal(TeamPermission.FullAccess, result);
    }

    [Fact]
    public void GetEffectivePermissions_WhenRoleIsMemberAndNoExplicitPermissions_ReturnsReadOnly()
    {
        var member = new TeamMember
        {
            Role = TeamRole.Member,
            Permissions = null
        };

        var result = member.GetEffectivePermissions();

        Assert.Equal(TeamPermissionLevels.ReadOnly, result);
    }

    [Fact]
    public void GetEffectivePermissions_WhenPermissionsSetToNone_ReturnsNone()
    {
        var member = new TeamMember
        {
            Role = TeamRole.Administrator,
            Permissions = TeamPermission.None
        };

        var result = member.GetEffectivePermissions();

        Assert.Equal(TeamPermission.None, result);
    }

    [Theory]
    [InlineData(TeamPermission.ReadQueries)]
    [InlineData(TeamPermission.CreateQueries)]
    [InlineData(TeamPermission.FullAccess)]
    public void GetEffectivePermissions_WithVariousExplicitPermissions_ReturnsThosePermissions(
        TeamPermission explicitPermission)
    {
        var member = new TeamMember { Permissions = explicitPermission };

        var result = member.GetEffectivePermissions();

        Assert.Equal(explicitPermission, result);
    }

    [Fact]
    public void FullAccess_ContainsAllIndividualPermissions()
    {
        Assert.True(TeamPermission.FullAccess.HasFlag(TeamPermission.ReadQueries));
        Assert.True(TeamPermission.FullAccess.HasFlag(TeamPermission.CreateQueries));
        Assert.True(TeamPermission.FullAccess.HasFlag(TeamPermission.EditQueries));
        Assert.True(TeamPermission.FullAccess.HasFlag(TeamPermission.DeleteQueries));
        Assert.True(TeamPermission.FullAccess.HasFlag(TeamPermission.ManageFolders));
    }

    [Fact]
    public void PermissionLevels_HaveExpectedFlags()
    {
        Assert.Equal(TeamPermission.ReadQueries, TeamPermissionLevels.ReadOnly);
        Assert.True(TeamPermissionLevels.Editor.HasFlag(TeamPermission.ReadQueries));
        Assert.True(TeamPermissionLevels.Editor.HasFlag(TeamPermission.CreateQueries));
        Assert.True(TeamPermissionLevels.Editor.HasFlag(TeamPermission.EditQueries));
        Assert.Equal(TeamPermission.FullAccess, TeamPermissionLevels.Administrator);
    }
}
