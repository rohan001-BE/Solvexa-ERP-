"use client";

import { useState, useEffect } from "react";
import { paymentsService } from "@/services/payments.service";
import { customersService } from "@/services/customers.service";
import { suppliersService } from "@/services/suppliers.service";
import { Payment, Customer, Supplier, PaymentDirection, PaymentMethod } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [directionFilter, setDirectionFilter] = useState<string>("all");

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [direction, setDirection] = useState<PaymentDirection>("IN");
  const [partyId, setPartyId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pays, custs, sups] = await Promise.all([
        paymentsService.getPayments(),
        customersService.getCustomers(),
        suppliersService.getSuppliers(),
      ]);
      setPayments(pays);
      setCustomers(custs);
      setSuppliers(sups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (dir: PaymentDirection) => {
    setDirection(dir);
    setPartyId(dir === "IN" ? customers[0]?.id || "" : suppliers[0]?.id || "");
    setAmount(0);
    setMethod("CASH");
    setReference("");
    setNotes("");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !partyId) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await paymentsService.recordPayment({
        direction,
        customer_id: direction === "IN" ? partyId : null,
        supplier_id: direction === "OUT" ? partyId : null,
        amount: Number(amount),
        method,
        reference: reference || null,
        notes: notes || null,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    return directionFilter === "all" || p.direction === directionFilter;
  });

  // Metrics
  const totalInflow = payments
    .filter((p) => p.direction === "IN")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalOutflow = payments
    .filter((p) => p.direction === "OUT")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const netCashFlow = totalInflow - totalOutflow;

  const columns: Column<Payment>[] = [
    {
      header: "Timestamp",
      cell: (p) => (
        <span className="font-mono text-[11px] text-slate-500">
          {new Date(p.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Flow Direction",
      cell: (p) => {
        const isIncoming = p.direction === "IN";
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
              isIncoming
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            {isIncoming ? (
              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            ) : (
              <ArrowUpRight className="w-3 h-3 text-rose-600" />
            )}
            {isIncoming ? "IN (Received)" : "OUT (Payout)"}
          </span>
        );
      },
    },
    {
      header: "Party (Customer / Supplier)",
      cell: (p) => (
        <span className="font-bold text-slate-900">
          {p.direction === "IN"
            ? p.customer?.name || "Customer Account"
            : p.supplier?.name || "Distributor Account"}
        </span>
      ),
    },
    {
      header: "Payment Method",
      cell: (p) => (
        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
          {p.method}
        </span>
      ),
    },
    {
      header: "Reference / Notes",
      cell: (p) => (
        <span className="text-slate-600 text-xs">
          {p.reference || p.notes || "—"}
        </span>
      ),
    },
    {
      header: "Amount",
      align: "right",
      cell: (p) => {
        const isIncoming = p.direction === "IN";
        return (
          <span
            className={`font-mono font-black text-xs ${
              isIncoming ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {isIncoming ? "+" : "-"} Rs. {Number(p.amount).toFixed(2)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-700" />
            <span>Payments &amp; Cash Flow Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit customer receipts (IN), supplier payment settlements (OUT), and direct treasury cash flows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openModal("IN")}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-emerald-200" />
            <span>Receive Payment (IN)</span>
          </button>
          <button
            onClick={() => openModal("OUT")}
            className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-rose-200" />
            <span>Pay Supplier (OUT)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-emerald-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Inflow Receipts</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            + Rs. {totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-800 font-bold">Customer invoice collections</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-rose-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Outflow Payouts</span>
          <p className="text-2xl font-black text-rose-800 font-mono">
            - Rs. {totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-rose-700 font-bold">Supplier bill settlements</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Net Ledger Cashflow</span>
          <p
            className={`text-2xl font-black font-mono ${
              netCashFlow >= 0 ? "text-purple-950" : "text-rose-800"
            }`}
          >
            Rs. {netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Inflows minus Outflows</span>
        </div>
      </div>

      {/* Direction Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setDirectionFilter("all")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
            directionFilter === "all"
              ? "bg-purple-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Transactions ({payments.length})
        </button>
        <button
          onClick={() => setDirectionFilter("IN")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
            directionFilter === "IN"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Inflow Receipts
        </button>
        <button
          onClick={() => setDirectionFilter("OUT")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
            directionFilter === "OUT"
              ? "bg-rose-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Supplier Payouts
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Search payments by party or reference..."
        searchFilter={(p, q) =>
          Boolean(p.reference && p.reference.toLowerCase().includes(q)) ||
          Boolean(p.notes && p.notes.toLowerCase().includes(q)) ||
          Boolean(p.customer?.name && p.customer.name.toLowerCase().includes(q)) ||
          Boolean(p.supplier?.name && p.supplier.name.toLowerCase().includes(q))
        }
      />

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-lg p-6 shadow-2xl border border-purple-100 space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    direction === "IN" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-purple-950">
                  {direction === "IN" ? "Record Customer Payment (IN)" : "Record Supplier Payout (OUT)"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {direction === "IN" ? "Select Customer Account *" : "Select Supplier / Distributor *"}
                </label>
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                >
                  {direction === "IN"
                    ? customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Due: Rs. {Number(c.current_balance || 0).toFixed(0)})
                        </option>
                      ))
                    : suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Payable: Rs. {Number(s.current_balance || 0).toFixed(0)})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-purple-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CARD">CARD (POS)</option>
                    <option value="JAZZCASH">JAZZCASH</option>
                    <option value="EASYPAISA">EASYPAISA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reference / Transaction ID</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. HBL-9923841, Slip #104"
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Internal Audit Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Settlement notes"
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
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
                  className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-md disabled:opacity-50 flex items-center gap-2 ${
                    direction === "IN"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  }`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{direction === "IN" ? "Record Receipt" : "Record Payout"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
