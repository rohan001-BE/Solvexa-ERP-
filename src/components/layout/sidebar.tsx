"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  Package,
  Boxes,
  Truck,
  ShoppingCart,
  RotateCcw,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  ClipboardList,
  UserCheck,
  Settings,
  Tags,
  FileSpreadsheet,
  MonitorSmartphone,
  LayoutTemplate,
  ChevronRight,
  LogOut,
  Info,
} from "lucide-react";
import { signout } from "@/app/actions/auth";

const navSections = [
  {
    title: "Overview",
    items: [
      { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
      { name: "Public Home Page", href: "/", icon: Home, permission: "" },
    ],
  },
  {
    title: "Catalog & Stock",
    items: [
      { name: "Products", href: "/products", icon: Package, permission: "view_products" },
      { name: "Categories & Units", href: "/categories", icon: Tags, permission: "view_categories" },
      { name: "Inventory Stock", href: "/inventory", icon: Boxes, permission: "view_inventory" },
    ],
  },
  {
    title: "Purchasing",
    items: [
      { name: "Suppliers", href: "/suppliers", icon: Truck, permission: "view_suppliers" },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart, permission: "view_purchases" },
      { name: "Purchase Returns", href: "/purchase-returns", icon: RotateCcw, permission: "return_purchases" },
    ],
  },
  {
    title: "Sales & Invoicing",
    items: [
      { name: "Point of Sale (POS)", href: "/pos", icon: MonitorSmartphone, permission: "create_sales" },
      { name: "Customers", href: "/customers", icon: Users, permission: "view_customers" },
      { name: "Sales Invoices", href: "/sales", icon: FileSpreadsheet, permission: "view_sales" },
      { name: "Sales Returns", href: "/sales-returns", icon: RotateCcw, permission: "return_sales" },
    ],
  },
  {
    title: "Finance & Reports",
    items: [
      { name: "Payments Ledger", href: "/payments", icon: CreditCard, permission: "view_payments" },
      { name: "Expenses", href: "/expenses", icon: Receipt, permission: "view_expenses" },
      { name: "Reports & P&L", href: "/reports", icon: BarChart3, permission: "view_reports" },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Employees & Staff", href: "/employees", icon: UserCheck, permission: "view_employees" },
      { name: "Content Management (CMS)", href: "/cms", icon: LayoutTemplate, permission: "manage_settings" },
      { name: "Audit Logs", href: "/audit-logs", icon: ClipboardList, permission: "view_audit_logs" },
      { name: "Store Settings", href: "/settings", icon: Settings, permission: "manage_settings" },
    ],
  },
  {
    title: "Store Info",
    items: [
      { name: "About Solvexa", href: "/about", icon: Info, permission: "view_dashboard" },
    ],
  },
];

interface SidebarProps {
  userEmail?: string | null;
  userRole?: string | null;
  userName?: string | null;
  userPermissions?: string[];
  isAdmin?: boolean;
}

export function Sidebar({
  userEmail,
  userRole,
  userName,
  userPermissions = [],
  isAdmin = false,
}: SidebarProps) {
  const pathname = usePathname();

  const filteredSections = navSections
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        if (!item.permission) return true;
        if (isAdmin) return true;
        return userPermissions.includes(item.permission);
      });
      return { ...section, items: filteredItems };
    })
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen sticky top-0 z-40 select-none shadow-sm">
      {/* Brand Header with Clickable Logo Linking to Home */}
      <Link
        href="/"
        title="Go to Solvexa Home Page"
        className="h-16 px-4 flex items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50/80 via-white to-amber-50/50 hover:bg-purple-50 transition-colors group cursor-pointer"
      >
        <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white border border-purple-200 shadow-sm flex items-center justify-center flex-shrink-0 p-0.5 group-hover:scale-105 transition-transform">
          <Image
            src="/logo.png"
            alt="Solvexa Logo"
            width={34}
            height={34}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-black text-purple-950 tracking-tight text-sm truncate flex items-center gap-1 group-hover:text-purple-700 transition-colors">
            <span>Solvexa</span>
            <span className="text-amber-600 font-black">Store</span>
          </span>
          <span className="text-[10px] text-purple-700 font-bold tracking-wider uppercase font-mono">
            Grocery ERP
          </span>
        </div>
      </Link>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {section.title}
            </p>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-purple-700 text-white shadow-sm shadow-purple-700/20 font-bold"
                        : "text-slate-700 hover:text-purple-900 hover:bg-purple-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-amber-300" : "text-slate-400 group-hover:text-purple-600"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-300" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-900 text-amber-300 font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
              {userName ? userName[0].toUpperCase() : userEmail ? userEmail[0].toUpperCase() : "A"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 truncate">
                {userName || "Store Staff"}
              </span>
              <span className="text-[10px] text-amber-700 font-bold capitalize font-mono">
                {userRole || "User"}
              </span>
            </div>
          </div>

          <form action={signout}>
            <button
              type="submit"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
