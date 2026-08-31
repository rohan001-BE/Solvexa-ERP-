"use client";

import { useState, useEffect } from "react";
import { inventoryService } from "@/services/inventory.service";
import { productsService } from "@/services/products.service";
import { Inventory, InventoryMovement, Product, StockMovementDirection } from "@/types/database.types";
import { DataTable, Column } from "@/components/ui/data-table";
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
} from "lucide-react";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "low" | "movements">("all");

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

  const lowStockCount = inventory.filter((i) => {
    const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
    const min = Number(i.product?.minimum_stock ?? i.product?.min_stock_level ?? 5);
    return qty <= min;
  }).length;

  const stockColumns: Column<Inventory>[] = [
    {
      header: "Product / SKU",
      cell: (inv) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-100 flex-shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900">{inv.product?.name || "Product"}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              SKU: <strong className="text-purple-950">{inv.product?.sku || "—"}</strong>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Department",
      cell: (inv) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
          {inv.product?.category?.name || "General"}
        </span>
      ),
    },
    {
      header: "Cost (PKR)",
      align: "right",
      cell: (inv) => (
        <span className="font-mono text-slate-700 font-semibold">
          Rs. {Number(inv.product?.purchase_price ?? inv.product?.cost_price ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Stock on Hand",
      align: "center",
      cell: (inv) => {
        const qty = Number(inv.quantity ?? inv.quantity_on_hand ?? 0);
        const min = Number(inv.product?.minimum_stock ?? inv.product?.min_stock_level ?? 5);
        const isLow = qty <= min;

        return (
          <span
            className={`font-mono font-black px-2.5 py-0.5 rounded-full text-xs ${
              isLow
                ? "bg-rose-50 text-rose-800 border border-rose-200"
                : "bg-emerald-50 text-emerald-900 border border-emerald-200"
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
        <span className="font-mono text-xs font-semibold text-slate-500">
          {inv.product?.minimum_stock ?? inv.product?.min_stock_level ?? 5}
        </span>
      ),
    },
    {
      header: "Total Valuation",
      align: "right",
      cell: (inv) => {
        const qty = Number(inv.quantity ?? inv.quantity_on_hand ?? 0);
        const cost = Number(inv.product?.purchase_price ?? inv.product?.cost_price ?? 0);
        return (
          <span className="font-mono font-black text-slate-900">
            Rs. {(qty * cost).toFixed(2)}
          </span>
        );
      },
    },
    {
      header: "Status",
      align: "center",
      cell: (inv) => {
        const qty = Number(inv.quantity ?? inv.quantity_on_hand ?? 0);
        const min = Number(inv.product?.minimum_stock ?? inv.product?.min_stock_level ?? 5);
        const isLow = qty <= min;

        return isLow ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            <span>Low Stock</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>In Stock</span>
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
      header: "Product",
      cell: (m) => (
        <span className="font-bold text-slate-900">{m.product?.name || "Product"}</span>
      ),
    },
    {
      header: "Movement Type",
      cell: (m) => (
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
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
            className={`font-mono font-bold text-xs inline-flex items-center gap-0.5 ${
              isPositive ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
            <span>{Math.abs(Number(m.quantity))}</span>
          </span>
        );
      },
    },
    {
      header: "Audit Note / Reference",
      cell: (m) => (
        <span className="text-xs text-slate-600 italic">
          {m.note || "System balance update"}
        </span>
      ),
    },
  ];

  const filteredInventory = inventory.filter((i) => {
    if (activeTab === "low") {
      const qty = Number(i.quantity ?? i.quantity_on_hand ?? 0);
      const min = Number(i.product?.minimum_stock ?? i.product?.min_stock_level ?? 5);
      return qty <= min;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-purple-700" />
            <span>Inventory Management &amp; Stock Levels</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit physical stock quantities on hand, adjust store inventory, and review immutable movement audit logs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-300" />
          <span>Manual Stock Adjustment</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="solvexa-card p-4 space-y-1 border-purple-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Stock on Hand</span>
          <p className="text-2xl font-black text-purple-950 font-mono">{totalStockUnits.toLocaleString()} units</p>
          <span className="text-[10px] text-slate-500">Across all grocery SKUs</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-amber-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Inventory Valuation</span>
          <p className="text-2xl font-black text-amber-950 font-mono">
            Rs. {totalStockValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500">Wholesale cost basis</span>
        </div>

        <div className="solvexa-card p-4 space-y-1 border-rose-100 bg-white shadow-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Low Stock Warnings</span>
          <p className="text-2xl font-black text-rose-800 font-mono">{lowStockCount} items</p>
          <span className="text-[10px] text-rose-700 font-bold">Needs inward stock replenishment</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "all"
              ? "bg-purple-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Stock ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab("low")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "low"
              ? "bg-purple-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Low Stock Alerts ({lowStockCount})
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === "movements"
              ? "bg-purple-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Movements Log ({movements.length})
        </button>
      </div>

      {/* Content */}
      {activeTab !== "movements" ? (
        <DataTable
          columns={stockColumns}
          data={filteredInventory}
          loading={loading}
          searchPlaceholder="Search inventory by product name or SKU..."
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
          searchPlaceholder="Search audit movements by product or note..."
          searchFilter={(m, q) =>
            Boolean(m.product?.name && m.product.name.toLowerCase().includes(q)) ||
            Boolean(m.note && m.note.toLowerCase().includes(q))
          }
        />
      )}

      {/* Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-purple-100 space-y-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-purple-950 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-purple-700" />
                <span>Adjust Stock Quantity</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku || "No SKU"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Direction</label>
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
                  <label className="font-bold text-slate-700">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Physical inventory audit discrepancy, damaged packaging"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-purple-600 text-slate-900 rounded-xl px-3.5 py-2.5 outline-none font-medium"
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
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-md shadow-purple-700/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
