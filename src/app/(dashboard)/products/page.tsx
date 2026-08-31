"use client";

import { useState, useEffect } from "react";
import { productsService } from "@/services/products.service";
import { Product, Category, Unit } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { downloadCSV } from "@/lib/export-csv";
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
  FileSpreadsheet,
  Barcode,
  Layers,
  Check,
  Building,
  Tag,
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockHealthFilter, setStockHealthFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

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
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save product. Please check SKU uniqueness.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Product Name",
      "SKU",
      "Barcode",
      "Brand",
      "Category",
      "Unit",
      "Cost Price (PKR)",
      "Retail Price (PKR)",
      "Gross Margin (%)",
      "Stock on Hand",
      "Min Stock Level",
      "Inventory Value (PKR)",
      "Status",
    ];

    const rows = filteredProducts.map((p) => {
      const qty =
        (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
        p.stock?.quantity_on_hand ??
        0;
      const cost = Number(p.purchase_price ?? p.cost_price ?? 0);
      const sale = Number(p.sale_price ?? 0);
      const margin = sale > 0 ? (((sale - cost) / sale) * 100).toFixed(1) : "0.0";

      return [
        p.name,
        p.sku || "",
        p.barcode || "",
        p.brand || "",
        p.category?.name || "General",
        p.unit?.symbol || "pcs",
        cost.toFixed(2),
        sale.toFixed(2),
        `${margin}%`,
        qty,
        Number(p.minimum_stock ?? p.min_stock_level ?? 5),
        (qty * cost).toFixed(2),
        p.is_active ? "Active" : "Inactive",
      ];
    });

    downloadCSV("solvexa_product_catalog", headers, rows);
  };

  // Filter products based on category and stock health
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;

    const qty =
      (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
      p.stock?.quantity_on_hand ??
      0;
    const min = Number(p.minimum_stock ?? p.min_stock_level ?? 5);

    if (stockHealthFilter === "LOW_STOCK" && (qty > min || qty <= 0)) return false;
    if (stockHealthFilter === "OUT_OF_STOCK" && qty > 0) return false;
    if (stockHealthFilter === "IN_STOCK" && qty <= min) return false;

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

  const totalRetailValuation = products.reduce((sum, p) => {
    const qty =
      (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
      p.stock?.quantity_on_hand ??
      0;
    const retail = Number(p.sale_price ?? 0);
    return sum + qty * retail;
  }, 0);

  const lowStockCount = products.filter((p) => {
    const qty =
      (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
      p.stock?.quantity_on_hand ??
      0;
    const min = Number(p.minimum_stock ?? p.min_stock_level ?? 5);
    return qty > 0 && qty <= min;
  }).length;

  const outOfStockCount = products.filter((p) => {
    const qty =
      (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
      p.stock?.quantity_on_hand ??
      0;
    return qty <= 0;
  }).length;

  const columns: Column<Product>[] = [
    {
      header: "Product & SKU Code",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-900 flex items-center justify-center font-bold flex-shrink-0 border border-purple-200 shadow-xs">
            <Package className="w-5 h-5 text-purple-800" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-xs">{p.name}</div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="bg-purple-50 text-purple-950 font-bold px-1.5 py-0.5 rounded border border-purple-200">
                {p.sku || "NO-SKU"}
              </span>
              {p.barcode && (
                <span className="text-slate-400 font-mono flex items-center gap-0.5">
                  <Barcode className="w-3 h-3" /> {p.barcode}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      cell: (p) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-50 to-amber-50 text-purple-950 border border-purple-200">
          <Tag className="w-3 h-3 text-amber-700" />
          <span>{p.category?.name || "General"}</span>
        </span>
      ),
    },
    {
      header: "Unit",
      cell: (p) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
          {p.unit?.symbol || p.unit?.name || "pcs"}
        </span>
      ),
    },
    {
      header: "Cost Price (PKR)",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-slate-700 font-semibold text-xs">
          Rs. {Number(p.purchase_price ?? p.cost_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Retail Price (PKR)",
      align: "right",
      cell: (p) => (
        <span className="font-mono font-black text-xs text-purple-950">
          Rs. {Number(p.sale_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Profit Margin",
      align: "right",
      cell: (p) => {
        const cost = Number(p.purchase_price ?? p.cost_price ?? 0);
        const sale = Number(p.sale_price ?? 0);
        const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        const isHigh = margin >= 20;

        return (
          <span
            className={`font-mono text-[11px] font-black px-2 py-0.5 rounded-md border ${
              isHigh
                ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                : "text-amber-800 bg-amber-50 border-amber-200"
            }`}
          >
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: "Live Stock Level",
      align: "center",
      cell: (p) => {
        const qty =
          (Array.isArray(p.inventory) ? p.inventory[0]?.quantity : (p.inventory as any)?.quantity) ??
          p.stock?.quantity_on_hand ??
          0;
        const min = Number(p.minimum_stock ?? p.min_stock_level ?? 5);
        const isOut = qty <= 0;
        const isLow = qty > 0 && qty <= min;

        return (
          <div className="inline-flex items-center gap-1.5 font-mono">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                isOut
                  ? "bg-rose-100 text-rose-900 border border-rose-300"
                  : isLow
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}
            >
              {qty} {p.unit?.symbol || "pcs"}
            </span>
            {isOut && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
            {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
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
          className="p-1.5 text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
          title="Edit Product Details"
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
            Manage barcode scanning, wholesale acquisition costs, retail margins, and automated low-stock replenishment levels.
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 via-purple-800 to-amber-700 hover:from-purple-800 hover:to-amber-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Add New Product SKU</span>
          </button>
        </div>
      </div>

      {/* Luxury KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Active SKUs</span>
          <p className="text-2xl font-black text-purple-950 font-mono">{totalSKUs}</p>
          <span className="text-[10px] text-slate-500 font-mono">Total catalog products</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Wholesale Stock Valuation</span>
          <p className="text-2xl font-black text-amber-950 font-mono">
            Rs. {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Wholesale cost basis</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-emerald-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Retail Value Potential</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            Rs. {totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-800 font-bold">Estimated gross revenue</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-rose-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Stock Alerts</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-rose-800 font-mono">{lowStockCount + outOfStockCount}</p>
            <span className="text-[10px] text-rose-700 font-bold">
              ({lowStockCount} low / {outOfStockCount} out)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Requires restocking</span>
        </div>
      </div>

      {/* Filter Tabs: Stock Health */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStockHealthFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              stockHealthFilter === "ALL"
                ? "bg-purple-900 text-amber-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setStockHealthFilter("IN_STOCK")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              stockHealthFilter === "IN_STOCK"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Healthy Stock
          </button>
          <button
            onClick={() => setStockHealthFilter("LOW_STOCK")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              stockHealthFilter === "LOW_STOCK"
                ? "bg-amber-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockHealthFilter("OUT_OF_STOCK")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              stockHealthFilter === "OUT_OF_STOCK"
                ? "bg-rose-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              categoryFilter === "all"
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            All Depts
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === c.id
                  ? "bg-amber-100 text-amber-900 border border-amber-300 font-black"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        searchPlaceholder="Search products by title, SKU code, or barcode scan..."
        searchFilter={(p, q) =>
          p.name.toLowerCase().includes(q) ||
          Boolean(p.sku && p.sku.toLowerCase().includes(q)) ||
          Boolean(p.barcode && p.barcode.toLowerCase().includes(q))
        }
      />

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-2 border-purple-300/50 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-700" />
                <span>{editingProduct ? "Edit Product Details" : "Create Master Product SKU"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Olper's Full Cream Milk 1 Liter"
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SKU Code (Unique ID)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. OLP-1L"
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Barcode (EAN-13 / UPC)</label>
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
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
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
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
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
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-black text-purple-950"
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
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
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
                      className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-black text-emerald-800"
                    />
                  </div>
                )}
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
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black shadow-md shadow-purple-700/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? "Save Changes" : "Create Product SKU"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
