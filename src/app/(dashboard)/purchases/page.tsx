"use client";

import { useState, useEffect } from "react";
import { purchasesService } from "@/services/purchases.service";
import { suppliersService } from "@/services/suppliers.service";
import { productsService } from "@/services/products.service";
import { Purchase, Supplier, Product, PaymentMethod } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { InvoiceLineItems, InvoiceItemRow } from "@/components/shared/invoice-line-items";
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
} from "lucide-react";
import Link from "next/link";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Purchase Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [lineItems, setLineItems] = useState<InvoiceItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Metrics
  const totalPurchaseCost = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalPaidToSuppliers = purchases.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
  const totalDueToSuppliers = purchases.reduce((sum, p) => sum + Number(p.due_amount || 0), 0);

  const columns: Column<Purchase>[] = [
    {
      header: "Purchase #",
      cell: (p) => (
        <span className="font-mono font-bold text-amber-950">{p.invoice_number}</span>
      ),
    },
    {
      header: "Supplier",
      cell: (p) => (
        <div className="font-bold text-slate-900">
          {p.supplier?.name || "Supplier"}
        </div>
      ),
    },
    {
      header: "Date",
      cell: (p) => (
        <span className="text-slate-500 font-mono text-[11px]">
          {new Date(p.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Total Cost",
      align: "right",
      cell: (p) => (
        <span className="font-mono font-black text-slate-900">
          Rs. {Number(p.total || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Paid Amount",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-emerald-800 font-bold">
          Rs. {Number(p.paid_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Due Balance",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-amber-950 font-bold">
          Rs. {Number(p.due_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (p) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
        <Link
          href="/purchase-returns"
          className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 p-1.5 rounded-lg hover:bg-amber-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Return</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-700" />
            <span>Purchasing &amp; Stock Inward</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Receive stock batches from distributors, update payable ledgers, and manage inward purchasing invoices.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-purple-200" />
          <span>New Inward Purchase Order</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Inward Purchase Cost</span>
          <p className="text-2xl font-black text-amber-950 font-mono">
            Rs. {totalPurchaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">{purchases.length} stock receipts</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-emerald-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Paid to Distributors</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            Rs. {totalPaidToSuppliers.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-800 font-bold">Settled payments</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Outstanding Payables</span>
          <p className="text-2xl font-black text-purple-950 font-mono">
            Rs. {totalDueToSuppliers.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-purple-800 font-bold">Payable to suppliers</span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={purchases}
        loading={loading}
        searchPlaceholder="Search purchases by invoice # or supplier..."
        searchFilter={(p, q) =>
          p.invoice_number.toLowerCase().includes(q) ||
          Boolean(p.supplier?.name && p.supplier.name.toLowerCase().includes(q))
        }
      />

      {/* Create Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-4xl p-6 shadow-2xl border border-amber-100 space-y-5 bg-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-950">
                    Inward Stock Purchase Order
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Atomic transaction: increases live stock quantity and updates supplier payable ledger.
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

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Distributor / Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Payable: Rs. {Number(s.current_balance || 0).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Purchase Order / Bill #</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px]">
                  Inward Product Batch Items
                </label>
                <InvoiceLineItems
                  products={products}
                  items={lineItems}
                  onChange={setLineItems}
                  mode="purchase"
                />
              </div>

              {/* Payment Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Immediate Paid Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-emerald-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
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
                  disabled={submitting || lineItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Record Inward Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
