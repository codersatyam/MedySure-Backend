// Loads a user's effective permissions and group names.
// Effective permissions = (permissions from assigned groups) UNION (direct grants),
// each formatted as "resource:action". Shared by the auth middleware and the
// auth service's getMe so both stay consistent.
const loadUserPermissions = async (client, userId) => {
  const [{ data: groupRows }, { data: directRows }] = await Promise.all([
    client
      .from('user_permission_groups')
      .select('permission_groups(name, permission_group_items(permissions(resource, action)))')
      .eq('user_id', userId),
    client
      .from('user_permissions')
      .select('permissions(resource, action)')
      .eq('user_id', userId),
  ]);

  const permissions = new Set();
  const groups = [];

  groupRows?.forEach((row) => {
    const group = row.permission_groups;
    if (!group) {
      return;
    }
    groups.push(group.name);
    group.permission_group_items?.forEach((item) => {
      const perm = item.permissions;
      if (perm) {
        permissions.add(`${perm.resource}:${perm.action}`);
      }
    });
  });

  directRows?.forEach((row) => {
    const perm = row.permissions;
    if (perm) {
      permissions.add(`${perm.resource}:${perm.action}`);
    }
  });

  return { permissions: [...permissions], groups };
};

module.exports = { loadUserPermissions };
