"use client";

import { useState, useEffect } from "react";
import { salesService } from "@/services/sales.service";
import { SaleReturn, Sale } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { RotateCcw, Plus, X, Loader2, AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function SalesReturnsPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saleId, setSaleId] = useState("");
  const [returnNumber, setReturnNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rets, salesList] = await Promise.all([
        salesService.getSalesReturns(),
        salesService.getSales(),
      ]);
      setReturns(rets);
      setSales(salesList);
      if (salesList.length > 0 && !saleId) {
        setSaleId(salesList[0].id);
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

  const openModal = () => {
    setReturnNumber(`SR-${Date.now().toString().slice(-6)}`);
    setReason("");
    setIsModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleId) return;
    setSubmitting(true);

    try {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale || !sale.items || sale.items.length === 0) {
        throw new Error("No items found on this sales invoice to return.");
      }

      const itemsPayload = sale.items.map((it) => ({
        sale_item_id: it.id,
        quantity: Number(it.quantity),
      }));

      await salesService.createSalesReturn({
        sale_id: saleId,
        return_number: returnNumber,
        items: itemsPayload,
        reason: reason || undefined,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to process sales return");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<SaleReturn>[] = [
    {
      header: "Return #",
      cell: (r) => (
        <span className="font-mono font-bold text-purple-950">{r.return_number}</span>
      ),
    },
    {
      header: "Original Sale Invoice",
      cell: (r) => (
        <span className="font-mono text-purple-900 font-bold">
          {r.sale?.invoice_number || "Sale"}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (r) => (
        <span className="text-slate-500 font-mono text-[11px]">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Customer",
      cell: (r) => (
        <span className="font-semibold text-slate-800">
          {r.sale?.customer?.name || "Customer"}
        </span>
      ),
    },
    {
      header: "Total Restocked Value",
      align: "right",
      cell: (r) => (
        <span className="font-mono font-extrabold text-purple-950">
          Rs. {Number(r.total || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Return Reason",
      cell: (r) => <span className="text-slate-600 text-xs">{r.reason || "Customer Exchange"}</span>,
    },
  ];

  return (
    <ProtectedRoute permission="return_sales">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-purple-700" />
            <span>Sales Returns &amp; Customer Credit Notes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process customer returns, restock inventory on hand, and adjust customer credit balances.
          </p>
        </div>

        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>New Sales Return</span>
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        searchPlaceholder="Search returns by return # or sale invoice #..."
        searchFilter={(r, q) =>
          r.return_number.toLowerCase().includes(q) ||
          Boolean(r.sale?.invoice_number && r.sale.invoice_number.toLowerCase().includes(q))
        }
      />

      {/* Create Sales Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border border-purple-100 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Process Sales Return</h3>
                  <p className="text-[11px] text-slate-500">
                    Restocks inventory and reconciles customer receivable balance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Sales Invoice *
                </label>
                <select
                  required
                  value={saleId}
                  onChange={(e) => setSaleId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600 font-semibold"
                >
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.invoice_number} — {s.customer?.name || "Walk-in"} (Rs. {Number(s.total).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Return Reference # *
                </label>
                <input
                  type="text"
                  required
                  value={returnNumber}
                  onChange={(e) => setReturnNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Return Reason / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer changed mind or wrong variant purchased"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-700/25 flex items-center gap-2 transition-all"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Process Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
