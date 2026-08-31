"use client";

import { useState, useEffect } from "react";
import { suppliersService } from "@/services/suppliers.service";
import { Supplier } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Truck, Plus, Phone, Mail, MapPin, X, Loader2, Edit2, CreditCard } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        <span className="text-slate-600 text-xs">
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
              bal > 0 ? "text-amber-950" : "text-slate-600"
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
        <button
          onClick={() => openEditModal(s)}
          className="p-1.5 text-purple-700 hover:text-purple-950 hover:bg-purple-50 rounded-lg transition-colors"
          title="Edit Supplier"
        >
          <Edit2 className="w-4 h-4" />
        </button>
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
            <span>Supplier Directory &amp; Payables</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage manufacturer directories, wholesale vendor accounts, and outstanding accounts payable balances.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-purple-200" />
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
          <span className="text-[10px] text-purple-800 font-bold">Unsettled vendor bills</span>
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
                  placeholder="e.g. Nestle Pakistan Ltd"
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
                <label className="font-bold text-slate-700">Warehouse Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Industrial Area, City"
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
    </div>
  );
}
