import { createClient } from "@/lib/supabase/server";

export interface UserPermissionsResult {
  permissions: string[];
  role: string | null;
  isAdmin: boolean;
}

export async function getUserPermissions(
  userId: string,
  userEmail?: string | null
): Promise<UserPermissionsResult> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id, role:roles(name)")
    .eq("id", userId)
    .single();

  const roleObj = profile?.role as { name?: string } | { name?: string }[] | null;
  const roleName =
    (Array.isArray(roleObj) ? roleObj[0]?.name : roleObj?.name) ?? null;
  const isAdmin = roleName === "Admin" || userEmail === "rohan@gmail.com";

  if (isAdmin) {
    const { data: allPerms } = await supabase.from("permissions").select("code");
    return {
      permissions: allPerms?.map((p) => p.code) || [],
      role: "Admin",
      isAdmin: true,
    };
  }

  if (profile?.role_id) {
    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select("permission:permissions(code)")
      .eq("role_id", profile.role_id);

    const permissions =
      rolePerms
        ?.map((rp) => {
          const perm = rp.permission as { code?: string } | { code?: string }[] | null;
          return Array.isArray(perm) ? perm[0]?.code : perm?.code;
        })
        .filter(Boolean) as string[] || [];

    return { permissions, role: roleName, isAdmin: false };
  }

  // First user fallback
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (count === 1) {
    const { data: allPerms } = await supabase.from("permissions").select("code");
    return {
      permissions: allPerms?.map((p) => p.code) || [],
      role: "Admin",
      isAdmin: true,
    };
  }

  return { permissions: [], role: roleName, isAdmin: false };
}
