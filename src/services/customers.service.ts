import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/types/database.types";

export const customersService = {
  async getCustomers() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as Customer[];
  },

  async createCustomer(customer: Partial<Customer>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        address: customer.address || null,
        credit_limit: Number(customer.credit_limit || 0),
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: updates.name,
        phone: updates.phone || null,
        email: updates.email || null,
        address: updates.address || null,
        credit_limit: Number(updates.credit_limit || 0),
        is_active: updates.is_active !== undefined ? updates.is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async getCustomerDetails(id: string) {
    const supabase = createClient();
    const { data: customer, error: cErr } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (cErr) throw cErr;

    const { data: sales } = await supabase
      .from("sales")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    return {
      customer: customer as Customer,
      sales: sales || [],
      payments: payments || [],
    };
  },
};
