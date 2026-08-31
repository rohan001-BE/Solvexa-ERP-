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
} from "lucide-react";

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

  const catColumns: Column<Category>[] = [
    {
      header: "Department / Category",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-amber-100 text-purple-950 flex items-center justify-center font-black text-xs border border-purple-200 shadow-xs">
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
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs border border-amber-200">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Categories &amp; Aisles</span>
          <p className="text-2xl font-black text-purple-950 font-mono">{categories.length}</p>
          <span className="text-[10px] text-purple-800 font-bold">Active grocery departments</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Measurement Units</span>
          <p className="text-2xl font-black text-amber-950 font-mono">{units.length}</p>
          <span className="text-[10px] text-slate-500 font-mono">Weight / count standards</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-emerald-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Catalog SKUs Classified</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">{products.length}</p>
          <span className="text-[10px] text-emerald-800 font-bold">Items mapped to departments</span>
        </div>
      </div>

      {/* Tabs Switcher */}
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
  );
}
