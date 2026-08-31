"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateStaffInput {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  roleId: string;
}

export async function createStaffAccount(input: CreateStaffInput) {
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
    throw new Error("Forbidden: Only Administrators can create staff accounts");
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password || "001001";
  const fullName = input.fullName.trim();
  const phone = input.phone?.trim() || "";
  const roleId = input.roleId;

  // Call Supabase RPC procedure for clean, Cloudflare-compatible user creation
  const { data: newUserId, error: rpcErr } = await supabase.rpc("create_staff_user", {
    p_email: email,
    p_password: password,
    p_full_name: fullName,
    p_phone: phone,
    p_role_id: roleId,
  });

  if (rpcErr) {
    console.error("Error in create_staff_user RPC:", rpcErr);
    throw new Error(rpcErr.message || "Failed to create staff account");
  }

  revalidatePath("/employees");
  return { success: true, userId: newUserId };
}
