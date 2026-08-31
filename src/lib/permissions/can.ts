/**
 * Helper to test if a list of permission codes contains a required code.
 */
export function can(userPermissions: string[] | undefined, requiredPermission: string): boolean {
  if (!userPermissions) return false;
  // If user has wildcard/admin capability or explicit permission code
  return userPermissions.includes(requiredPermission) || userPermissions.includes("admin_all");
}
