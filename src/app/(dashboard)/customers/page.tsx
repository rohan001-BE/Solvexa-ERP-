"use client";

import { useState, useEffect } from "react";
import { customersService } from "@/services/customers.service";
import { Customer } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Users, Plus, Phone, Mail, MapPin, X, Loader2, Edit2, ShieldAlert, CreditCard } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await customersService.getCustomers();
      setCustomers(data);
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
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCreditLimit(0);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setAddress(c.address || "");
    setCreditLimit(Number(c.credit_limit || 0));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (editingCustomer) {
        await customersService.updateCustomer(editingCustomer.id, {
          name,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          credit_limit: Number(creditLimit),
        });
      } else {
        await customersService.createCustomer({
          name,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          credit_limit: Number(creditLimit),
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalReceivables = customers.reduce((sum, c) => sum + Number(c.current_balance || 0), 0);
  const totalCreditLimit = customers.reduce((sum, c) => sum + Number(c.credit_limit || 0), 0);

  const columns: Column<Customer>[] = [
    {
      header: "Customer Account",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-100 flex-shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">{c.name}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Credit Limit: <strong>Rs. {Number(c.credit_limit || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      cell: (c) => (
        <span className="font-mono text-slate-700 text-xs font-medium">
          {c.phone || "—"}
        </span>
      ),
    },
    {
      header: "Email",
      cell: (c) => (
        <span className="text-slate-600 text-xs">
          {c.email || "—"}
        </span>
      ),
    },
    {
      header: "Receivable Balance",
      align: "right",
      cell: (c) => {
        const bal = Number(c.current_balance || 0);
        return (
          <span
            className={`font-mono font-black text-xs ${
              bal > 0 ? "text-rose-800" : "text-emerald-800"
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
      cell: (c) => (
        <button
          onClick={() => openEditModal(c)}
          className="p-1.5 text-purple-700 hover:text-purple-950 hover:bg-purple-50 rounded-lg transition-colors"
          title="Edit Customer"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <ProtectedRoute permission="view_customers">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-700" />
            <span>Customer Accounts &amp; Receivables</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer profiles, credit limit thresholds, and outstanding receivable balances.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-emerald-200" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100/80">Customers</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">{customers.length}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Users className="w-5 h-5 text-emerald-100" />
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <ShieldAlert className="w-3 h-3 text-emerald-200" />
            <span>Active retail & wholesale</span>
          </div>
        </div>

        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-rose-600 via-red-500 to-orange-600 shadow-xl shadow-rose-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-100/80">Receivables</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                Rs. {totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <span className="font-black text-sm text-rose-100">PKR</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-rose-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <CreditCard className="w-3 h-3 text-rose-200" />
            <span>Unsettled invoices</span>
          </div>
        </div>

        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 shadow-xl shadow-purple-900/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-200/80">Credit Exposure</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">
                Rs. {totalCreditLimit.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
               <span className="font-black text-sm text-purple-100">PKR</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-purple-200/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <ShieldAlert className="w-3 h-3 text-purple-300" />
            <span>Total allowed credit limits</span>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customers by name, phone, or email..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          Boolean(c.phone && c.phone.toLowerCase().includes(q)) ||
          Boolean(c.email && c.email.toLowerCase().includes(q))
        }
      />

      {/* Create / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-lg p-6 shadow-2xl border border-emerald-100 space-y-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-emerald-950">
                  {editingCustomer ? "Edit Customer Profile" : "Register Customer Account"}
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
                <label className="font-bold text-slate-700">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asim Khan"
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
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
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@gmail.com"
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Credit Limit (PKR)</label>
                <input
                  type="number"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Sector / City"
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 outline-none font-medium"
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCustomer ? "Save Changes" : "Create Customer"}</span>
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
