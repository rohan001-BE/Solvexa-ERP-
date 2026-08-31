import { createClient } from "@/lib/supabase/client";
import { Payment, PaymentDirection, PaymentMethod } from "@/types/database.types";

export interface RecordPaymentParams {
  direction: PaymentDirection;
  customer_id?: string | null;
  supplier_id?: string | null;
  sale_id?: string | null;
  purchase_id?: string | null;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

export const paymentsService = {
  async getPayments() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*, customer:customers(*), supplier:suppliers(*), sale:sales(*), purchase:purchases(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Payment[];
  },

  async recordPayment(params: RecordPaymentParams) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("record_payment", {
      p_direction: params.direction,
      p_customer_id: params.customer_id || null,
      p_supplier_id: params.supplier_id || null,
      p_sale_id: params.sale_id || null,
      p_purchase_id: params.purchase_id || null,
      p_amount: Number(params.amount),
      p_method: params.method,
      p_reference: params.reference || null,
      p_notes: params.notes || null,
    });

    if (error) throw error;
    return data as string;
  },
};
