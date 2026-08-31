"use client";

import { useState, useEffect } from "react";
import { productsService } from "@/services/products.service";
import { Category, Unit, Product } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { downloadCSV } from "@/lib/export-csv";
import {
  Tags,
  Plus,
  Ruler,
  X,
  Loader2,
  Edit2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
  Package,
  Building,
  Tag,
  BarChart3,
  PieChart,
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const [cats, unts, prods] = await Promise.all([
        productsService.getCategories(),
        productsService.getUnits(),
        productsService.getProducts(),
      ]);
      setCategories(cats);
      setUnits(unts);
      setProducts(prods);
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

  const handleExportCSV = () => {
    if (activeTab === "categories") {
      const headers = ["Category Name", "Description", "Products Count", "Status"];
      const rows = categories.map((c) => {
        const prodCount = products.filter((p) => p.category_id === c.id).length;
        return [c.name, c.description || "", prodCount, c.is_active ? "Active" : "Inactive"];
      });
      downloadCSV("solvexa_categories", headers, rows);
    } else {
      const headers = ["Unit Name", "Symbol / Abbreviation", "Products Count"];
      const rows = units.map((u) => {
        const prodCount = products.filter((p) => p.unit_id === u.id).length;
        return [u.name, u.symbol, prodCount];
      });
      downloadCSV("solvexa_measurement_units", headers, rows);
    }
  };

  const maxProductsInCat = Math.max(...categories.map((c) => products.filter((p) => p.category_id === c.id).length), 1);

  const catColumns: Column<Category>[] = [
    {
      header: "Department / Category",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-amber-100 text-purple-950 flex items-center justify-center font-black text-xs border border-purple-200 shadow-xs">
            <Tag className="w-4 h-4 text-purple-800" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-xs block">{c.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              ID: {c.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Department Description",
      cell: (c) => (
        <span className="text-slate-600 text-xs font-medium">{c.description || "General grocery department catalog"}</span>
      ),
    },
    {
      header: "Products Covered",
      align: "center",
      cell: (c) => {
        const count = products.filter((p) => p.category_id === c.id).length;
        return (
          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-purple-50 text-purple-950 px-2.5 py-0.5 rounded-full border border-purple-200">
            <Package className="w-3 h-3 text-purple-700" />
            <span>{count} SKUs</span>
          </span>
        );
      },
    },
    {
      header: "Status",
      align: "center",
      cell: (c) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
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
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs border border-amber-200 shadow-xs">
            <Ruler className="w-4 h-4 text-amber-800" />
          </div>
          <span className="font-extrabold text-slate-900 text-xs">{u.name}</span>
        </div>
      ),
    },
    {
      header: "Symbol / Abbreviation",
      cell: (u) => (
        <span className="font-mono font-black text-xs text-purple-950 bg-gradient-to-r from-purple-50 to-amber-50 px-3 py-1 rounded-lg border border-purple-200">
          {u.symbol}
        </span>
      ),
    },
    {
      header: "Products Configured",
      align: "center",
      cell: (u) => {
        const count = products.filter((p) => p.unit_id === u.id).length;
        return (
          <span className="font-mono text-xs font-bold text-slate-700">
            {count} products
          </span>
        );
      },
    },
  ];

  return (
    <ProtectedRoute permission="view_categories">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <Tags className="w-6 h-6 text-purple-700" />
            <span>Product Taxonomy &amp; Measurement Units</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage grocery aisles, departments, categories, and metric/weight packaging units.
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

          {activeTab === "categories" ? (
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 via-purple-800 to-amber-700 hover:from-purple-800 hover:to-amber-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Add Department Category</span>
            </button>
          ) : (
            <button
              onClick={() => setIsUnitModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-200" />
              <span>Add Measurement Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 shadow-xl shadow-purple-900/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-200/80">Departments</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">{categories.length}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Tags className="w-5 h-5 text-purple-200" />
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-purple-200/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <Sparkles className="w-3 h-3 text-purple-300" />
            <span>Active grocery aisles</span>
          </div>
        </div>

        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-amber-600 via-orange-500 to-rose-500 shadow-xl shadow-amber-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-100/80">Measurements</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">{units.length}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Ruler className="w-5 h-5 text-amber-100" />
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <CheckCircle2 className="w-3 h-3 text-amber-200" />
            <span>Standardized units</span>
          </div>
        </div>

        <div className="solvexa-card p-5 border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 shadow-xl shadow-emerald-600/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-100/80">Total SKUs</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">{products.length}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Package className="w-5 h-5 text-emerald-100" />
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-100/70 bg-black/20 w-max px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
            <Layers className="w-3 h-3 text-emerald-200" />
            <span>Classified items</span>
          </div>
        </div>
      </div>

      {/* Department Coverage Visual Distribution Card */}
      <div className="solvexa-card p-5 border border-purple-100 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-700" />
            <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider">
              Department Coverage &amp; Product Share
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            Total {products.length} Products Assigned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            const pct = products.length > 0 ? ((count / products.length) * 100).toFixed(0) : "0";
            return (
              <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs truncate">{c.name}</span>
                  <span className="font-mono font-black text-purple-950 text-xs">{count} SKUs</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(10, (count / maxProductsInCat) * 100)}%` }}
                    className="h-full bg-gradient-to-r from-purple-700 to-amber-600 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Share: {pct}% of catalog</span>
                  <span className="text-emerald-700 font-bold">{c.is_active ? "Active" : "Inactive"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Switcher with Divider */}
      <div className="space-y-3">
        <div className="border-t-2 border-purple-200/60 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-black uppercase tracking-wider text-purple-950">
              Taxonomy Tables
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-purple-900 text-amber-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Department Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`px-4 py-2 font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "units"
                ? "bg-amber-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Measurement Units ({units.length})
          </button>
        </div>
      </div>

      {activeTab === "categories" ? (
        <DataTable
          columns={catColumns}
          data={categories}
          loading={loading}
          searchPlaceholder="Search categories by department name..."
          searchFilter={(c, q) => c.name.toLowerCase().includes(q)}
        />
      ) : (
        <DataTable
          columns={unitColumns}
          data={units}
          loading={loading}
          searchPlaceholder="Search measurement units by name or symbol..."
          searchFilter={(u, q) =>
            u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q)
          }
        />
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border-2 border-purple-300/50 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-purple-950">Add Department Category</h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department / Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy & Eggs, Beverages, Fresh Produce"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Milk, butter, cheeses and yogurts"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-black text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-700/25 flex items-center gap-2 transition-all cursor-pointer"
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
          <div className="solvexa-card w-full max-w-md p-6 shadow-2xl border-2 border-amber-300/50 space-y-4 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-amber-950">Add Measurement Unit</h3>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
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
                  placeholder="e.g. Kilogram, Pack, Liter, Piece"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Symbol / Abbreviation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. kg, pk, ltr, pcs"
                  value={unitSymbol}
                  onChange={(e) => setUnitSymbol(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none focus:border-amber-600 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-black text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-md shadow-amber-700/25 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Measurement Unit</span>
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
