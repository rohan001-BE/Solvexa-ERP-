import { createClient } from "@/lib/supabase/client";
import { Sale, SaleReturn, PaymentMethod } from "@/types/database.types";

export interface CreateSaleParams {
  customer_id: string | null;
  invoice_number: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax?: number;
  }[];
  paid_amount: number;
  payment_method: PaymentMethod;
}

export const salesService = {
  async getSales() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sales")
      .select("*, customer:customers(*), items:sale_items(*, product:products(*))")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Sale[];
  },

  async getSaleById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sales")
      .select("*, customer:customers(*), items:sale_items(*, product:products(*))")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Sale;
  },

  async createSale(params: CreateSaleParams) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_sale", {
      p_customer_id: params.customer_id || null,
      p_invoice_number: params.invoice_number,
      p_items: params.items,
      p_paid_amount: Number(params.paid_amount || 0),
      p_payment_method: params.payment_method || "CASH",
    });

    if (error) throw error;
    return data as string; // returns sale_id
  },

  async createSalesReturn(
    inputOrId: { sale_id: string; return_number: string; items: any[]; reason?: string } | string,
    returnNumber?: string,
    items?: any[],
    reason?: string
  ) {
    const supabase = createClient();
    const sId = typeof inputOrId === "string" ? inputOrId : inputOrId.sale_id;
    const rNum = typeof inputOrId === "string" ? returnNumber! : inputOrId.return_number;
    const its = typeof inputOrId === "string" ? items! : inputOrId.items;
    const rsn = typeof inputOrId === "string" ? reason : inputOrId.reason;

    const { data, error } = await supabase.rpc("create_sales_return", {
      p_sale_id: sId,
      p_return_number: rNum,
      p_items: its,
      p_reason: rsn || "",
    });

    if (error) throw error;
    return data as string;
  },

  async getSalesReturns() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sales_returns")
      .select("*, sale:sales(*, customer:customers(*)), items:sales_return_items(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as SaleReturn[];
  },
};
