"use client";

import { useState, useEffect } from "react";
import { employeesService } from "@/services/employees.service";
import { createStaffAccount } from "@/app/actions/employees";
import { Profile, Role } from "@/types/database.types";
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
  ShieldAlert,
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
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
      const [emps, rls] = await Promise.all([
        employeesService.getEmployees(),
        employeesService.getRoles(),
      ]);
      setEmployees(emps);
      setRoles(rls);
      if (rls.length > 0 && !selectedRoleId) {
        // Default to Sales Staff or Manager
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
        message: `Account created successfully for ${email} with password: ${password || "001001"}`,
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
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (profileId: string, currentStatus: boolean) => {
    try {
      await employeesService.toggleEmployeeStatus(profileId, !currentStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  };

  return (
    <ProtectedRoute permission="view_employees">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header with Title and Create Staff Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-purple-950 tracking-tight flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-purple-700" />
              <span>Employee &amp; Staff Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create employee accounts, assign granular ERP roles, and manage system access permissions.
            </p>
          </div>

          <button
            onClick={() => {
              setFeedback(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>Create Staff Account</span>
          </button>
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
            <div className="flex-1 font-medium">{feedback.message}</div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Roles Quick Summary */}
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
        <div className="solvexa-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-purple-50/30 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950">
              Registered Staff Profiles ({employees.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Role changes take effect immediately on next navigation
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
                            disabled={isSuperAdmin}
                            value={emp.role_id || ""}
                            onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                            className="bg-white border border-slate-200 text-purple-950 font-bold text-xs rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200 shadow-xs disabled:opacity-75 disabled:bg-slate-50"
                          >
                            <option value="">No Role (Limited Access)</option>
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
                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleToggleStatus(emp.id, emp.is_active)}
                              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all shadow-xs ${
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

        {/* Create Staff Modal */}
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
                      Registers auth login credentials and sets ERP module access.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
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
                        className="w-full bg-white border border-slate-200 text-purple-950 font-bold rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-purple-600 text-xs"
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
                  <strong>Role Privileges:</strong> Manager has full operational access, Accountant manages ledger &amp; cash flows, Sales Staff handles invoicing &amp; returns, Inventory Staff handles catalog &amp; adjustments.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-md shadow-purple-700/25 flex items-center gap-2 transition-all"
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
