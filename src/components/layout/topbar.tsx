"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Store, ShoppingBag, Bell, Calendar, Clock, CreditCard, ChevronRight } from "lucide-react";
import { reportsService } from "@/services/reports.service";

interface TopbarProps {
  storeName?: string;
  currency?: string;
}

export function Topbar({ storeName = "Solxa Grocery Store", currency = "PKR" }: TopbarProps) {
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDateStr(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);

    reportsService.getDashboardSummary().then((summary) => {
      if (summary) setLowStockCount(summary.low_stock_count);
    });

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs select-none">
      {/* Left: Store Branding & Live Clock */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-black text-purple-950 bg-purple-50/80 border border-purple-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <img src="/solxa-no-bg.png?v=2" alt="Store Logo" className="w-5 h-5 object-contain" />
          <span className="font-bold">{storeName}</span>
          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
            {currency}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-purple-600" />
          <span>{dateStr}</span>
          <span className="text-slate-300">•</span>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-mono">{timeStr}</span>
        </div>
      </div>

      {/* Right: Low Stock Alert & Quick Action Shortcuts */}
      <div className="flex items-center gap-2.5">
        {lowStockCount > 0 && (
          <Link
            href="/inventory"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-2xs"
            title={`${lowStockCount} items below minimum stock`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            <span className="hidden sm:inline">{lowStockCount} Low Stock</span>
            <span className="sm:hidden font-mono">{lowStockCount}</span>
          </Link>
        )}

        <Link
          href="/sales"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-sm shadow-purple-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 text-amber-300" />
          <span>New Invoice</span>
        </Link>

        <Link
          href="/purchases"
          className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 text-xs font-bold px-3 py-2 rounded-xl shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
          <span className="hidden sm:inline">Receive Stock</span>
        </Link>
      </div>
    </header>
  );
}
