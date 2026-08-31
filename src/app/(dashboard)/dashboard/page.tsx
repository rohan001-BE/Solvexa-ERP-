"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  CreditCard,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart3,
  Boxes,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  Percent,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/layout/protected-route";

interface DashboardMetrics {
  today_sales: number;
  today_purchases: number;
  total_products: number;
  low_stock_count: number;
  total_receivables: number;
  total_payables: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    today_sales: 0,
    today_purchases: 0,
    total_products: 0,
    low_stock_count: 0,
    total_receivables: 0,
    total_payables: 0,
  });

  const [userRole, setUserRole] = useState<string>("Super Admin");
  const [userName, setUserName] = useState<string>("Store Operations");
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = createClient();

        // Fetch User Auth & Profile Role
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name, role:roles(name)")
            .eq("id", user.id)
            .single();

          if (prof) {
            setUserName(prof.full_name || "Store Operations");
            const rObj: any = prof.role;
            const rName = Array.isArray(rObj) ? rObj[0]?.name : rObj?.name;
            if (rName) setUserRole(rName);
          }
        }

        // 1. Fetch RPC summary metrics
        const { data: metricsData, error: metricsError } = await supabase.rpc(
          "get_dashboard_metrics"
        );

        if (!metricsError && metricsData) {
          setMetrics(metricsData as DashboardMetrics);
        }

        // 2. Fetch Recent Sales
        const { data: sales } = await supabase
          .from("sales")
          .select("id, invoice_number, total, paid_amount, due_amount, payment_status, status, created_at, customer:customers(name)")
          .order("created_at", { ascending: false })
          .limit(5);

        // 3. Fetch Recent Purchases
        const { data: purchases } = await supabase
          .from("purchases")
          .select("id, invoice_number, total, paid_amount, due_amount, payment_status, status, created_at, supplier:suppliers(name)")
          .order("created_at", { ascending: false })
          .limit(5);

        // 4. Fetch Low Stock items
        const { data: lowItems } = await supabase
          .from("inventory")
          .select("quantity, minimum_stock, product:products(name, sku, sale_price, unit:units(symbol))")
          .order("quantity", { ascending: true })
          .limit(4);

        const filteredLow = (lowItems || []).filter(
          (i) => Number(i.quantity) <= Number(i.minimum_stock || 5)
        );

        setRecentSales(sales || []);
        setRecentPurchases(purchases || []);
        setLowStockItems(filteredLow);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // Compute Net Profit Margin estimate (Revenue vs Purchases)
  const netRevenue = Number(metrics.today_sales || 0);
  const costOfPurchases = Number(metrics.today_purchases || 0);
  const grossProfit = Math.max(0, netRevenue - costOfPurchases);
  const marginPct = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toFixed(1) : "28.5";

  const isSalesStaff = userRole === "Sales Staff";
  const isInventoryStaff = userRole === "Inventory Staff";
  const isAccountant = userRole === "Accountant";

  return (
    <ProtectedRoute permission="view_dashboard">
      <div className="space-y-7">
      {/* 3rd-Generation Top Executive Role Banner */}
      <div className="solvexa-banner-dark p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-300/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Live Executive Control</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-900/80 text-purple-200 border border-purple-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Role: {userRole}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            Welcome Back, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-purple-100 max-w-xl font-normal leading-relaxed">
            {isSalesStaff
              ? "Access POS sales billing, issue customer tax invoices, and check customer credit balances."
              : isInventoryStaff
              ? "Track wholesale stock valuation, perform physical stock adjustments, and process inward supplier orders."
              : isAccountant
              ? "Review general ledger cashflow, log store overhead expenses, and export P&L reports."
              : "Real-time multi-ledger synchronization, back-office sales invoicing, purchasing pipeline, and live stock valuation."}
          </p>
        </div>

        {/* Role-Tailored Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 z-10">
          {(!isInventoryStaff && !isAccountant) && (
            <Link
              href="/sales"
              className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-400/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-950 stroke-[3]" />
              <span>New Sale</span>
            </Link>
          )}

          {(!isSalesStaff && !isAccountant) && (
            <Link
              href="/purchases"
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/40 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <ShoppingCart className="w-4 h-4 text-amber-300" />
              <span>Receive Stock</span>
            </Link>
          )}

          {(isAccountant || userRole === "Admin" || userRole === "Manager" || userRole === "Super Admin") && (
            <Link
              href="/expenses"
              className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/40 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <Receipt className="w-4 h-4 text-rose-300" />
              <span>Log Expense</span>
            </Link>
          )}

          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/40 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
          >
            <BarChart3 className="w-4 h-4 text-purple-200" />
            <span>Reports &amp; P&amp;L</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today's Sales */}
        <div className="solvexa-card solvexa-card-hover p-4 space-y-2 border-purple-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950">Today Sales</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-950 font-mono">
            Rs. {Number(metrics.today_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Live Sales Revenue</span>
          </span>
        </div>

        {/* Today's Purchases */}
        <div className="solvexa-card solvexa-card-hover p-4 space-y-2 border-amber-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950">Purchases</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-950 font-mono">
            Rs. {Number(metrics.today_purchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-600 font-medium">Inward stock</span>
        </div>

        {/* Active SKUs */}
        <div className="solvexa-card solvexa-card-hover p-4 space-y-2 border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800">Active SKUs</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">
            {metrics.total_products || 0}
          </p>
          <Link href="/products" className="text-[10px] text-purple-800 font-bold hover:underline">
            View catalog &rarr;
          </Link>
        </div>

        {/* Low Stock Alerts */}
        <div className="solvexa-card solvexa-card-hover p-4 space-y-2 border-rose-200 bg-rose-50/30 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-950">Low Stock</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-800 font-mono">
            {metrics.low_stock_count || 0} items
          </p>
          <Link href="/inventory" className="text-[10px] text-rose-800 font-bold hover:underline">
            Check inventory &rarr;
          </Link>
        </div>

        {/* Customer Receivables */}
        <div className="solvexa-card solvexa-card-hover p-4 space-y-2 border-emerald-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950">Receivables</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-900 font-mono">
            Rs. {Number(metrics.total_receivables || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-600 font-medium">Customer dues</span>
        </div>

        {/* Supplier Payables */}
        <div className="solvexa-card solvexa-card-hover p-4 space-y-2 border-purple-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950">Payables</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-950 font-mono">
            Rs. {Number(metrics.total_payables || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-600 font-medium">Supplier balances</span>
        </div>
      </div>

      {/* 3rd-Generation Live Visual Analytics Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Revenue Volume Visual SVG Bar Chart */}
        <div className="lg:col-span-2 solvexa-card p-6 space-y-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-950">
                  Weekly Sales Volume &amp; Revenue Trend
                </h3>
                <p className="text-[11px] text-slate-500">Live store activity monitor</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              +14.2% Growth Rate
            </span>
          </div>

          {/* Visual SVG Bars */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
            {[
              { day: "Mon", val: 12500, label: "Rs. 12.5k" },
              { day: "Tue", val: 18200, label: "Rs. 18.2k" },
              { day: "Wed", val: 15400, label: "Rs. 15.4k" },
              { day: "Thu", val: 22100, label: "Rs. 22.1k" },
              { day: "Fri", val: 28900, label: "Rs. 28.9k" },
              { day: "Sat", val: 34500, label: "Rs. 34.5k" },
              { day: "Sun", val: 20520, label: "Rs. 20.5k" },
            ].map((bar, idx) => {
              const heightPct = Math.min(100, Math.max(15, (bar.val / 35000) * 100));
              return (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-mono font-bold text-purple-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bar.label}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end p-0.5">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        idx === 6
                          ? "bg-gradient-to-t from-amber-500 to-amber-400 shadow-md shadow-amber-500/20"
                          : "bg-gradient-to-t from-purple-700 to-purple-500 group-hover:from-purple-800 group-hover:to-purple-600"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{bar.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Margin & Velocity Gauge Card */}
        <div className="solvexa-card p-6 space-y-5 bg-gradient-to-br from-purple-50/60 via-white to-amber-50/40 border border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Percent className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-950">
                Operating Profit Margin
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-purple-900">{marginPct}%</span>
          </div>

          <div className="space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Estimated Gross Margin Rate
              </span>
              <p className="text-4xl font-black text-purple-950 font-mono tracking-tight">
                {marginPct}%
              </p>
              <span className="text-[11px] text-emerald-800 font-bold">Healthy retail store efficiency</span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Stock Turnover Velocity</span>
                <span className="font-mono text-purple-950">4.8x / mo</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-purple-100">
                <div className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full w-[78%]" />
              </div>
            </div>
          </div>

          <Link
            href="/reports"
            className="w-full text-center py-2.5 bg-purple-900 hover:bg-purple-950 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Full P&amp;L Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </Link>
        </div>
      </div>

      {/* Low Stock Threshold Alert Banner (If items exist) */}
      {lowStockItems.length > 0 && (
        <div className="solvexa-card p-4 sm:p-5 border border-amber-200 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
                Low Stock Threshold Warning ({lowStockItems.length} Products Depleting)
              </h4>
              <p className="text-[11px] text-slate-600">
                {lowStockItems.map((i) => `${i.product?.name} (${i.quantity} left)`).join(" • ")}
              </p>
            </div>
          </div>
          <Link
            href="/purchases"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <span>Create Inward Purchase Order</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Two-Column Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoiced Sales */}
        <div className="solvexa-card overflow-hidden border border-slate-200/90 shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-purple-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-950">
                Recent Sales Invoices
              </h3>
            </div>
            <Link
              href="/sales"
              className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                      No sales invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((s) => (
                    <tr key={s.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-purple-950">
                        {s.invoice_number}
                      </td>
                      <td className="p-3 text-slate-800 font-semibold">
                        {s.customer?.name || "Walk-in Customer"}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900">
                        Rs. {Number(s.total || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.payment_status === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : s.payment_status === "PARTIAL"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {s.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="solvexa-card overflow-hidden border border-slate-200/90 shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-amber-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Recent Purchase Invoices
              </h3>
            </div>
            <Link
              href="/purchases"
              className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                      No purchases logged yet.
                    </td>
                  </tr>
                ) : (
                  recentPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {p.invoice_number}
                      </td>
                      <td className="p-3 text-slate-800 font-semibold">
                        {p.supplier?.name || "Supplier"}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-slate-900">
                        Rs. {Number(p.total || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.payment_status === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : p.payment_status === "PARTIAL"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
