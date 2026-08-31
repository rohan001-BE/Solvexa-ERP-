import { createClient } from "@/lib/supabase/client";
import { Purchase, PurchaseReturn, PaymentMethod } from "@/types/database.types";

export interface CreatePurchaseParams {
  supplier_id: string;
  invoice_number: string;
  items: {
    product_id: string;
    quantity: number;
    unit_cost: number;
    discount?: number;
    tax?: number;
  }[];
  paid_amount: number;
  payment_method: PaymentMethod;
}

export const purchasesService = {
  async getPurchases() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("purchases")
      .select("*, supplier:suppliers(*), items:purchase_items(*, product:products(*))")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Purchase[];
  },

  async getPurchaseById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("purchases")
      .select("*, supplier:suppliers(*), items:purchase_items(*, product:products(*))")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Purchase;
  },

  async createPurchase(params: CreatePurchaseParams) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_purchase", {
      p_supplier_id: params.supplier_id,
      p_invoice_number: params.invoice_number,
      p_items: params.items,
      p_paid_amount: Number(params.paid_amount || 0),
      p_payment_method: params.payment_method || "CASH",
    });

    if (error) throw error;
    return data as string; // returns purchase_id
  },

  async createPurchaseReturn(
    inputOrId: { purchase_id: string; return_number: string; items: any[]; reason?: string } | string,
    returnNumber?: string,
    items?: any[],
    reason?: string
  ) {
    const supabase = createClient();
    const pId = typeof inputOrId === "string" ? inputOrId : inputOrId.purchase_id;
    const rNum = typeof inputOrId === "string" ? returnNumber! : inputOrId.return_number;
    const its = typeof inputOrId === "string" ? items! : inputOrId.items;
    const rsn = typeof inputOrId === "string" ? reason : inputOrId.reason;

    const { data, error } = await supabase.rpc("create_purchase_return", {
      p_purchase_id: pId,
      p_return_number: rNum,
      p_items: its,
      p_reason: rsn || "",
    });

    if (error) throw error;
    return data as string;
  },

  async getPurchaseReturns() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("purchase_returns")
      .select("*, purchase:purchases(*, supplier:suppliers(*)), items:purchase_return_items(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as PurchaseReturn[];
  },
};
