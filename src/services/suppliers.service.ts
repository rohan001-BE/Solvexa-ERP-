import { createClient } from "@/lib/supabase/client";
import { Supplier } from "@/types/database.types";

export const suppliersService = {
  async getSuppliers() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Supplier[];
  },

  async createSupplier(supplier: Partial<Supplier>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        name: supplier.name,
        company_name: supplier.company_name || supplier.contact_person || null,
        phone: supplier.phone || null,
        email: supplier.email || null,
        address: supplier.address || null,
        opening_balance: Number(supplier.opening_balance || 0),
        current_balance: Number(supplier.opening_balance || 0),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Supplier;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .update({
        name: updates.name,
        company_name: updates.company_name || updates.contact_person || null,
        phone: updates.phone || null,
        email: updates.email || null,
        address: updates.address || null,
        is_active: updates.is_active !== undefined ? updates.is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Supplier;
  },

  async getSupplierDetails(id: string) {
    const supabase = createClient();
    const { data: supplier, error: sErr } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .single();

    if (sErr) throw sErr;

    const { data: purchases } = await supabase
      .from("purchases")
      .select("*")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false });

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false });

    return {
      supplier: supplier as Supplier,
      purchases: purchases || [],
      payments: payments || [],
    };
  },
};
