"use client";

import { useState, useEffect } from "react";
import { inventoryService } from "@/services/inventory.service";
import { productsService } from "@/services/products.service";
import { Inventory, InventoryMovement, Product, StockMovementDirection } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
import { downloadCSV } from "@/lib/export-csv";
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  CheckCircle2,
  Package,
  FileSpreadsheet,
  Layers,
  Tag,
  DollarSign,
} from "lucide-react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "healthy" | "low" | "out" | "movements">("all");

  // Manual Adjustment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [direction, setDirection] = useState<StockMovementDirection>("IN");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inv, movs, prods] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getMovements(),
        productsService.getProducts(),
      ]);
      setInventory(inv);
      setMovements(movs);
      setProducts(prods);
      if (prods.length > 0 && !productId) {
        setProductId(prods[0].id);
      }
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;
    setSubmitting(true);
    try {
      await inventoryService.adjustInventory({
        product_id: productId,
        quantity: Number(quantity),
        direction,
        note: note || undefined,
      });

      setIsModalOpen(false);
      setQuantity(1);
      setNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to adjust inventory");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === "movements") {
      const headers = ["Timestamp", "Product Name", "Movement Type", "Direction", "Quantity Changed", "Audit Note"];
      const rows = movements.map((m) => [
        new Date(m.created_at).toLocaleString(),
        m.product?.name || "Product",
        m.type || "MOVEMENT",
        m.direction || "",
        m.quantity,
        m.note || "",
      ]);
      downloadCSV("solvexa_stock_movements_audit", headers, rows);
    } else {
      const headers = [
        "Product Name",
        "SKU",
        "Department",
        "Cost Price (PKR)",
        "Stock on Hand",
        "Unit",
        "Min Stock Level",
        "Wholesale Valuation (PKR)",
        "Health Status",
      ];
      const rows = filteredInventory.map((inv) => {
        const qty = Number(inv.quantity ?? inv.quantity_on_hand ?? 0);
        const cost = Number(inv.product?.purchase_price ?? inv.product?.cost_price ?? 0);
        const min = Number(inv.product?.minimum_stock ?? inv.product?.min_stock_level ?? 5);
        const status = qty <= 0 ? "Out of Stock" : qty <= min ? "Low Stock Warning" : "Healthy Stock";

        return [
          inv.product?.name || "Product",
          inv.product?.sku || "",
          inv.product?.category?.name || "General",
          cost.toFixed(2),
          qty,
          inv.product?.unit?.symbol || "pcs",
          min,
          (qty * cost).toFixed(2),
          status,
        ];
      });
      downloadCSV("solvexa_live_inventory_audit", headers, rows);
    }
  };

  // Metrics
  const totalStockUnits = inventory.reduce(
    (sum, i) => sum + Number(i.quantity ?? i.quantity_on_hand ?? 0),
    0
  );

  const totalStockValuation = inventory.reduce((sum, i) => {
    const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
    const cost = Number(i.product?.purchase_price ?? i.product?.cost_price ?? 0);
    return sum + qty * cost;
  }, 0);

  const totalRetailValuation = inventory.reduce((sum, i) => {
    const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
    const retail = Number(i.product?.sale_price ?? 0);
    return sum + qty * retail;
  }, 0);

  const lowStockCount = inventory.filter((i) => {
    const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
    const min = Number(i.product?.minimum_stock ?? i.product?.min_stock_level ?? 5);
    return qty > 0 && qty <= min;
  }).length;

  const outOfStockCount = inventory.filter((i) => {
    const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
    return qty <= 0;
  }).length;

  const healthyStockCount = inventory.filter((i) => {
    const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
    const min = Number(i.product?.minimum_stock ?? i.product?.min_stock_level ?? 5);
    return qty > min;
  }).length;

  const stockColumns: Column<Inventory>[] = [
    {
      header: "Product / Master SKU",
      cell: (inv) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-amber-100 text-purple-950 flex items-center justify-center font-black text-xs border border-purple-200 shadow-xs flex-shrink-0">
            <Boxes className="w-5 h-5 text-purple-800" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-xs">{inv.product?.name || "Product SKU"}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              SKU: <strong className="text-purple-950 font-bold">{inv.product?.sku || "—"}</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      cell: (inv) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
          <Tag className="w-3 h-3 text-purple-700" />
          <span>{inv.product?.category?.name || "General"}</span>
        </span>
      ),
    },
    {
      header: "Unit Cost (PKR)",
      align: "right",
      cell: (inv) => (
        <span className="font-mono text-slate-700 font-semibold text-xs">
          Rs. {Number(inv.product?.purchase_price ?? inv.product?.cost_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Stock on Hand",
      align: "center",
      cell: (inv) => {
        const qty = Number(inv.quantity ?? inv.quantity_on_hand ?? 0);
        const min = Number(inv.product?.minimum_stock ?? inv.product?.min_stock_level ?? 5);
        const isOut = qty <= 0;
        const isLow = qty > 0 && qty <= min;

        return (
          <span
            className={`font-mono font-black px-3 py-1 rounded-full text-xs ${
              isOut
                ? "bg-rose-100 text-rose-900 border border-rose-300 animate-pulse"
                : isLow
                ? "bg-amber-100 text-amber-900 border border-amber-300"
                : "bg-emerald-100 text-emerald-900 border border-emerald-300"
            }`}
          >
            {qty} {inv.product?.unit?.symbol || "pcs"}
          </span>
        );
      },
    },
    {
      header: "Min Alert",
      align: "center",
      cell: (inv) => (
        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {inv.product?.minimum_stock ?? inv.product?.min_stock_level ?? 5}
        </span>
      ),
    },
    {
      header: "Total Stock Value",
      align: "right",
      cell: (inv) => {
        const qty = Number(inv.quantity ?? inv.quantity_on_hand ?? 0);
        const cost = Number(inv.product?.purchase_price ?? inv.product?.cost_price ?? 0);
        return (
          <span className="font-mono font-black text-xs text-purple-950">
            Rs. {(qty * cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      header: "Health Status",
      align: "center",
      cell: (inv) => {
        const qty = Number(inv.quantity ?? inv.quantity_on_hand ?? 0);
        const min = Number(inv.product?.minimum_stock ?? inv.product?.min_stock_level ?? 5);
        const isOut = qty <= 0;
        const isLow = qty > 0 && qty <= min;

        return isOut ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Out of Stock</span>
          </span>
        ) : isLow ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Low Stock</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Healthy</span>
          </span>
        );
      },
    },
  ];

  const movementColumns: Column<InventoryMovement>[] = [
    {
      header: "Timestamp",
      cell: (m) => (
        <span className="font-mono text-xs text-slate-600">
          {new Date(m.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Product SKU",
      cell: (m) => (
        <div>
          <span className="font-extrabold text-slate-900 text-xs block">{m.product?.name || "Product"}</span>
          <span className="text-[10px] text-slate-400 font-mono">SKU: {m.product?.sku || "—"}</span>
        </div>
      ),
    },
    {
      header: "Movement Type",
      cell: (m) => (
        <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-950 px-2.5 py-0.5 rounded-lg border border-purple-200">
          {m.type || "MOVEMENT"}
        </span>
      ),
    },
    {
      header: "Quantity Changed",
      align: "center",
      cell: (m) => {
        const isPositive =
          m.type?.includes("IN") ||
          m.type?.includes("PURCHASE") ||
          m.type?.includes("OPENING") ||
          m.direction === "IN";
        return (
          <span
            className={`font-mono font-black text-xs inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full ${
              isPositive
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
            <span>{isPositive ? "+" : "-"}{Math.abs(Number(m.quantity))}</span>
          </span>
        );
      },
    },
    {
      header: "Audit Note / Reference",
      cell: (m) => (
        <span className="text-xs text-slate-600 italic font-medium">
          {m.note || "System balance update"}
        </span>
      ),
    },
  ];

  const filteredInventory = inventory.filter((i) => {
    const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
    const min = Number(i.product?.minimum_stock ?? i.product?.min_stock_level ?? 5);

    if (activeTab === "healthy") return qty > min;
    if (activeTab === "low") return qty > 0 && qty <= min;
    if (activeTab === "out") return qty <= 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-purple-700" />
            <span>Store Inventory &amp; Live Stock Valuation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit physical shelf quantities on hand, execute manual stock adjustments, and review immutable double-entry movement logs.
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 via-purple-800 to-amber-700 hover:from-purple-800 hover:to-amber-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-300" />
            <span>Manual Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Stock on Hand</span>
          <p className="text-2xl font-black text-purple-950 font-mono">{totalStockUnits.toLocaleString()} units</p>
          <span className="text-[10px] text-slate-500 font-mono">Across all grocery SKUs</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Wholesale Stock Valuation</span>
          <p className="text-2xl font-black text-amber-950 font-mono">
            Rs. {totalStockValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Wholesale cost on shelf</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-emerald-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Retail Realizable Value</span>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            Rs. {totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-800 font-bold">Estimated sales turnover</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-rose-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Stock Alerts</span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-black text-rose-800 font-mono">{lowStockCount + outOfStockCount}</p>
            <span className="text-[10px] text-rose-700 font-bold">
              ({lowStockCount} low / {outOfStockCount} out)
            </span>
          </div>
          <span className="text-[10px] text-rose-800 font-bold">Needs replenishment</span>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-purple-900 text-amber-300 shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All SKUs ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab("healthy")}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "healthy"
              ? "bg-emerald-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Healthy Stock ({healthyStockCount})
        </button>
        <button
          onClick={() => setActiveTab("low")}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "low"
              ? "bg-amber-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Low Stock Alerts ({lowStockCount})
        </button>
        <button
          onClick={() => setActiveTab("out")}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "out"
              ? "bg-rose-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Out of Stock ({outOfStockCount})
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-3.5 py-1.5 font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "movements"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Movement Audit Logs ({movements.length})
        </button>
      </div>

      {/* Content */}
      {activeTab !== "movements" ? (
        <DataTable
          columns={stockColumns}
          data={filteredInventory}
          loading={loading}
          searchPlaceholder="Search inventory by product name or SKU code..."
          searchFilter={(inv, q) =>
            Boolean(inv.product?.name && inv.product.name.toLowerCase().includes(q)) ||
            Boolean(inv.product?.sku && inv.product.sku.toLowerCase().includes(q))
          }
        />
      ) : (
        <DataTable
          columns={movementColumns}
          data={movements}
          loading={loading}
          searchPlaceholder="Search audit movements by product name or note..."
          searchFilter={(m, q) =>
            Boolean(m.product?.name && m.product.name.toLowerCase().includes(q)) ||
            Boolean(m.note && m.note.toLowerCase().includes(q))
          }
        />
      )}

      {/* Manual Stock Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-purple-300/50 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-purple-700" />
                <span>Adjust Stock Quantity</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Product SKU *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (SKU: {p.sku || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Adjustment Type</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as StockMovementDirection)}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-bold"
                  >
                    <option value="IN">ADD Stock (+)</option>
                    <option value="OUT">DEDUCT Stock (-)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Quantity Units *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-black text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Audit Reason / Remarks *</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory audit discrepancy, damaged carton"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                />
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
                  <span>Confirm Stock Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
