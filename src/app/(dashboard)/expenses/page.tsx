"use client";

import { useState, useEffect } from "react";
import { expensesService } from "@/services/expenses.service";
import { Expense, ExpenseCategory, PaymentMethod } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Receipt, Plus, X, Loader2, DollarSign, TrendingDown } from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [exp, cats] = await Promise.all([
        expensesService.getExpenses(),
        expensesService.getExpenseCategories(),
      ]);
      setExpenses(exp);
      setCategories(cats);
      if (cats.length > 0 && !categoryId) {
        setCategoryId(cats[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || amount <= 0) return;
    setSubmitting(true);
    try {
      await expensesService.createExpense({
        expense_category_id: categoryId,
        amount: Number(amount),
        method,
        note: note || undefined,
        expense_date: expenseDate,
      });

      setIsModalOpen(false);
      setAmount(0);
      setNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const columns: Column<Expense>[] = [
    {
      header: "Expense Date",
      cell: (e) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {e.expense_date}
        </span>
      ),
    },
    {
      header: "Category",
      cell: (e) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-900 border border-rose-200">
          {e.category?.name || "Operating Expense"}
        </span>
      ),
    },
    {
      header: "Payment Method",
      cell: (e) => (
        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
          {e.method}
        </span>
      ),
    },
    {
      header: "Description / Reference",
      cell: (e) => (
        <span className="text-slate-700 text-xs font-medium">
          {e.note || "General store overhead"}
        </span>
      ),
    },
    {
      header: "Amount (PKR)",
      align: "right",
      cell: (e) => (
        <span className="font-mono font-black text-rose-800 text-xs">
          Rs. {Number(e.amount).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-700" />
            <span>Store Operating Expenses</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track overhead costs including store rent, commercial power utilities, generator diesel fuel, and payroll.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-rose-200" />
          <span>Log Operating Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-rose-600 via-red-500 to-orange-600 shadow-xl shadow-rose-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-100/80">Total Overheads</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                Rs. {totalSum.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <span className="font-black text-sm text-rose-100">PKR</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <TrendingDown className="w-3 h-3 text-rose-200" />
            <span>Directly accounted in Net P&amp;L</span>
          </div>
        </div>

        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 shadow-xl shadow-purple-900/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-200/80">Expense Categories</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">{categories.length}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <Receipt className="w-5 h-5 text-purple-100" />
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-purple-200/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <Receipt className="w-3 h-3 text-purple-300" />
            <span>Standardized expense heads</span>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        searchPlaceholder="Search expenses by note or category..."
        searchFilter={(e, q) =>
          Boolean(e.note && e.note.toLowerCase().includes(q)) ||
          Boolean(e.category?.name && e.category.name.toLowerCase().includes(q))
        }
      />

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border border-rose-100 space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-rose-950">Log Operating Expense</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Expense Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-rose-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Expense Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-rose-600 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-rose-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-200 focus:border-rose-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-rose-600 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description / Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Monthly shop rent, diesel fuel refill"
                  className="w-full bg-white border border-slate-200 focus:border-rose-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
