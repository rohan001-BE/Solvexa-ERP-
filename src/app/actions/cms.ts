"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserPermissions } from "@/lib/permissions/get-user-permissions";
import { CMSContent, DEFAULT_CMS_POSTS } from "@/lib/cms-constants";

export async function getCMSContent(sectionKey: string): Promise<CMSContent | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_content")
      .select("*")
      .eq("section_key", sectionKey)
      .single();

    if (!error && data) {
      return data as CMSContent;
    }
  } catch {
    // Fallback gracefully
  }

  const fallback = DEFAULT_CMS_POSTS.find((p) => p.section_key === sectionKey);
  return fallback || null;
}

export async function getAllCMSContent(): Promise<CMSContent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_content")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      // Merge with default sections if any are missing
      const existingKeys = new Set(data.map((d: any) => d.section_key));
      const missingDefaults = DEFAULT_CMS_POSTS.filter((def) => !existingKeys.has(def.section_key));
      return [...(data as CMSContent[]), ...missingDefaults];
    }
  } catch {
    // Fallback gracefully
  }

  return DEFAULT_CMS_POSTS;
}

export async function getPublicCMSPosts(): Promise<CMSContent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cms_content")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as CMSContent[];
    }
  } catch {
    // Fallback gracefully
  }

  return DEFAULT_CMS_POSTS;
}

export async function updateCMSContent(sectionKey: string, payload: Partial<CMSContent>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { isAdmin, permissions } = await getUserPermissions(user.id, user.email);
  if (!isAdmin && !permissions.includes("manage_settings")) {
    throw new Error("Permission denied. Administrator access required.");
  }

  const { data: existing } = await supabase
    .from("cms_content")
    .select("id")
    .eq("section_key", sectionKey)
    .single();

  let error;
  if (existing) {
    const { error: updateError } = await supabase
      .from("cms_content")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("section_key", sectionKey);
    error = updateError;
  } else {
    const { error: insertError } = await supabase.from("cms_content").insert({
      section_key: sectionKey,
      ...payload,
      updated_at: new Date().toISOString(),
    });
    error = insertError;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/cms");
  return { success: true };
}

export async function createCMSPost(payload: {
  section_key: string;
  title: string;
  subtitle?: string;
  content_body: string;
  image_url?: string;
  badge?: string;
  button_text?: string;
  button_url?: string;
  display_order?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { isAdmin, permissions } = await getUserPermissions(user.id, user.email);
  if (!isAdmin && !permissions.includes("manage_settings")) {
    throw new Error("Permission denied. Administrator access required.");
  }

  const { error } = await supabase.from("cms_content").insert({
    ...payload,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/cms");
  return { success: true };
}

export async function deleteCMSPost(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { isAdmin, permissions } = await getUserPermissions(user.id, user.email);
  if (!isAdmin && !permissions.includes("manage_settings")) {
    throw new Error("Permission denied. Administrator access required.");
  }

  const { error } = await supabase.from("cms_content").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/cms");
  return { success: true };
}

export async function toggleCMSStatus(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { isAdmin, permissions } = await getUserPermissions(user.id, user.email);
  if (!isAdmin && !permissions.includes("manage_settings")) {
    throw new Error("Permission denied. Administrator access required.");
  }

  const { error } = await supabase
    .from("cms_content")
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/cms");
  return { success: true };
}
