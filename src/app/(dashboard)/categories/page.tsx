"use client";

import { useState, useEffect } from "react";
import { productsService } from "@/services/products.service";
import { Category, Unit } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Tags, Plus, Ruler, X, Loader2, Edit2 } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"categories" | "units">("categories");

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Unit Modal State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, unts] = await Promise.all([
        productsService.getCategories(),
        productsService.getUnits(),
      ]);
      setCategories(cats);
      setUnits(unts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSubmitting(true);
    try {
      await productsService.createCategory({
        name: catName,
        description: catDesc || undefined,
      });
      setIsCatModalOpen(false);
      setCatName("");
      setCatDesc("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !unitSymbol.trim()) return;
    setSubmitting(true);
    try {
      await productsService.createUnit({
        name: unitName,
        symbol: unitSymbol,
      });
      setIsUnitModalOpen(false);
      setUnitName("");
      setUnitSymbol("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to add unit");
    } finally {
      setSubmitting(false);
    }
  };

  const catColumns: Column<Category>[] = [
    {
      header: "Category Name",
      cell: (c) => (
        <span className="font-bold text-slate-900">{c.name}</span>
      ),
    },
    {
      header: "Description",
      cell: (c) => (
        <span className="text-slate-600 text-xs">{c.description || "—"}</span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (c) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            c.is_active
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          {c.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const unitColumns: Column<Unit>[] = [
    {
      header: "Unit Name",
      cell: (u) => (
        <span className="font-bold text-slate-900">{u.name}</span>
      ),
    },
    {
      header: "Symbol / Abbreviation",
      cell: (u) => (
        <span className="font-mono font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100">
          {u.symbol}
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
            <Tags className="w-6 h-6 text-purple-700" />
            <span>Product Categories &amp; Measurement Units</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize department taxonomy and metric/weight packaging units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "categories" ? (
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Add Category</span>
            </button>
          ) : (
            <button
              onClick={() => setIsUnitModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all"
            >
              <Plus className="w-4 h-4 text-purple-200" />
              <span>Add Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "categories"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("units")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "units"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Units ({units.length})
        </button>
      </div>

      {activeTab === "categories" ? (
        <DataTable
          columns={catColumns}
          data={categories}
          loading={loading}
          searchPlaceholder="Search categories by name..."
          searchFilter={(c, q) => c.name.toLowerCase().includes(q)}
        />
      ) : (
        <DataTable
          columns={unitColumns}
          data={units}
          loading={loading}
          searchPlaceholder="Search units by name or symbol..."
          searchFilter={(u, q) =>
            u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q)
          }
        />
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border border-purple-100 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Product Category</h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy & Eggs"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Milk, butter, cheeses and yogurts"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
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
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border border-amber-100 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Measurement Unit</h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUnitSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kilogram or Pack"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-amber-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Symbol / Abbreviation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kg or pk"
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-2.5 outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-md shadow-amber-700/25 flex items-center gap-2 transition-all"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Unit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
