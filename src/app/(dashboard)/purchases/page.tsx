"use client";

import { useState, useEffect } from "react";
import { purchasesService } from "@/services/purchases.service";
import { suppliersService } from "@/services/suppliers.service";
import { productsService } from "@/services/products.service";
import { Purchase, Supplier, Product, PaymentMethod } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { InvoiceLineItems, InvoiceItemRow } from "@/components/shared/invoice-line-items";
import { downloadCSV } from "@/lib/export-csv";
import {
  ShoppingCart,
  Plus,
  Truck,
  RotateCcw,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Boxes,
  FileSpreadsheet,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Layers,
  Check,
  TrendingDown,
  Building,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "UNPAID">("ALL");

  // Create Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [lineItems, setLineItems] = useState<InvoiceItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // View Bill / Details Modal
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purs, sups, prods] = await Promise.all([
        purchasesService.getPurchases(),
        suppliersService.getSuppliers(),
        productsService.getProducts(),
      ]);
      setPurchases(purs);
      setSuppliers(sups);
      setProducts(prods);
      if (sups.length > 0 && !supplierId) {
        setSupplierId(sups[0].id);
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

  const openCreateModal = () => {
    const nextNum = `PUR-${Date.now().toString().slice(-6)}`;
    setInvoiceNumber(nextNum);
    setLineItems([]);
    setPaidAmount(0);
    setPaymentMethod("CASH");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Calculated subtotal for the new purchase modal
  const calculatedTotal = lineItems.reduce((sum, item) => {
    const lineGross = Number(item.quantity || 0) * Number(item.unit_price || 0);
    const lineDiscount = Number(item.discount || 0);
    const lineTax = (lineGross * Number(item.tax_rate || 0)) / 100;
    return sum + (lineGross - lineDiscount + lineTax);
  }, 0);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || lineItems.length === 0) {
      setErrorMsg("Please add at least one product line item to receive stock.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const itemsPayload = lineItems.map((it) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_cost: Number(it.unit_price),
        discount: Number(it.discount || 0),
        tax_rate: Number(it.tax_rate || 0),
      }));

      await purchasesService.createPurchase({
        supplier_id: supplierId,
        invoice_number: invoiceNumber,
        items: itemsPayload,
        paid_amount: Number(paidAmount),
        payment_method: paymentMethod,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create purchase invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Purchase Invoice #",
      "Supplier Name",
      "Contact Person",
      "Date",
      "Subtotal (PKR)",
      "Total Bill (PKR)",
      "Paid Amount (PKR)",
      "Due Balance (PKR)",
      "Payment Status",
    ];

    const rows = filteredPurchases.map((p) => [
      p.invoice_number,
      p.supplier?.name || "Wholesale Vendor",
      (p.supplier as any)?.contact_person || "",
      new Date(p.created_at).toLocaleDateString(),
      Number(p.subtotal || 0).toFixed(2),
      Number(p.total || 0).toFixed(2),
      Number(p.paid_amount || 0).toFixed(2),
      Number(p.due_amount || 0).toFixed(2),
      p.payment_status,
    ]);

    downloadCSV("solvexa_purchasing_report", headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered purchases based on tab
  const filteredPurchases = purchases.filter((p) => {
    if (statusFilter === "ALL") return true;
    return p.payment_status === statusFilter;
  });

  // Metrics
  const totalPurchaseCost = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalPaidToSuppliers = purchases.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
  const totalDueToSuppliers = purchases.reduce((sum, p) => sum + Number(p.due_amount || 0), 0);

  const countPaid = purchases.filter((p) => p.payment_status === "PAID").length;
  const countPartial = purchases.filter((p) => p.payment_status === "PARTIAL").length;
  const countUnpaid = purchases.filter((p) => p.payment_status === "UNPAID").length;

  const columns: Column<Purchase>[] = [
    {
      header: "Purchase Bill #",
      cell: (p) => (
        <div>
          <span className="font-mono font-black text-purple-950 text-xs">{p.invoice_number}</span>
          <span className="text-[10px] text-slate-400 font-mono block">
            {new Date(p.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ),
    },
    {
      header: "Distributor / Supplier",
      cell: (p) => (
        <div>
          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-700" />
            <span>{p.supplier?.name || "Wholesale Supplier"}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {(p.supplier as any)?.phone || "Phone: N/A"}
          </div>
        </div>
      ),
    },
    {
      header: "Order Date",
      cell: (p) => (
        <span className="text-slate-600 font-mono text-xs">
          {new Date(p.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Total Bill (PKR)",
      align: "right",
      cell: (p) => (
        <span className="font-mono font-black text-xs text-slate-900">
          Rs. {Number(p.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Paid Amount",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-emerald-800 font-bold text-xs">
          Rs. {Number(p.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Due Balance",
      align: "right",
      cell: (p) => {
        const due = Number(p.due_amount || 0);
        return due > 0 ? (
          <span className="font-mono font-black text-amber-950 text-xs">
            Rs. {due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" /> Cleared
          </span>
        );
      },
    },
    {
      header: "Payment Status",
      align: "center",
      cell: (p) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            p.payment_status === "PAID"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : p.payment_status === "PARTIAL"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {p.payment_status}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setViewingPurchase(p)}
            className="px-2.5 py-1 text-xs font-bold text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="View Official Purchase Invoice Bill"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Bill</span>
          </button>
          <Link
            href="/purchase-returns"
            className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
            title="Create Purchase Return"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <ProtectedRoute permission="view_purchases">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-700" />
            <span>Purchasing Pipeline &amp; Stock Inward</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Receive inward wholesale inventory batches, track supplier debt balances, print purchasing receipts, and audit stock valuation.
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
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-amber-600 via-orange-500 to-rose-600 shadow-xl shadow-amber-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-100/80">Inward Purchase Volume</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                Rs. {totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <span className="font-black text-sm text-amber-100">PKR</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <Layers className="w-3 h-3 text-amber-200" />
            <span>{purchases.length} inward stock invoices</span>
          </div>
        </div>

        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100/80">Paid to Distributors</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                Rs. {totalPaidToSuppliers.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <span className="font-black text-sm text-emerald-100">PKR</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <CheckCircle2 className="w-3 h-3 text-emerald-200" />
            <span>Settled vendor payments</span>
          </div>
        </div>

        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-rose-600 via-red-500 to-orange-600 shadow-xl shadow-rose-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-100/80">Outstanding Payables</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                Rs. {totalDueToSuppliers.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <span className="font-black text-sm text-rose-100">PKR</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <AlertCircle className="w-3 h-3 text-rose-200" />
            <span>Unsettled vendor debt</span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-purple-900 text-amber-300 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Invoices ({purchases.length})
        </button>
        <button
          onClick={() => setStatusFilter("PAID")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            statusFilter === "PAID"
              ? "bg-emerald-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Paid in Full ({countPaid})
        </button>
        <button
          onClick={() => setStatusFilter("PARTIAL")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            statusFilter === "PARTIAL"
              ? "bg-amber-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Partial Due ({countPartial})
        </button>
        <button
          onClick={() => setStatusFilter("UNPAID")}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
            statusFilter === "UNPAID"
              ? "bg-rose-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Unpaid ({countUnpaid})
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredPurchases}
        loading={loading}
        searchPlaceholder="Search purchases by invoice # or supplier..."
        searchFilter={(p, q) =>
          p.invoice_number.toLowerCase().includes(q) ||
          Boolean(p.supplier?.name && p.supplier.name.toLowerCase().includes(q))
        }
      />

      {/* CREATE PURCHASE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-4xl p-6 shadow-2xl border-2 border-amber-400/40 space-y-5 bg-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950">
                    Create Inward Stock Purchase Order
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Atomic transaction: increases store physical stock quantity and updates supplier payable ledger.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Distributor / Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Debt Balance: Rs. {Number(s.current_balance || 0).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Purchase Order / Bill # *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-amber-700" />
                    <span>Inward Product Batch Items</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {lineItems.length} item(s) selected
                  </span>
                </div>
                <InvoiceLineItems
                  products={products}
                  items={lineItems}
                  onChange={setLineItems}
                  mode="purchase"
                />
              </div>

              {/* Calculated Summary Card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                    Total Inward Invoice Value
                  </span>
                  <span className="text-2xl font-black font-mono text-amber-950">
                    Rs. {calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaidAmount(calculatedTotal)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Pay in Full (Rs. {calculatedTotal.toFixed(0)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmount(0)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Credit (Pay Later)
                  </button>
                </div>
              </div>

              {/* Payment Settlement Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Immediate Paid Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-black text-emerald-800 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CARD">CARD</option>
                    <option value="JAZZCASH">JAZZCASH</option>
                    <option value="EASYPAISA">EASYPAISA</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Remaining Due to Vendor</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-black text-amber-950 text-sm">
                    Rs. {Math.max(0, calculatedTotal - paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || lineItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Record Inward Stock Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL PRINTABLE PURCHASE INVOICE BILL MODAL */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-3xl max-h-[90vh] flex flex-col p-6 shadow-2xl border border-purple-200 bg-white space-y-5">
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-purple-950">
                Official Purchase Receipt / Bill Document
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-900 hover:bg-purple-950 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-300" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setViewingPurchase(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Bill Area */}
            <div id="printable-purchase-bill" className="flex-1 overflow-y-auto space-y-6 pr-1 text-slate-900">
              {/* Store & Supplier Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-amber-400/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-900 p-1 border-2 border-amber-400 flex items-center justify-center flex-shrink-0">
                    <Image src="/logo.png" alt="Solvexa Logo" width={40} height={40} className="object-contain" priority />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-purple-950">Solvexa Grocery Store</h2>
                    <p className="text-[11px] text-slate-500 font-mono">Wholesale Operations &amp; Inward Logistics</p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs space-y-0.5">
                  <div className="font-black text-purple-950 text-sm">{viewingPurchase.invoice_number}</div>
                  <div className="text-slate-500">{new Date(viewingPurchase.created_at).toLocaleDateString()}</div>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingPurchase.payment_status === "PAID"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : viewingPurchase.payment_status === "PARTIAL"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      STATUS: {viewingPurchase.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor Information */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Vendor / Distributor</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingPurchase.supplier?.name || "Wholesale Vendor"}</span>
                  <p className="text-slate-600 font-mono text-[11px] mt-0.5">
                    Contact: {(viewingPurchase.supplier as any)?.contact_person || "Division Rep"}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Vendor Address &amp; Phone</span>
                  <span className="font-mono text-slate-800">{(viewingPurchase.supplier as any)?.phone || "Phone N/A"}</span>
                  <p className="text-slate-500 text-[11px] truncate">
                    {(viewingPurchase.supplier as any)?.address || "Industrial Area"}
                  </p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="solvexa-card overflow-hidden border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-900 text-amber-300 uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-3">Product Description</th>
                      <th className="p-3 text-center">Qty Received</th>
                      <th className="p-3 text-right">Unit Wholesale Cost</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {viewingPurchase.items && viewingPurchase.items.length > 0 ? (
                      viewingPurchase.items.map((it: any) => (
                        <tr key={it.id}>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{it.product?.name || "Product Item"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {it.product?.sku || "N/A"}</span>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-purple-950">
                            {it.quantity} {it.product?.unit?.symbol || "units"}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">
                            Rs. {Number(it.unit_cost || 0).toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            Rs. {Number(it.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          No line items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Summary */}
              <div className="flex flex-col sm:flex-row items-end justify-between gap-4 pt-2">
                <div className="text-xs text-slate-500 space-y-1">
                  <p>• Stock automatically credited to live grocery inventory balance.</p>
                  <p>• Multi-ledger double entry synchronization verified.</p>
                </div>

                <div className="w-full sm:w-72 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold">Rs. {Number(viewingPurchase.subtotal || viewingPurchase.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-base text-purple-950 border-t border-slate-200 pt-1">
                    <span>Total Purchase Bill:</span>
                    <span>Rs. {Number(viewingPurchase.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Paid Amount:</span>
                    <span>Rs. {Number(viewingPurchase.paid_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-950 font-black border-t border-slate-100 pt-1">
                    <span>Outstanding Due:</span>
                    <span>Rs. {Number(viewingPurchase.due_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
