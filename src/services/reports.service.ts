import { createClient } from "@/lib/supabase/client";

export const reportsService = {
  async getDashboardSummary() {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.rpc("get_dashboard_metrics");
      if (!error && data) {
        return data as {
          today_sales: number;
          today_purchases: number;
          total_products: number;
          low_stock_count: number;
          total_receivables: number;
          total_payables: number;
        };
      }
    } catch {
      // fallback
    }

    const [{ data: sales }, { data: purchases }, { count: productCount }, { data: customers }, { data: suppliers }] =
      await Promise.all([
        supabase.from("sales").select("total, created_at"),
        supabase.from("purchases").select("total, created_at"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("customers").select("current_balance"),
        supabase.from("suppliers").select("current_balance"),
      ]);

    const todayStr = new Date().toISOString().split("T")[0];
    const todaySales = (sales || [])
      .filter((s) => s.created_at?.startsWith(todayStr))
      .reduce((acc, curr) => acc + Number(curr.total || 0), 0);

    const todayPurchases = (purchases || [])
      .filter((p) => p.created_at?.startsWith(todayStr))
      .reduce((acc, curr) => acc + Number(curr.total || 0), 0);

    const totalReceivables = (customers || []).reduce((acc, c) => acc + Number(c.current_balance || 0), 0);
    const totalPayables = (suppliers || []).reduce((acc, s) => acc + Number(s.current_balance || 0), 0);

    return {
      today_sales: todaySales,
      today_purchases: todayPurchases,
      total_products: productCount || 0,
      low_stock_count: 0,
      total_receivables: totalReceivables,
      total_payables: totalPayables,
    };
  },

  async getSalesReport(startDate?: string, endDate?: string) {
    const supabase = createClient();
    let query = supabase
      .from("sales")
      .select("*, customer:customers(name), items:sale_items(quantity, unit_price, total, product:products(name, sku))")
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getPurchasesReport(startDate?: string, endDate?: string) {
    const supabase = createClient();
    let query = supabase
      .from("purchases")
      .select("*, supplier:suppliers(name), items:purchase_items(quantity, unit_cost, total, product:products(name, sku))")
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("created_at", startDate);
    if (endDate) query = query.lte("created_at", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getExpensesReport() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expenses")
      .select("*, category:expense_categories(name)")
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInventoryReport() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("inventory")
      .select("*, product:products(*, category:categories(name), unit:units(symbol))")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProfitLossReport() {
    const supabase = createClient();
    const [{ data: sales }, { data: purchases }, { data: expenses }] = await Promise.all([
      supabase.from("sales").select("total"),
      supabase.from("purchases").select("total"),
      supabase.from("expenses").select("amount"),
    ]);

    const totalRevenue = (sales || []).reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalCost = (purchases || []).reduce((sum, p) => sum + Number(p.total || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalRevenue - totalCost - totalExpenses;

    return {
      totalRevenue,
      totalCost,
      totalExpenses,
      netProfit,
    };
  },
};
