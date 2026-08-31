import { createClient } from "@/lib/supabase/client";
import { Expense, ExpenseCategory, PaymentMethod } from "@/types/database.types";

export const expensesService = {
  async getExpenses() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expenses")
      .select("*, category:expense_categories(*)")
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return (data || []) as Expense[];
  },

  async getExpenseCategories() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as ExpenseCategory[];
  },

  async createExpense(params: {
    expense_category_id: string;
    amount: number;
    method: PaymentMethod;
    note?: string;
    expense_date?: string;
  }) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        expense_category_id: params.expense_category_id,
        amount: Number(params.amount),
        method: params.method || "CASH",
        note: params.note || null,
        expense_date: params.expense_date || new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  },

  async createExpenseCategory(name: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("expense_categories")
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data as ExpenseCategory;
  },
};
