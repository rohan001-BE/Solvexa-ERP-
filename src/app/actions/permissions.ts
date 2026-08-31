"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateRolePermissionsInput {
  roleId: string;
  permissionIds: string[];
}

export async function updateRolePermissions(input: UpdateRolePermissionsInput) {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    throw new Error("Unauthorized: Please log in");
  }

  // Check if current user is Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role:roles(name)")
    .eq("id", currentUser.id)
    .single();

  const roleObj: any = profile?.role;
  const roleName = Array.isArray(roleObj) ? roleObj[0]?.name : roleObj?.name;
  const isAdmin = roleName === "Admin" || currentUser.email === "rohan@gmail.com";

  if (!isAdmin) {
    throw new Error("Forbidden: Only Administrators can modify role access permissions");
  }

  const { roleId, permissionIds } = input;

  // 1. Delete all existing permissions for this role
  const { error: delErr } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId);

  if (delErr) {
    console.error("Error removing old role permissions:", delErr);
    throw new Error(delErr.message || "Failed to update role permissions");
  }

  // 2. Insert new permissions if any
  if (permissionIds.length > 0) {
    const rows = permissionIds.map((pId) => ({
      role_id: roleId,
      permission_id: pId,
    }));

    const { error: insErr } = await supabase
      .from("role_permissions")
      .insert(rows);

    if (insErr) {
      console.error("Error saving new role permissions:", insErr);
      throw new Error(insErr.message || "Failed to assign role permissions");
    }
  }

  revalidatePath("/employees");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: true };
}
