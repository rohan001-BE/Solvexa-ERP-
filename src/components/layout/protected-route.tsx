"use client";

import React from "react";
import { usePermissions } from "@/lib/permissions/use-permissions";
import { getDefaultRoute } from "@/lib/permissions/route-permissions";
import { ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({
  children,
  permission,
  requiredRole,
}: ProtectedRouteProps) {
  const { role, permissions, loading, hasPermission } = usePermissions();

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-600" />
        <p className="text-xs font-medium text-slate-600">Verifying role permissions...</p>
      </div>
    );
  }

  const isRoleAllowed = !requiredRole || role === "Admin" || role === requiredRole;
  const isPermissionAllowed = !permission || hasPermission(permission);

  if (!isRoleAllowed || !isPermissionAllowed) {
    return (
      <div className="solvexa-card p-12 text-center max-w-lg mx-auto my-12 border-rose-200 bg-rose-50/20">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Your current account role (
          <span className="font-semibold text-purple-700">{role || "Staff"}</span>
          ) does not have permission to view or manage this back-office module.
        </p>
        <div className="mt-6">
          <Link
            href={getDefaultRoute(permissions, role === "Admin")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Go to Allowed Page
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
