import { createClient } from "@/lib/supabase/client";
import { Settings, AuditLog } from "@/types/database.types";

export const settingsService = {
  async getSettings() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", true)
      .single();

    if (error) {
      return {
        id: true,
        store_name: "Solxa Grocery Store",
        store_address: "Solxa Main Market, Pakistan",
        store_phone: "+92 300 1234567",
        currency: "PKR",
        default_tax_rate: 0,
        low_stock_alert_enabled: true,
        updated_at: new Date().toISOString(),
      } as Settings;
    }
    return data as Settings;
  },

  async updateSettings(updates: Partial<Settings>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("settings")
      .update({
        store_name: updates.store_name,
        store_address: updates.store_address || null,
        store_phone: updates.store_phone || null,
        currency: updates.currency || "PKR",
        default_tax_rate: Number(updates.default_tax_rate || 0),
        low_stock_alert_enabled: updates.low_stock_alert_enabled !== undefined ? updates.low_stock_alert_enabled : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", true)
      .select()
      .single();

    if (error) throw error;
    return data as Settings;
  },
};

export const auditService = {
  async getAuditLogs() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*, actor:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []) as AuditLog[];
  },
};
