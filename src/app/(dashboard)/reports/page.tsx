"use client";

import { useState, useEffect } from "react";
import { reportsService } from "@/services/reports.service";
import { downloadCSV } from "@/lib/export-csv";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  Download,
  Loader2,
  Calendar,
  Sparkles,
  Boxes,
  FileSpreadsheet,
  ArrowDownToLine,
  PieChart,
  Activity,
  Layers,
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sales" | "purchases" | "expenses" | "inventory">("sales");

  // Date filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [profitLoss, setProfitLoss] = useState<{
    totalRevenue: number;
    totalCost: number;
    totalExpenses: number;
    netProfit: number;
  }>({
    totalRevenue: 0,
    totalCost: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  const [salesReport, setSalesReport] = useState<any[]>([]);
  const [purchasesReport, setPurchasesReport] = useState<any[]>([]);
  const [expensesReport, setExpensesReport] = useState<any[]>([]);
  const [inventoryReport, setInventoryReport] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pl, sales, purs, exps, inv] = await Promise.all([
        reportsService.getProfitLossReport(),
        reportsService.getSalesReport(startDate || undefined, endDate || undefined),
        reportsService.getPurchasesReport(startDate || undefined, endDate || undefined),
        reportsService.getExpensesReport(),
        reportsService.getInventoryReport(),
      ]);
      setProfitLoss(pl);
      setSalesReport(sales);
      setPurchasesReport(purs);
      setExpensesReport(exps);
      setInventoryReport(inv);
    } catch (err) {
      console.error("Error loading reports data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  // Export Handlers
  const handleExportSalesCSV = () => {
    if (salesReport.length === 0) return;
    const headers = [
      "Invoice Number",
      "Date",
      "Customer Name",
      "Subtotal (PKR)",
      "Discount (PKR)",
      "Tax (PKR)",
      "Grand Total (PKR)",
      "Paid Amount (PKR)",
      "Remaining Due (PKR)",
      "Payment Status",
      "Order Status",
    ];
    const rows = salesReport.map((s) => [
      s.invoice_number,
      new Date(s.created_at).toLocaleString(),
      s.customer?.name || "Walk-in Counter Customer",
      Number(s.subtotal || 0).toFixed(2),
      Number(s.discount || 0).toFixed(2),
      Number(s.tax || 0).toFixed(2),
      Number(s.total || 0).toFixed(2),
      Number(s.paid_amount || 0).toFixed(2),
      Number(s.due_amount || 0).toFixed(2),
      s.payment_status,
      s.status,
    ]);
    downloadCSV("Solvexa_Sales_Report", headers, rows);
  };

  const handleExportPurchasesCSV = () => {
    if (purchasesReport.length === 0) return;
    const headers = [
      "Purchase Invoice #",
      "Date",
      "Supplier / Distributor",
      "Subtotal (PKR)",
      "Total Cost (PKR)",
      "Paid Amount (PKR)",
      "Due Balance (PKR)",
      "Payment Status",
      "Inward Status",
    ];
    const rows = purchasesReport.map((p) => [
      p.invoice_number,
      new Date(p.created_at).toLocaleString(),
      p.supplier?.name || "Supplier",
      Number(p.subtotal || 0).toFixed(2),
      Number(p.total || 0).toFixed(2),
      Number(p.paid_amount || 0).toFixed(2),
      Number(p.due_amount || 0).toFixed(2),
      p.payment_status,
      p.status,
    ]);
    downloadCSV("Solvexa_Purchasing_Report", headers, rows);
  };

  const handleExportExpensesCSV = () => {
    if (expensesReport.length === 0) return;
    const headers = [
      "Expense Date",
      "Category",
      "Amount (PKR)",
      "Payment Method",
      "Description / Reference",
      "Logged At",
    ];
    const rows = expensesReport.map((e) => [
      e.expense_date,
      e.category?.name || "Operating Expense",
      Number(e.amount || 0).toFixed(2),
      e.method,
      e.note || "",
      new Date(e.created_at).toLocaleString(),
    ]);
    downloadCSV("Solvexa_Expenses_Ledger", headers, rows);
  };

  const handleExportInventoryCSV = () => {
    if (inventoryReport.length === 0) return;
    const headers = [
      "Product Name",
      "SKU",
      "Barcode",
      "Category",
      "Unit",
      "Unit Cost (PKR)",
      "Retail Price (PKR)",
      "Quantity On Hand",
      "Total Stock Value (PKR)",
      "Min Stock Alert",
      "Stock Status",
    ];
    const rows = inventoryReport.map((inv) => {
      const p = inv.product;
      const qty = Number(inv.quantity || 0);
      const cost = Number(p?.purchase_price || 0);
      const totalVal = qty * cost;
      const isLow = qty <= (p?.minimum_stock || 5);
      return [
        p?.name || "Product",
        p?.sku || "",
        p?.barcode || "",
        p?.category?.name || "General",
        p?.unit?.symbol || "pcs",
        cost.toFixed(2),
        Number(p?.sale_price || 0).toFixed(2),
        qty,
        totalVal.toFixed(2),
        p?.minimum_stock || 5,
        isLow ? "LOW STOCK" : "IN STOCK",
      ];
    });
    downloadCSV("Solvexa_Inventory_Valuation", headers, rows);
  };

  const handleExportProfitLossCSV = () => {
    const headers = ["Financial Statement Item", "Amount (PKR)", "Notes"];
    const rows = [
      ["Gross Sales Revenue", Number(profitLoss.totalRevenue).toFixed(2), "Total invoiced sales to customers"],
      ["Cost of Goods Sold (Purchases)", Number(profitLoss.totalCost).toFixed(2), "Inward supplier purchases"],
      ["Operating Overhead Expenses", Number(profitLoss.totalExpenses).toFixed(2), "Rent, utilities, fuel, payroll"],
      [
        "Net Operating Profit",
        Number(profitLoss.netProfit).toFixed(2),
        profitLoss.netProfit >= 0 ? "Profitable Store Performance" : "Operating Deficit",
      ],
    ];
    downloadCSV("Solvexa_Profit_Loss_Statement", headers, rows);
  };

  const handleExportActiveTab = () => {
    if (activeTab === "sales") handleExportSalesCSV();
    else if (activeTab === "purchases") handleExportPurchasesCSV();
    else if (activeTab === "expenses") handleExportExpensesCSV();
    else if (activeTab === "inventory") handleExportInventoryCSV();
  };

  // Calculate Expense Breakdown for Chart
  const expenseBreakdown: { [key: string]: number } = {};
  for (const exp of expensesReport) {
    const cat = exp.category?.name || "General Overheads";
    expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + Number(exp.amount || 0);
  }
  const totalExp = Object.values(expenseBreakdown).reduce((a, b) => a + b, 0) || 1;

  // Max value for comparative bar chart scaling
  const maxFinancialValue = Math.max(
    profitLoss.totalRevenue,
    profitLoss.totalCost,
    profitLoss.totalExpenses,
    1
  );

  // Table Columns
  const salesColumns: Column<any>[] = [
    {
      header: "Invoice #",
      cell: (s) => <span className="font-mono font-bold text-purple-950">{s.invoice_number}</span>,
    },
    {
      header: "Date",
      cell: (s) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {new Date(s.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Customer",
      cell: (s) => <span className="font-bold text-slate-900">{s.customer?.name || "Walk-in"}</span>,
    },
    {
      header: "Invoice Total",
      align: "right",
      cell: (s) => (
        <span className="font-mono font-black text-slate-900">
          Rs. {Number(s.total || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Paid",
      align: "right",
      cell: (s) => (
        <span className="font-mono text-emerald-800 font-bold">
          Rs. {Number(s.paid_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Due",
      align: "right",
      cell: (s) => (
        <span className="font-mono text-rose-800 font-bold">
          Rs. {Number(s.due_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Status",
      align: "center",
      cell: (s) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            s.payment_status === "PAID"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : s.payment_status === "PARTIAL"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {s.payment_status}
        </span>
      ),
    },
  ];

  const purchasesColumns: Column<any>[] = [
    {
      header: "Purchase #",
      cell: (p) => <span className="font-mono font-bold text-amber-950">{p.invoice_number}</span>,
    },
    {
      header: "Date",
      cell: (p) => (
        <span className="font-mono text-slate-500 text-[11px]">
          {new Date(p.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Supplier",
      cell: (p) => <span className="font-bold text-slate-900">{p.supplier?.name || "Supplier"}</span>,
    },
    {
      header: "Inward Total",
      align: "right",
      cell: (p) => (
        <span className="font-mono font-black text-slate-900">
          Rs. {Number(p.total || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Paid",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-emerald-800 font-bold">
          Rs. {Number(p.paid_amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Payable Due",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-amber-950 font-bold">
          Rs. {Number(p.due_amount || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  const expensesColumns: Column<any>[] = [
    {
      header: "Date",
      cell: (e) => <span className="font-mono text-slate-500 text-[11px]">{e.expense_date}</span>,
    },
    {
      header: "Category",
      cell: (e) => (
        <span className="font-bold text-rose-900 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px]">
          {e.category?.name || "Expense"}
        </span>
      ),
    },
    {
      header: "Method",
      cell: (e) => <span className="font-mono text-slate-700 font-semibold">{e.method}</span>,
    },
    {
      header: "Note / Description",
      cell: (e) => <span className="text-slate-700 text-xs">{e.note || "—"}</span>,
    },
    {
      header: "Amount",
      align: "right",
      cell: (e) => (
        <span className="font-mono font-black text-rose-800">
          Rs. {Number(e.amount || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  const inventoryColumns: Column<any>[] = [
    {
      header: "Product / SKU",
      cell: (inv) => (
        <div>
          <div className="font-bold text-slate-900">{inv.product?.name}</div>
          <div className="text-[10px] text-slate-500 font-mono">SKU: {inv.product?.sku}</div>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (inv) => (
        <span className="text-xs font-bold text-purple-900">{inv.product?.category?.name || "General"}</span>
      ),
    },
    {
      header: "Unit Cost",
      align: "right",
      cell: (inv) => (
        <span className="font-mono text-slate-700 font-semibold">
          Rs. {Number(inv.product?.purchase_price || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Retail Price",
      align: "right",
      cell: (inv) => (
        <span className="font-mono font-black text-purple-950">
          Rs. {Number(inv.product?.sale_price || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: "Stock Qty",
      align: "center",
      cell: (inv) => {
        const qty = Number(inv.quantity || 0);
        const min = Number(inv.product?.minimum_stock || 5);
        const isLow = qty <= min;
        return (
          <span
            className={`font-mono font-black px-2 py-0.5 rounded-full text-xs ${
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
      header: "Stock Valuation",
      align: "right",
      cell: (inv) => {
        const total = Number(inv.quantity || 0) * Number(inv.product?.purchase_price || 0);
        return (
          <span className="font-mono font-black text-slate-900">
            Rs. {total.toFixed(2)}
          </span>
        );
      },
    },
  ];

  return (
    <ProtectedRoute permission="view_reports">
    <div className="space-y-7">
      {/* Header with Multi-Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-700" />
            <span>Store Financial Reports &amp; Live Visual Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit store sales, purchasing, inventory valuation, overhead expenses, and download Excel-ready CSV reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportProfitLossCSV}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-800 to-purple-950 hover:from-purple-900 hover:to-black text-amber-300 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-md shadow-purple-900/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export P&amp;L Statement (CSV)</span>
          </button>

          <button
            onClick={handleExportActiveTab}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4 text-purple-700" />
            <span>Export {activeTab.toUpperCase()} (CSV)</span>
          </button>
        </div>
      </div>

      {/* P&L Statement Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales Revenue */}
        <div className="solvexa-card p-5 space-y-2 border-emerald-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950">Gross Sales Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            Rs. {profitLoss.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Total customer invoiced revenue</span>
        </div>

        {/* Cost of Goods / Purchases */}
        <div className="solvexa-card p-5 space-y-2 border-amber-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950">Purchases / COGS</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-950 font-mono">
            Rs. {profitLoss.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Inward stock valuation</span>
        </div>

        {/* Operating Expenses */}
        <div className="solvexa-card p-5 space-y-2 border-rose-100 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-950">Overhead Expenses</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-800 font-mono">
            Rs. {profitLoss.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Rent, power, fuel &amp; payroll</span>
        </div>

        {/* Net Profit */}
        <div className="solvexa-banner-dark p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Net Store Profit</span>
            <div className="p-2 rounded-xl bg-amber-400 text-purple-950 shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-black font-mono ${
              profitLoss.netProfit >= 0 ? "text-amber-300" : "text-rose-300"
            }`}
          >
            Rs. {profitLoss.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-purple-200 font-normal">Revenue - Purchases - Expenses</span>
        </div>
      </div>

      {/* LIVE VISUAL FINANCIAL CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Financial Flow Waterfall / Bar Chart */}
        <div className="solvexa-card p-6 space-y-5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-950">
                  Financial Waterfall &amp; Allocation
                </h3>
                <p className="text-[11px] text-slate-500">Live comparative statement</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">Currency: PKR</span>
          </div>

          <div className="space-y-4 pt-1">
            {/* Gross Revenue */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-950">Gross Customer Revenue</span>
                <span className="font-mono text-emerald-900">
                  Rs. {profitLoss.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(12, (profitLoss.totalRevenue / maxFinancialValue) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Inward Purchases / COGS */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-950">Cost of Goods (Purchases)</span>
                <span className="font-mono text-amber-950">
                  Rs. {profitLoss.totalCost.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(12, (profitLoss.totalCost / maxFinancialValue) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Overhead Expenses */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-950">Store Operating Overheads</span>
                <span className="font-mono text-rose-800">
                  Rs. {profitLoss.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(12, (profitLoss.totalExpenses / maxFinancialValue) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Operating Overhead Distribution */}
        <div className="solvexa-card p-6 space-y-5 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-950">
                  Operating Overhead Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">By category allocation</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-rose-700">
              Total: Rs. {totalExp.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(expenseBreakdown).map(([catName, amount], idx) => {
              const pct = ((amount / totalExp) * 100).toFixed(1);
              const colors = [
                "from-purple-600 to-purple-800",
                "from-amber-500 to-amber-700",
                "from-rose-500 to-rose-700",
                "from-indigo-500 to-indigo-700",
                "from-emerald-500 to-emerald-700",
              ];
              const barColor = colors[idx % colors.length];

              return (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span className="truncate max-w-[200px]">{catName}</span>
                    <span className="font-mono text-slate-600">
                      Rs. {amount.toLocaleString()} <strong className="text-purple-950 font-black">({pct}%)</strong>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(8, Number(pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Filter & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "sales"
                ? "bg-purple-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Sales Ledger ({salesReport.length})
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "purchases"
                ? "bg-purple-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Purchases ({purchasesReport.length})
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "expenses"
                ? "bg-purple-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Expenses ({expensesReport.length})
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "inventory"
                ? "bg-purple-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Inventory Valuation ({inventoryReport.length})
          </button>
        </div>

        {/* Date Filter Inputs */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1.5 rounded-xl shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-purple-700" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="outline-none text-slate-900 text-xs font-mono bg-transparent"
              placeholder="From Date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="outline-none text-slate-900 text-xs font-mono bg-transparent"
              placeholder="To Date"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-purple-700 hover:text-purple-950 font-bold ml-1 text-[11px]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Tab DataTable */}
      {activeTab === "sales" && (
        <DataTable
          columns={salesColumns}
          data={salesReport}
          loading={loading}
          searchPlaceholder="Search sales by invoice # or customer..."
          searchFilter={(s, q) =>
            s.invoice_number.toLowerCase().includes(q) ||
            Boolean(s.customer?.name && s.customer.name.toLowerCase().includes(q))
          }
        />
      )}

      {activeTab === "purchases" && (
        <DataTable
          columns={purchasesColumns}
          data={purchasesReport}
          loading={loading}
          searchPlaceholder="Search purchases by invoice # or supplier..."
          searchFilter={(p, q) =>
            p.invoice_number.toLowerCase().includes(q) ||
            Boolean(p.supplier?.name && p.supplier.name.toLowerCase().includes(q))
          }
        />
      )}

      {activeTab === "expenses" && (
        <DataTable
          columns={expensesColumns}
          data={expensesReport}
          loading={loading}
          searchPlaceholder="Search expenses by category or note..."
          searchFilter={(e, q) =>
            Boolean(e.note && e.note.toLowerCase().includes(q)) ||
            Boolean(e.category?.name && e.category.name.toLowerCase().includes(q))
          }
        />
      )}

      {activeTab === "inventory" && (
        <DataTable
          columns={inventoryColumns}
          data={inventoryReport}
          loading={loading}
          searchPlaceholder="Search inventory by product name or SKU..."
          searchFilter={(i, q) =>
            Boolean(i.product?.name && i.product.name.toLowerCase().includes(q)) ||
            Boolean(i.product?.sku && i.product.sku.toLowerCase().includes(q))
          }
        />
      )}
    </div>
    </ProtectedRoute>
  );
}
