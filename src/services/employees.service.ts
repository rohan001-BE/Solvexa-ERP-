import { createClient } from "@/lib/supabase/client";
import { Profile, Role } from "@/types/database.types";

export const employeesService = {
  async getEmployees() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*, role:roles(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Profile[];
  },

  async getRoles() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Role[];
  },

  async updateEmployeeRole(profileId: string, roleId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ role_id: roleId, updated_at: new Date().toISOString() })
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async toggleEmployeeStatus(profileId: string, isActive: boolean) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};
