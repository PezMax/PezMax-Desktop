export function hasManagementPermission(userStore, prefixes = []) {
  const roles = Array.isArray(userStore?.roles) ? userStore.roles : []
  const permissions = Array.isArray(userStore?.permissions) ? userStore.permissions : []

  if (roles.includes('admin') || permissions.includes('*:*:*')) {
    return true
  }

  return prefixes.some((prefix) =>
    permissions.some((permission) => permission === prefix || permission.startsWith(prefix))
  )
}
