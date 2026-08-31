"use client";

import { useState, useEffect } from "react";
import { salesService } from "@/services/sales.service";
import { productsService } from "@/services/products.service";
import { customersService } from "@/services/customers.service";
import { Sale, Product, Customer, PaymentMethod } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { InvoiceLineItems, InvoiceItemRow } from "@/components/shared/invoice-line-items";
import {
  FileSpreadsheet,
  Plus,
  Printer,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  CreditCard,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // New Sale Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [lineItems, setLineItems] = useState<InvoiceItemRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Printable Invoice Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, prods, custs] = await Promise.all([
        salesService.getSales(),
        productsService.getProducts(),
        customersService.getCustomers(),
      ]);
      setSales(salesData);
      setProducts(prods);
      setCustomers(custs);
      if (custs.length > 0 && !customerId) {
        const walkIn = custs.find((c) => c.name.toLowerCase().includes("walk-in")) || custs[0];
        setCustomerId(walkIn.id);
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
    const nextNum = `INV-${Date.now().toString().slice(-6)}`;
    setInvoiceNumber(nextNum);
    setLineItems([]);
    setPaidAmount(0);
    setPaymentMethod("CASH");
    setErrorMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || lineItems.length === 0) {
      setErrorMsg("Please add at least one product line item to create the sale invoice.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const itemsPayload = lineItems.map((it) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        discount: Number(it.discount || 0),
        tax_rate: Number(it.tax_rate || 0),
      }));

      await salesService.createSale({
        customer_id: customerId,
        invoice_number: invoiceNumber,
        items: itemsPayload,
        paid_amount: Number(paidAmount || 0),
        payment_method: paymentMethod,
      });

      setIsCreateModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create sales invoice. Please check stock availability.");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalPaidRevenue = sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
  const totalDueReceivables = sales.reduce((sum, s) => sum + Number(s.due_amount || 0), 0);

  const columns: Column<Sale>[] = [
    {
      header: "Invoice #",
      cell: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-purple-950">{s.invoice_number}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (s) => (
        <div className="font-semibold text-slate-900">
          {s.customer?.name || "Walk-in Customer"}
        </div>
      ),
    },
    {
      header: "Invoice Date",
      cell: (s) => (
        <span className="text-slate-500 font-mono text-[11px]">
          {new Date(s.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Grand Total",
      align: "right",
      cell: (s) => (
        <span className="font-mono font-black text-slate-900">
          Rs. {Number(s.total || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Paid Amount",
      align: "right",
      cell: (s) => (
        <span className="font-mono text-emerald-800 font-bold">
          Rs. {Number(s.paid_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Due Balance",
      align: "right",
      cell: (s) => (
        <span className="font-mono text-rose-800 font-bold">
          Rs. {Number(s.due_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Payment",
      align: "center",
      cell: (s) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            s.payment_status === "PAID"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : s.payment_status === "PARTIAL"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {s.payment_status}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedSale(s)}
            className="p-1.5 text-purple-700 hover:text-purple-950 hover:bg-purple-50 rounded-lg transition-colors"
            title="View / Print Invoice"
          >
            <Printer className="w-4 h-4" />
          </button>
          <Link
            href="/sales-returns"
            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
            title="Process Return"
          >
            <RotateCcw className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-purple-700" />
            <span>Customer Sales &amp; Invoicing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create multi-item customer invoices, track accounts receivable dues, and print thermal receipt bills.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>New Sales Invoice</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Gross Invoiced Sales</span>
          <p className="text-2xl font-black text-purple-950 font-mono">
            Rs. {totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">{sales.length} customer invoices</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-emerald-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Collected Cash &amp; Digital</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            Rs. {totalPaidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-800 font-bold">Settled funds</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-rose-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Outstanding Receivables</span>
          <p className="text-2xl font-black text-rose-800 font-mono">
            Rs. {totalDueReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-rose-700 font-bold">Customer account dues</span>
        </div>
      </div>

      {/* Sales Invoices DataTable */}
      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        searchPlaceholder="Search sales by invoice # or customer..."
        searchFilter={(s, q) =>
          s.invoice_number.toLowerCase().includes(q) ||
          Boolean(s.customer?.name && s.customer.name.toLowerCase().includes(q))
        }
      />

      {/* Create Sales Invoice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-4xl p-6 shadow-2xl border border-purple-100 space-y-5 bg-white max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-purple-950">
                    Create Customer Sales Invoice
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Atomic transaction: deducts live inventory and adjusts customer receivable ledger.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
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

            <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Customer Account *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Due: Rs. {Number(c.current_balance || 0).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Multi Line Items Widget */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-extrabold text-purple-950 uppercase tracking-wider text-[11px]">
                  Invoice Line Items
                </label>
                <InvoiceLineItems
                  products={products}
                  items={lineItems}
                  onChange={setLineItems}
                  mode="sale"
                />
              </div>

              {/* Payment Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Paid Amount (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-emerald-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    <option value="CASH">CASH (Counter Cash)</option>
                    <option value="CARD">CARD (Credit/Debit POS)</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="JAZZCASH">JAZZCASH</option>
                    <option value="EASYPAISA">EASYPAISA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || lineItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Generate Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="font-extrabold text-purple-950 text-sm">Official Sales Receipt</span>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs space-y-3">
              <div className="text-center border-b border-slate-300 pb-2">
                <p className="font-black text-sm text-purple-950">SOLVEXA GROCERY STORE</p>
                <p className="text-[10px] text-slate-500">Back-Office Invoice Receipt</p>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Invoice: <strong>{selectedSale.invoice_number}</strong></span>
                <span>{new Date(selectedSale.created_at).toLocaleDateString()}</span>
              </div>

              <div className="text-[11px]">
                <span>Customer: <strong>{selectedSale.customer?.name || "Walk-in Customer"}</strong></span>
              </div>

              <div className="border-t border-b border-slate-300 py-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Grand Total:</span>
                  <span className="font-bold">Rs. {Number(selectedSale.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Paid Amount:</span>
                  <span className="font-bold">Rs. {Number(selectedSale.paid_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-800">
                  <span>Remaining Due:</span>
                  <span className="font-bold">Rs. {Number(selectedSale.due_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500">
                Thank you for shopping at Solvexa Store!
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
