"use client";

import { useState, useEffect } from "react";
import { productsService } from "@/services/products.service";
import { Product, Category, Unit } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  CheckCircle2,
  Sparkles,
  DollarSign,
  TrendingUp,
  Boxes,
  Percent,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats, unts] = await Promise.all([
        productsService.getProducts(),
        productsService.getCategories(),
        productsService.getUnits(),
      ]);
      setProducts(prods);
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

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setSku("");
    setBarcode("");
    setBrand("");
    setCategoryId(categories[0]?.id || "");
    setUnitId(units[0]?.id || "");
    setPurchasePrice(0);
    setSalePrice(0);
    setMinStock(5);
    setInitialStock(0);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku || "");
    setBarcode(p.barcode || "");
    setBrand(p.brand || "");
    setCategoryId(p.category_id || "");
    setUnitId(p.unit_id || "");
    setPurchasePrice(Number(p.purchase_price ?? p.cost_price ?? 0));
    setSalePrice(Number(p.sale_price ?? 0));
    setMinStock(Number(p.minimum_stock ?? p.min_stock_level ?? 5));
    setIsActive(p.is_active);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, {
          name,
          sku,
          barcode,
          brand,
          category_id: categoryId || null,
          unit_id: unitId || null,
          purchase_price: purchasePrice,
          sale_price: salePrice,
          minimum_stock: minStock,
          is_active: isActive,
        });
      } else {
        await productsService.createProduct(
          {
            name,
            sku,
            barcode,
            brand,
            category_id: categoryId || null,
            unit_id: unitId || null,
            purchase_price: purchasePrice,
            sale_price: salePrice,
            minimum_stock: minStock,
            is_active: isActive,
          },
          initialStock
        );
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save product. Please check SKU uniqueness.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
    return true;
  });

  // Calculate Metrics
  const totalSKUs = products.length;
  const totalInventoryValue = products.reduce((sum, p) => {
    const qty =
      (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
      p.stock?.quantity_on_hand ??
      0;
    const cost = Number(p.purchase_price ?? p.cost_price ?? 0);
    return sum + qty * cost;
  }, 0);

  const columns: Column<Product>[] = [
    {
      header: "Product & SKU",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold flex-shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">{p.name}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              SKU: <strong className="text-purple-950">{p.sku || "—"}</strong> {p.barcode ? `| Barcode: ${p.barcode}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      cell: (p) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
          {p.category?.name || "General"}
        </span>
      ),
    },
    {
      header: "Unit",
      cell: (p) => (
        <span className="font-mono text-xs font-bold text-slate-700">
          {p.unit?.symbol || p.unit?.name || "pcs"}
        </span>
      ),
    },
    {
      header: "Cost (PKR)",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-slate-700 font-semibold">
          Rs. {Number(p.purchase_price ?? p.cost_price ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Retail (PKR)",
      align: "right",
      cell: (p) => (
        <span className="font-mono font-black text-purple-950">
          Rs. {Number(p.sale_price ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Gross Margin",
      align: "right",
      cell: (p) => {
        const cost = Number(p.purchase_price ?? p.cost_price ?? 0);
        const sale = Number(p.sale_price ?? 0);
        const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        return (
          <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: "Stock Level",
      align: "center",
      cell: (p) => {
        const qty =
          (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
          p.stock?.quantity_on_hand ??
          0;
        const min = Number(p.minimum_stock ?? p.min_stock_level ?? 5);
        const isLow = qty <= min;

        return (
          <div className="inline-flex items-center gap-1.5 font-mono">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                isLow
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200"
              }`}
            >
              {qty} {p.unit?.symbol || "pcs"}
            </span>
            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
          </div>
        );
      },
    },
    {
      header: "Actions",
      align: "right",
      cell: (p) => (
        <button
          onClick={() => openEditModal(p)}
          className="p-1.5 text-purple-700 hover:text-purple-950 hover:bg-purple-50 rounded-lg transition-colors"
          title="Edit Product"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-700" />
            <span>Product Catalog &amp; Master SKUs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage barcodes, wholesale purchase costs, retail margins, and minimum stock alert thresholds.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Catalog KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Active SKUs</span>
          <p className="text-2xl font-black text-purple-950 font-mono">{totalSKUs}</p>
          <span className="text-[10px] text-slate-500">Master grocery catalog items</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Stock Valuation</span>
          <p className="text-2xl font-black text-amber-950 font-mono">
            Rs. {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Wholesale cost on hand</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-emerald-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Departments Active</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">{categories.length}</p>
          <span className="text-[10px] text-slate-500">Category taxonomy</span>
        </div>
      </div>

      {/* Department Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
            categoryFilter === "all"
              ? "bg-purple-700 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Departments ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              categoryFilter === c.id
                ? "bg-purple-700 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        searchPlaceholder="Search products by title, SKU, or barcode..."
        searchFilter={(p, q) =>
          p.name.toLowerCase().includes(q) ||
          Boolean(p.sku && p.sku.toLowerCase().includes(q)) ||
          Boolean(p.barcode && p.barcode.toLowerCase().includes(q))
        }
      />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-purple-100 space-y-6 my-8 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-700" />
                <span>{editingProduct ? "Edit Product Details" : "Create Master Product SKU"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Olper's Full Cream Milk 1 Liter"
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SKU Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. OLP-1L"
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Barcode</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 896101234001"
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category / Department</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Measurement Unit</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Purchase / Cost Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Retail Sale Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-purple-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Min Stock Warning Level</label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono"
                  />
                </div>
                {!editingProduct && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Initial Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold text-emerald-800"
                    />
                  </div>
                )}
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
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
