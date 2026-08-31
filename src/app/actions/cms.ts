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
  badge?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  display_order?: number;
  is_active: boolean;
  updated_at?: string;
  created_at?: string;
}

export const DEFAULT_CMS_POSTS: CMSContent[] = [
  {
    id: "def-hero",
    section_key: "hero",
    title: "Fresh Groceries Delivered Daily to Your Doorstep",
    subtitle: "Solvexa Supermarket & Grocery ERP",
    content_body: "Explore high quality organic farm produce, fresh dairy, bakery goods, and everyday household essentials at wholesale prices with instant express checkout.",
    badge: "100% Organic & Farm Fresh",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
    button_text: "Explore Products",
    button_url: "/products",
    display_order: 1,
    is_active: true,
  },
  {
    id: "def-promo",
    section_key: "promo_banner",
    title: "Ramadan & Weekly Mega Savings Discount",
    subtitle: "Save up to 30% on All Pantry Essentials",
    content_body: "Stock up on premium Basmati rice, cold-pressed cooking oils, farm fresh eggs, and golden bakery biscuits. Limited time discounts applied across all store aisles.",
    badge: "Special Store Promotion",
    image_url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1200&auto=format&fit=crop&q=80",
    button_text: "Shop Savings",
    button_url: "/products",
    display_order: 2,
    is_active: true,
  },
  {
    id: "def-feature",
    section_key: "feature_fresh",
    title: "Guaranteed 100% Farm Fresh Harvest",
    subtitle: "Handpicked Daily from Local Farmers",
    content_body: "Our fruits and vegetables are sourced early every morning from certified pesticide-free farms to ensure unbeatable nutrition, crispness, and rich natural taste.",
    badge: "Direct Farm Supply",
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    display_order: 3,
    is_active: true,
  },
  {
    id: "def-about",
    section_key: "about",
    title: "Solving Grocery Logistics & Modern Retail Management",
    subtitle: "Built with Royal Purple Heritage & Golden Margins",
    content_body: "Solvexa Grocery ERP is an enterprise-grade retail platform engineered for high-volume inventory management, double-entry financial ledger accounting, and rapid barcode POS checkout.",
    badge: "Store Architecture",
    image_url: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80",
    display_order: 4,
    is_active: true,
  },
  {
    id: "def-contact",
    section_key: "contact",
    title: "Store Location, Helpline & Customer Support Desk",
    subtitle: "We are Available 7 Days a Week (8:00 AM - 11:00 PM)",
    content_body: "Visit our flagship supermarket store or contact our centralized billing desk for bulk institutional orders and wholesale supply contracts.",
    image_url: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80",
    display_order: 5,
    is_active: true,
  },
];

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
