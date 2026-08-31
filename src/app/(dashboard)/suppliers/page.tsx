"use client";

import { useState, useEffect } from "react";
import { suppliersService } from "@/services/suppliers.service";
import { paymentsService } from "@/services/payments.service";
import { Supplier, Purchase, Payment, PaymentMethod } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  X,
  Loader2,
  Edit2,
  Eye,
  CreditCard,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
} from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Supplier Details Modal State
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<Payment[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Settle Payment Modal State inside Details
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("CASH");
  const [payRef, setPayRef] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await suppliersService.getSuppliers();
      setSuppliers(data);
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
    setEditingSupplier(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contact_person || "");
    setPhone(s.phone || "");
    setEmail(s.email || "");
    setAddress(s.address || "");
    setIsModalOpen(true);
  };

  const openDetailsModal = async (s: Supplier) => {
    setSelectedSupplier(s);
    setLoadingDetails(true);
    try {
      const details = await suppliersService.getSupplierDetails(s.id);
      setSelectedSupplier(details.supplier);
      setSupplierPurchases(details.purchases);
      setSupplierPayments(details.payments);
    } catch (err) {
      console.error("Failed to load supplier details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (editingSupplier) {
        await suppliersService.updateSupplier(editingSupplier.id, {
          name,
          contact_person: contactPerson || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
        });
      } else {
        await suppliersService.createSupplier({
          name,
          contact_person: contactPerson || undefined,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || payAmount <= 0) return;
    setPaySubmitting(true);

    try {
      await paymentsService.recordPayment({
        direction: "OUT",
        supplier_id: selectedSupplier.id,
        amount: Number(payAmount),
        method: payMethod,
        reference: payRef || undefined,
        notes: `Vendor debt settlement for ${selectedSupplier.name}`,
      });

      setIsPaymentModalOpen(false);
      setPayAmount(0);
      setPayRef("");
      
      // Reload supplier details and table
      await openDetailsModal(selectedSupplier);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to record vendor payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Metrics
  const totalPayables = suppliers.reduce((sum, s) => sum + Number(s.current_balance || 0), 0);

  const columns: Column<Supplier>[] = [
    {
      header: "Distributor / Supplier",
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-100 flex-shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">{s.name}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Contact: <strong>{s.contact_person || "Wholesale Division"}</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      cell: (s) => (
        <span className="font-mono text-slate-700 text-xs font-semibold">
          {s.phone || "—"}
        </span>
      ),
    },
    {
      header: "Email",
      cell: (s) => (
        <span className="text-slate-600 text-xs font-mono">
          {s.email || "—"}
        </span>
      ),
    },
    {
      header: "Outstanding Payable",
      align: "right",
      cell: (s) => {
        const bal = Number(s.current_balance || 0);
        return (
          <span
            className={`font-mono font-black text-xs ${
              bal > 0 ? "text-amber-950" : "text-emerald-800"
            }`}
          >
            Rs. {bal.toFixed(2)}
          </span>
        );
      },
    },
    {
      header: "Actions",
      align: "right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openDetailsModal(s)}
            className="px-2 py-1 text-xs font-bold text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="View Purchased Invoices & Accounts"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={() => openEditModal(s)}
            className="p-1.5 text-slate-500 hover:text-purple-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Edit Supplier"
          >
            <Edit2 className="w-4 h-4" />
          </button>
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
            <Truck className="w-6 h-6 text-amber-700" />
            <span>Supplier Directory &amp; Accounts Payable</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage manufacturer directories, track inward purchased products, review supplier invoices, and settle vendor balances.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-200" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Registered Distributors</span>
          <p className="text-2xl font-black text-amber-950 font-mono">{suppliers.length} vendors</p>
          <span className="text-[10px] text-slate-500">Wholesale supply partners</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Accounts Payable</span>
          <p className="text-2xl font-black text-purple-950 font-mono">
            Rs. {totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-purple-800 font-bold">Unsettled vendor debt balance</span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={suppliers}
        loading={loading}
        searchPlaceholder="Search suppliers by company name or phone..."
        searchFilter={(s, q) =>
          s.name.toLowerCase().includes(q) ||
          Boolean(s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
          Boolean(s.phone && s.phone.toLowerCase().includes(q))
        }
      />

      {/* Create / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-lg p-6 shadow-2xl border border-amber-100 space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-amber-950">
                  {editingSupplier ? "Edit Supplier Details" : "Register New Supplier"}
                </h3>
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
                <label className="font-bold text-slate-700">Company / Distributor Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nestle Pakistan Distribution"
                  className="w-full bg-white border border-slate-200 focus:border-amber-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Contact Person / Representative</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full bg-white border border-slate-200 focus:border-amber-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@supplier.com"
                    className="w-full bg-white border border-slate-200 focus:border-amber-600 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Warehouse / Factory Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Industrial Area, Sheikhupura Road, Lahore"
                  className="w-full bg-white border border-slate-200 focus:border-amber-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
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
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingSupplier ? "Save Changes" : "Register Supplier"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER DETAILS & PURCHASED INVOICES MODAL */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-4xl max-h-[90vh] flex flex-col p-6 shadow-2xl border border-purple-200 bg-white space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black">
                  <Truck className="w-5 h-5 text-purple-800" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-purple-950">{selectedSupplier.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-0.5">
                    <span>Contact: <strong>{selectedSupplier.contact_person || "Wholesale Division"}</strong></span>
                    <span>•</span>
                    <span>Phone: <strong>{selectedSupplier.phone || "N/A"}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setPayAmount(Number(selectedSupplier.current_balance || 0));
                    setIsPaymentModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-800 to-purple-950 hover:from-purple-900 hover:to-black text-amber-300 text-xs font-black rounded-xl shadow-md cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>Record Vendor Payment</span>
                </button>

                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-100 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-purple-900">Total Purchase Orders</span>
                  <p className="text-xl font-black text-purple-950 font-mono">{supplierPurchases.length} invoices</p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-900">Outstanding Vendor Balance</span>
                  <p className="text-xl font-black text-amber-950 font-mono">
                    Rs. {Number(selectedSupplier.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-900">Payments Settled</span>
                  <p className="text-xl font-black text-emerald-950 font-mono">{supplierPayments.length} payouts</p>
                </div>
              </div>

              {/* Purchased Invoices & Item Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-purple-700" />
                  <span>Purchased Orders &amp; Items Received</span>
                </h4>

                {loadingDetails ? (
                  <div className="flex items-center justify-center p-8 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-700" />
                  </div>
                ) : supplierPurchases.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200">
                    No purchase orders recorded for this supplier yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplierPurchases.map((pur) => (
                      <div key={pur.id} className="solvexa-card p-4 border border-slate-200 space-y-3 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-purple-950 text-sm">{pur.invoice_number}</span>
                            <span className="text-xs text-slate-500 font-mono">
                              ({new Date(pur.created_at).toLocaleDateString()})
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-black text-slate-900">
                              Total: Rs. {Number(pur.total || 0).toFixed(2)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pur.payment_status === "PAID"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : pur.payment_status === "PARTIAL"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {pur.payment_status}
                            </span>
                          </div>
                        </div>

                        {/* Items Table */}
                        {pur.items && pur.items.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                                <tr>
                                  <th className="px-3 py-1.5">Product Name</th>
                                  <th className="px-2 py-1.5 text-center">Qty Received</th>
                                  <th className="px-3 py-1.5 text-right">Unit Cost</th>
                                  <th className="px-3 py-1.5 text-right">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {pur.items.map((it: any) => (
                                  <tr key={it.id}>
                                    <td className="px-3 py-1.5 font-semibold text-slate-800">
                                      {it.product?.name || "Product Item"}
                                    </td>
                                    <td className="px-2 py-1.5 text-center font-mono font-bold text-purple-950">
                                      {it.quantity}
                                    </td>
                                    <td className="px-3 py-1.5 text-right font-mono text-slate-600">
                                      Rs. {Number(it.unit_cost || 0).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-1.5 text-right font-mono font-black text-slate-900">
                                      Rs. {Number(it.total || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vendor Payments History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Vendor Payout Settlements History</span>
                </h4>

                {supplierPayments.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200">
                    No vendor payout transactions recorded yet.
                  </div>
                ) : (
                  <div className="solvexa-card overflow-hidden border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-50/60 text-emerald-950 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Payment Method</th>
                          <th className="p-2.5">Reference</th>
                          <th className="p-2.5 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {supplierPayments.map((pmt) => (
                          <tr key={pmt.id}>
                            <td className="p-2.5 font-mono text-slate-500">
                              {new Date(pmt.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-2.5 font-mono font-semibold text-slate-800">
                              {pmt.method}
                            </td>
                            <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                              {pmt.reference || "—"}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-emerald-800">
                              Rs. {Number(pmt.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD VENDOR PAYMENT MODAL */}
      {isPaymentModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border border-purple-200 space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-purple-950">Record Vendor Settlement</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-1">
                <span className="text-[11px] text-purple-900 font-bold block">Supplier: {selectedSupplier.name}</span>
                <span className="text-xs text-slate-600 font-mono block">
                  Current Balance Due: <strong>Rs. {Number(selectedSupplier.current_balance || 0).toFixed(2)}</strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payout Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-emerald-800 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                >
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                  <option value="CARD">CARD</option>
                  <option value="JAZZCASH">JAZZCASH</option>
                  <option value="EASYPAISA">EASYPAISA</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Cheque / Reference #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. CHQ-998811 or Bank Ref"
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-amber-300 font-bold shadow-md shadow-purple-900/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {paySubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Vendor Payout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
