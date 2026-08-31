"use client";

import { useState, useEffect } from "react";
import { purchasesService } from "@/services/purchases.service";
import { PurchaseReturn, Purchase } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { downloadCSV } from "@/lib/export-csv";
import {
  RotateCcw,
  Plus,
  Truck,
  X,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Package,
  Layers,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchaseId, setPurchaseId] = useState("");
  const [returnNumber, setReturnNumber] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rets, purs] = await Promise.all([
        purchasesService.getPurchaseReturns(),
        purchasesService.getPurchases(),
      ]);
      setReturns(rets);
      setPurchases(purs);
      if (purs.length > 0 && !purchaseId) {
        setPurchaseId(purs[0].id);
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
    setReturnNumber(`PR-${Date.now().toString().slice(-6)}`);
    setReason("");
    setIsModalOpen(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseId) return;
    setSubmitting(true);

    try {
      const purchase = purchases.find((p) => p.id === purchaseId);
      if (!purchase || !purchase.items || purchase.items.length === 0) {
        throw new Error("No items found on this purchase invoice to return.");
      }

      const itemsPayload = purchase.items.map((it) => ({
        purchase_item_id: it.id,
        quantity: Number(it.quantity),
      }));

      await purchasesService.createPurchaseReturn({
        purchase_id: purchaseId,
        return_number: returnNumber,
        items: itemsPayload,
        reason: reason || undefined,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to process purchase return");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Return #",
      "Original Purchase Bill #",
      "Supplier Name",
      "Date",
      "Total Refund / Debt Reduction (PKR)",
      "Reason",
    ];

    const rows = returns.map((r) => [
      r.return_number,
      r.purchase?.invoice_number || "N/A",
      r.purchase?.supplier?.name || "Wholesale Vendor",
      new Date(r.created_at).toLocaleDateString(),
      Number(r.total || 0).toFixed(2),
      r.reason || "Defective Goods",
    ]);

    downloadCSV("solvexa_purchase_returns_report", headers, rows);
  };

  const totalReturnedAmount = returns.reduce((sum, r) => sum + Number(r.total || 0), 0);

  const columns: Column<PurchaseReturn>[] = [
    {
      header: "Return #",
      cell: (r) => (
        <span className="font-mono font-black text-amber-950 text-xs">{r.return_number}</span>
      ),
    },
    {
      header: "Original Purchase #",
      cell: (r) => (
        <span className="font-mono text-purple-950 font-bold text-xs">
          {r.purchase?.invoice_number || "Purchase Invoice"}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (r) => (
        <span className="text-slate-500 font-mono text-xs">
          {new Date(r.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Distributor / Supplier",
      cell: (r) => (
        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-amber-700" />
          <span>{r.purchase?.supplier?.name || "Wholesale Supplier"}</span>
        </div>
      ),
    },
    {
      header: "Total Refund Value",
      align: "right",
      cell: (r) => (
        <span className="font-mono font-black text-xs text-amber-950">
          Rs. {Number(r.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Return Reason",
      cell: (r) => (
        <span className="text-slate-600 text-xs italic">
          {r.reason || "Defective Goods / Damaged Batch"}
        </span>
      ),
    },
  ];

  return (
    <ProtectedRoute permission="return_purchases">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-amber-700" />
            <span>Purchase Returns &amp; Vendor Debit Notes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Return damaged or defective merchandise to suppliers, reverse physical inventory stock, and debit payable balance ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>New Purchase Return</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Purchase Return Value</span>
          <p className="text-2xl font-black text-amber-950 font-mono">
            Rs. {totalReturnedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-800 font-bold">Credited back / debt deducted</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Processed Return Batches</span>
          <p className="text-2xl font-black text-purple-950 font-mono">
            {returns.length}
          </p>
          <span className="text-[10px] text-slate-500">Vendor debit note vouchers</span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={returns}
        loading={loading}
        searchPlaceholder="Search returns by return # or purchase invoice #..."
        searchFilter={(r, q) =>
          r.return_number.toLowerCase().includes(q) ||
          Boolean(r.purchase?.invoice_number && r.purchase.invoice_number.toLowerCase().includes(q))
        }
      />

      {/* Create Purchase Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border-2 border-amber-400/40 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950">Process Purchase Return</h3>
                  <p className="text-[11px] text-slate-500">
                    Reverses physical inventory stock and reduces supplier debt.
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
                  Select Inward Purchase Invoice *
                </label>
                <select
                  required
                  value={purchaseId}
                  onChange={(e) => setPurchaseId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-amber-600 font-semibold"
                >
                  {purchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.invoice_number} — {p.supplier?.name} (Total: Rs. {Number(p.total).toFixed(2)})
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
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-amber-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Return Reason / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Expired batch or damaged carton packaging"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-amber-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Process Return Voucher</span>
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
