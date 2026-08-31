"use client";

import { useState, useEffect } from "react";
import { employeesService } from "@/services/employees.service";
import { createStaffAccount } from "@/app/actions/employees";
import { updateRolePermissions } from "@/app/actions/permissions";
import { Profile, Role, Permission } from "@/types/database.types";
import {
  UserCheck,
  Shield,
  Plus,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  KeyRound,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Sliders,
  Check,
  Save,
  LayoutDashboard,
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
  Settings,
  Sparkles,
  Lock,
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { usePermissions } from "@/lib/permissions/use-permissions";

interface PermissionGroup {
  category: string;
  description: string;
  icon: any;
  items: {
    code: string;
    label: string;
    isPage?: boolean;
    description: string;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: "Executive & Business Analytics",
    description: "Store KPIs, financial overview, and business performance metrics",
    icon: LayoutDashboard,
    items: [
      {
        code: "view_dashboard",
        label: "Executive Dashboard",
        isPage: true,
        description: "Access /dashboard with store sales, valuation, and KPI metrics",
      },
      {
        code: "view_reports",
        label: "Reports & Profit/Loss",
        isPage: true,
        description: "Access /reports for daily financial breakdowns and revenue analytics",
      },
      {
        code: "view_audit_logs",
        label: "Audit Logs & Security Trail",
        isPage: true,
        description: "Access /audit-logs to inspect system events and modification history",
      },
    ],
  },
  {
    category: "Catalog & Stock Management",
    description: "Products, categorization taxonomy, units of measure, and physical stock",
    icon: Package,
    items: [
      {
        code: "view_products",
        label: "Products Catalog Page",
        isPage: true,
        description: "Access /products to browse SKU directory, barcodes, and pricing",
      },
      {
        code: "create_products",
        label: "Add New Products",
        description: "Ability to register new products and barcode entries",
      },
      {
        code: "edit_products",
        label: "Edit Product Details",
        description: "Ability to modify product descriptions, categories, and selling prices",
      },
      {
        code: "delete_products",
        label: "Delete / Deactivate Products",
        description: "Ability to remove or deactivate obsolete SKUs from the store",
      },
      {
        code: "view_categories",
        label: "Categories & Units Page",
        isPage: true,
        description: "Access /categories for department taxonomy and measurement units",
      },
      {
        code: "create_categories",
        label: "Create Categories",
        description: "Add new product department classifications",
      },
      {
        code: "edit_categories",
        label: "Edit Categories",
        description: "Update existing category descriptions and tax codes",
      },
      {
        code: "view_inventory",
        label: "Inventory Stock Page",
        isPage: true,
        description: "Access /inventory for live inventory levels, valuations, and low-stock alerts",
      },
      {
        code: "adjust_inventory",
        label: "Manual Stock Adjustments",
        description: "Perform manual inward/outward quantity corrections and stocktakes",
      },
    ],
  },
  {
    category: "Purchasing & Inward Supply",
    description: "Distributor directory, inward order pipeline, and purchase returns",
    icon: Truck,
    items: [
      {
        code: "view_suppliers",
        label: "Supplier Directory Page",
        isPage: true,
        description: "Access /suppliers for vendor contact directories and accounts payable",
      },
      {
        code: "create_suppliers",
        label: "Register New Suppliers",
        description: "Add wholesale distributors and manufacturer profiles",
      },
      {
        code: "edit_suppliers",
        label: "Edit Supplier Details",
        description: "Update supplier phone numbers, addresses, and payment terms",
      },
      {
        code: "view_purchases",
        label: "Purchases Pipeline Page",
        isPage: true,
        description: "Access /purchases to review inward wholesale bills and receive stock",
      },
      {
        code: "create_purchases",
        label: "Create Purchase Orders",
        description: "Record inward inventory shipments and auto-credit physical stock",
      },
      {
        code: "edit_purchases",
        label: "Edit Purchases",
        description: "Modify purchase line items and cost figures",
      },
      {
        code: "return_purchases",
        label: "Purchase Returns Page",
        isPage: true,
        description: "Access /purchase-returns to return defective stock to suppliers",
      },
    ],
  },
  {
    category: "Sales & Customer Invoicing",
    description: "Customer accounts, point-of-sale invoicing, and sales returns",
    icon: Users,
    items: [
      {
        code: "view_customers",
        label: "Customer Directory Page",
        isPage: true,
        description: "Access /customers for retail buyer profiles and credit balance receivables",
      },
      {
        code: "create_customers",
        label: "Register Customers",
        description: "Add new retail/wholesale customer profiles",
      },
      {
        code: "edit_customers",
        label: "Edit Customer Info",
        description: "Update customer credit limits, phone numbers, and addresses",
      },
      {
        code: "view_sales",
        label: "Sales Invoices Page",
        isPage: true,
        description: "Access /sales to create customer bills and print checkout receipts",
      },
      {
        code: "create_sales",
        label: "Point of Sale (POS) & Invoice Generation",
        isPage: true,
        description: "Access /pos and /sales to quickly scan items, take payments, and generate customer receipts",
      },
      {
        code: "edit_sales",
        label: "Edit Sales Invoices",
        description: "Modify items or billing adjustments on sales orders",
      },
      {
        code: "return_sales",
        label: "Sales Returns Page",
        isPage: true,
        description: "Access /sales-returns to process customer returns and restocking",
      },
    ],
  },
  {
    category: "Finance & Cash Flow Ledger",
    description: "Double-entry payment transactions, operating expenses, and overheads",
    icon: CreditCard,
    items: [
      {
        code: "view_payments",
        label: "Payments Ledger Page",
        isPage: true,
        description: "Access /payments to monitor cash inflows, outflows, and net balances",
      },
      {
        code: "create_payments",
        label: "Record Payment Transactions",
        description: "Record customer dues received or supplier payouts settled",
      },
      {
        code: "view_expenses",
        label: "Operating Expenses Page",
        isPage: true,
        description: "Access /expenses for utility bills, rent, and overhead tracking",
      },
      {
        code: "create_expenses",
        label: "Log New Overhead Expenses",
        description: "Record store operating expenses against the general ledger",
      },
      {
        code: "edit_expenses",
        label: "Edit Expenses",
        description: "Update expense categories, descriptions, or voucher amounts",
      },
    ],
  },
  {
    category: "Administration & Configuration",
    description: "Staff access control, roles, and global store settings",
    icon: Settings,
    items: [
      {
        code: "view_employees",
        label: "Employees & Staff Page",
        isPage: true,
        description: "Access /employees to create user accounts and configure role permissions",
      },
      {
        code: "create_employees",
        label: "Create Staff Accounts",
        description: "Provision new employee login credentials",
      },
      {
        code: "edit_employees",
        label: "Update Staff Roles",
        description: "Change employee role assignments and active/disabled states",
      },
      {
        code: "manage_settings",
        label: "Store Settings & Content Management (CMS)",
        isPage: true,
        description: "Access /settings and /cms to configure store metadata, receipt headers, and public website content",
      },
    ],
  },
];

export default function EmployeesPage() {
  const { role: currentUserRole, hasPermission } = usePermissions();
  const isCurrentUserAdmin = currentUserRole === "Admin";
  const canEditStaff = isCurrentUserAdmin || hasPermission("edit_employees");
  const canCreateStaff = isCurrentUserAdmin || hasPermission("create_employees");

  const [activeTab, setActiveTab] = useState<"staff" | "matrix">("staff");
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({});
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>("");
  const [selectedPermCodes, setSelectedPermCodes] = useState<Set<string>>(new Set());
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create Staff Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("001001");
  const [phone, setPhone] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [emps, rls, perms, rolePerms] = await Promise.all([
        employeesService.getEmployees(),
        employeesService.getRoles(),
        employeesService.getAllPermissions(),
        employeesService.getRolePermissions(),
      ]);

      setEmployees(emps);
      setRoles(rls);
      setAllPermissions(perms);

      // Build mapping of role_id -> permission codes
      const map: Record<string, string[]> = {};
      rls.forEach((r) => {
        map[r.id] = [];
      });

      rolePerms.forEach((rp: any) => {
        if (rp.role_id && rp.permission?.code) {
          if (!map[rp.role_id]) map[rp.role_id] = [];
          map[rp.role_id].push(rp.permission.code);
        }
      });

      setRolePermissionsMap(map);

      // Set initial selected role for matrix
      if (rls.length > 0) {
        const initialRoleId = selectedRoleForMatrix || rls.find((r) => r.name === "Manager")?.id || rls[0].id;
        setSelectedRoleForMatrix(initialRoleId);
        setSelectedPermCodes(new Set(map[initialRoleId] || []));
      }

      if (rls.length > 0 && !selectedRoleId) {
        const defaultRole = rls.find((r) => r.name === "Sales Staff") || rls[0];
        setSelectedRoleId(defaultRole.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selected role in Matrix changes, update active codes
  const handleSelectRoleForMatrix = (roleId: string) => {
    setSelectedRoleForMatrix(roleId);
    const codes = rolePermissionsMap[roleId] || [];
    setSelectedPermCodes(new Set(codes));
    setFeedback(null);
  };

  const handleTogglePermission = (code: string) => {
    const updated = new Set(selectedPermCodes);
    if (updated.has(code)) {
      updated.delete(code);
    } else {
      updated.add(code);
    }
    setSelectedPermCodes(updated);
  };

  const handleGrantAll = () => {
    const allCodes = new Set(allPermissions.map((p) => p.code));
    setSelectedPermCodes(allCodes);
  };

  const handleRevokeAll = () => {
    setSelectedPermCodes(new Set());
  };

  const handleSaveMatrix = async () => {
    if (!selectedRoleForMatrix) return;
    const currentRole = roles.find((r) => r.id === selectedRoleForMatrix);
    if (!currentRole) return;

    if (currentRole.name === "Admin") {
      setFeedback({
        type: "success",
        message: "Administrator role automatically maintains full unrestricted access to all ERP modules.",
      });
      return;
    }

    setSavingMatrix(true);
    setFeedback(null);

    try {
      // Find permission IDs for selected codes
      const targetIds = allPermissions
        .filter((p) => selectedPermCodes.has(p.code))
        .map((p) => p.id);

      await updateRolePermissions({
        roleId: selectedRoleForMatrix,
        permissionIds: targetIds,
      });

      // Update local state map
      setRolePermissionsMap((prev) => ({
        ...prev,
        [selectedRoleForMatrix]: Array.from(selectedPermCodes),
      }));

      setFeedback({
        type: "success",
        message: `Successfully updated permissions and page access for role: ${currentRole.name}! Changes take effect immediately for all associated staff accounts.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save role permissions",
      });
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !selectedRoleId) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      await createStaffAccount({
        fullName,
        email,
        password: password || "001001",
        phone: phone || undefined,
        roleId: selectedRoleId,
      });

      setFeedback({
        type: "success",
        message: `Account created successfully for ${email} with initial password: ${password || "001001"}`,
      });

      setFullName("");
      setEmail("");
      setPassword("001001");
      setPhone("");
      setIsCreateModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to create staff account",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (profileId: string, roleId: string) => {
    try {
      await employeesService.updateEmployeeRole(profileId, roleId);
      await loadData();
      setFeedback({
        type: "success",
        message: "Employee role updated successfully.",
      });
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      await employeesService.toggleEmployeeStatus(profileId, !currentStatus);
      await loadData();
      setFeedback({
        type: "success",
        message: `Employee account status ${!currentStatus ? "activated" : "deactivated"} successfully.`,
      });
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  };

  const currentSelectedRole = roles.find((r) => r.id === selectedRoleForMatrix);
  const isSelectedRoleAdmin = currentSelectedRole?.name === "Admin";

  return (
    <ProtectedRoute permission="view_employees">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header with Navigation and Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-purple-700" />
              <span>Employee &amp; Role-Based Access Control</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create employee accounts, customize role permissions, and control which pages and features staff members can access.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canCreateStaff && (
              <button
                onClick={() => {
                  setFeedback(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-amber-300" />
                <span>Create Staff Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium leading-relaxed">{feedback.message}</div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
          <button
            onClick={() => setActiveTab("staff")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "staff"
                ? "bg-purple-900 text-amber-300 shadow-md shadow-purple-900/20"
                : "text-slate-600 hover:text-purple-950 hover:bg-purple-50/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Accounts &amp; Profiles ({employees.length})</span>
          </button>

          {isCurrentUserAdmin && (
            <button
              onClick={() => setActiveTab("matrix")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === "matrix"
                  ? "bg-purple-900 text-amber-300 shadow-md shadow-purple-900/20"
                  : "text-slate-600 hover:text-purple-950 hover:bg-purple-50/60"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Role Permissions &amp; Page Access Matrix</span>
            </button>
          )}
        </div>

        {/* TAB 1: STAFF ACCOUNTS DIRECTORY */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            {/* Roles Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {roles.map((r) => {
                const count = employees.filter((e) => e.role_id === r.id).length;
                return (
                  <div
                    key={r.id}
                    className="solvexa-card p-3 text-center border-purple-100 bg-gradient-to-b from-purple-50/40 to-white"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 truncate block">
                      {r.name}
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 mt-0.5 block font-mono">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400">members</span>
                  </div>
                );
              })}
            </div>

            {/* Employees Table */}
            <div className="solvexa-card overflow-hidden border border-slate-200">
              <div className="p-4 border-b border-slate-100 bg-purple-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                    Registered Staff Directory
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign ERP roles to employees. Role page access can be configured in the Matrix tab.
                  </p>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Total Accounts: <strong>{employees.length}</strong>
                </span>
              </div>

              {loading ? (
                <div className="p-16 text-center text-slate-500">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-purple-600" />
                  <p className="text-xs font-medium text-slate-600">Loading staff records...</p>
                </div>
              ) : employees.length === 0 ? (
                <div className="p-16 text-center text-slate-400 text-xs">
                  No staff profiles found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5">Employee Name</th>
                        <th className="px-4 py-3.5">Email Address</th>
                        <th className="px-4 py-3.5">Contact Phone</th>
                        <th className="px-4 py-3.5">Assigned ERP Role</th>
                        <th className="px-4 py-3.5 text-center">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {employees.map((emp) => {
                        const isSuperAdmin = emp.email === "rohan@gmail.com";

                        return (
                          <tr key={emp.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs border border-purple-200">
                                  {emp.full_name?.charAt(0) || "E"}
                                </div>
                                <div>
                                  <span>{emp.full_name || "Employee"}</span>
                                  {isSuperAdmin && (
                                    <span className="ml-2 text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.5 rounded font-mono">
                                      OWNER
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 text-slate-600 font-mono">
                              {emp.email || "—"}
                            </td>

                            <td className="px-4 py-3.5 text-slate-600">
                              {emp.phone || "—"}
                            </td>

                            <td className="px-4 py-3.5">
                              <select
                                disabled={isSuperAdmin || !canEditStaff}
                                value={emp.role_id || ""}
                                onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                                className="bg-white border border-slate-200 text-purple-950 font-bold text-xs rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200 shadow-xs disabled:opacity-75 disabled:bg-slate-50 cursor-pointer"
                              >
                                <option value="">No Role (Restricted Access)</option>
                                {roles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  emp.is_active
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                              >
                                {emp.is_active ? "Active" : "Disabled"}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              {!isSuperAdmin && canEditStaff && (
                                <button
                                  onClick={() => handleToggleStatus(emp.id, emp.is_active)}
                                  className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all shadow-xs cursor-pointer ${
                                    emp.is_active
                                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  }`}
                                >
                                  {emp.is_active ? "Deactivate" : "Activate"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ROLE PERMISSIONS & PAGE ACCESS MATRIX */}
        {activeTab === "matrix" && isCurrentUserAdmin && (
          <div className="space-y-6">
            {/* Role Picker Banner */}
            <div className="solvexa-card p-5 border-2 border-purple-200/80 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white shadow-xl shadow-purple-950/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                      <span>Select Role to Configure Page Access</span>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </h2>
                    <p className="text-xs text-purple-200/80">
                      Choose a role below to view and select which pages and features staff in this role can access.
                    </p>
                  </div>
                </div>

                {!isSelectedRoleAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleGrantAll}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Grant All Pages
                    </button>
                    <button
                      onClick={handleRevokeAll}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Revoke All
                    </button>
                  </div>
                )}
              </div>

              {/* Role Selection Pills */}
              <div className="flex flex-wrap gap-2.5">
                {roles.map((r) => {
                  const isSelected = selectedRoleForMatrix === r.id;
                  const countPerms = (rolePermissionsMap[r.id] || []).length;
                  const isAdminRole = r.name === "Admin";

                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRoleForMatrix(r.id)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? "bg-amber-400 text-purple-950 shadow-lg shadow-amber-400/30 scale-[1.02]"
                          : "bg-white/10 text-purple-100 hover:bg-white/20 border border-white/10"
                      }`}
                    >
                      <Shield className={`w-4 h-4 ${isSelected ? "text-purple-950" : "text-amber-300"}`} />
                      <span>{r.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ${
                          isSelected
                            ? "bg-purple-950 text-amber-300"
                            : "bg-black/30 text-purple-200"
                        }`}
                      >
                        {isAdminRole ? "Full Access" : `${countPerms} permitted`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Header Info & Save Bar */}
            {currentSelectedRole && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-900 text-amber-300 flex items-center justify-center font-bold">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-purple-950">
                        Permissions for: {currentSelectedRole.name}
                      </h3>
                      {isSelectedRoleAdmin ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                          SUPER ADMIN (LOCKED)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 text-[10px] font-extrabold font-mono">
                          {selectedPermCodes.size} / {allPermissions.length} Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentSelectedRole.description || "Custom ERP access profile"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isSelectedRoleAdmin && (
                    <button
                      onClick={handleSaveMatrix}
                      disabled={savingMatrix}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-amber-300 text-xs font-black rounded-xl shadow-md shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {savingMatrix ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      ) : (
                        <Save className="w-4 h-4 text-amber-300" />
                      )}
                      <span>Save Role Permissions</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Permission Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PERMISSION_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                const groupItemCodes = group.items.map((i) => i.code);
                const enabledCountInGroup = groupItemCodes.filter((c) =>
                  isSelectedRoleAdmin ? true : selectedPermCodes.has(c)
                ).length;
                const isGroupAllEnabled = enabledCountInGroup === groupItemCodes.length;

                const toggleGroupAll = () => {
                  if (isSelectedRoleAdmin) return;
                  const updated = new Set(selectedPermCodes);
                  if (isGroupAllEnabled) {
                    groupItemCodes.forEach((c) => updated.delete(c));
                  } else {
                    groupItemCodes.forEach((c) => updated.add(c));
                  }
                  setSelectedPermCodes(updated);
                };

                return (
                  <div
                    key={group.category}
                    className="solvexa-card p-5 border border-slate-200 space-y-4 bg-white hover:border-purple-200 transition-colors shadow-xs"
                  >
                    {/* Category Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold flex-shrink-0">
                          <GroupIcon className="w-4 h-4 text-purple-800" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-950">
                            {group.category}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{group.description}</p>
                        </div>
                      </div>

                      {!isSelectedRoleAdmin && (
                        <button
                          onClick={toggleGroupAll}
                          className="text-[10px] font-extrabold text-purple-700 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          {isGroupAllEnabled ? "Deselect Group" : "Select Group"}
                        </button>
                      )}
                    </div>

                    {/* Permissions List in Group */}
                    <div className="space-y-2.5">
                      {group.items.map((item) => {
                        const isChecked = isSelectedRoleAdmin || selectedPermCodes.has(item.code);

                        return (
                          <div
                            key={item.code}
                            onClick={() => !isSelectedRoleAdmin && handleTogglePermission(item.code)}
                            className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                              isSelectedRoleAdmin
                                ? "bg-amber-50/40 border-amber-100"
                                : isChecked
                                ? "bg-purple-50/50 border-purple-200 hover:border-purple-300 cursor-pointer"
                                : "bg-slate-50/60 border-slate-100 hover:border-slate-300 cursor-pointer"
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold ${
                                    isChecked ? "text-purple-950" : "text-slate-600"
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {item.isPage && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200">
                                    PAGE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug">
                                {item.description}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                code: {item.code}
                              </span>
                            </div>

                            {/* Checkbox / Toggle Switch */}
                            <div className="pt-0.5">
                              {isSelectedRoleAdmin ? (
                                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center">
                                  <Lock className="w-3 h-3 text-amber-700" />
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    isChecked
                                      ? "bg-purple-700 border-purple-700 text-amber-300 shadow-xs"
                                      : "bg-white border-slate-300"
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Save Bar */}
            {!isSelectedRoleAdmin && currentSelectedRole && (
              <div className="sticky bottom-4 z-30 p-4 bg-purple-950/95 backdrop-blur-md rounded-2xl border border-purple-700 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-300 block">
                      Pending Changes for: {currentSelectedRole.name}
                    </span>
                    <span className="text-[11px] text-purple-200">
                      {selectedPermCodes.size} total permissions selected. Click save to publish changes.
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSaveMatrix}
                  disabled={savingMatrix}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-purple-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingMatrix ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-950" />
                  ) : (
                    <Save className="w-4 h-4 text-purple-950" />
                  )}
                  <span>Save Role Permissions</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* CREATE STAFF MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="solvexa-card w-full max-w-lg p-6 shadow-2xl border border-purple-100 space-y-5 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Create New Staff Account
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Registers auth login credentials and assigns ERP role.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="staff@solvexa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-purple-600 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Initial Password *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="001001"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-purple-600 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="+92 300 1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-purple-600 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Assigned ERP Role *
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        required
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-purple-950 font-bold rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-purple-600 text-xs cursor-pointer"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
                  <strong>Role Privileges:</strong> Page access permissions for the selected role are managed directly in the Role Permissions &amp; Page Access Matrix tab.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-700/25 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Account</span>
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
