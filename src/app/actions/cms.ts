"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserPermissions } from "@/lib/permissions/get-user-permissions";

export interface CMSContent {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content_body: string | null;
  image_url: string | null;
  is_active: boolean;
}

export async function getCMSContent(sectionKey: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_content")
    .select("*")
    .eq("section_key", sectionKey)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Failed to fetch CMS content:", error);
    return null;
  }
  return data as CMSContent | null;
}

export async function getAllCMSContent() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cms_content")
    .select("*")
    .order("section_key");

  if (error) {
    console.error("Failed to fetch all CMS content:", error);
    return [];
  }
  return data as CMSContent[];
}

export async function updateCMSContent(sectionKey: string, payload: Partial<CMSContent>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { isAdmin, permissions } = await getUserPermissions(user.id, user.email);
  if (!isAdmin && !permissions.includes("manage_settings")) {
    throw new Error("Permission denied. You do not have permission to manage CMS content.");
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
        updated_at: new Date().toISOString()
      })
      .eq("section_key", sectionKey);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("cms_content")
      .insert({
        section_key: sectionKey,
        ...payload,
      });
    error = insertError;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/cms");
}
