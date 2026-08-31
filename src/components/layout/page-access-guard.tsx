"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  canAccessRoute,
  getDefaultRoute,
  getRequiredPermission,
} from "@/lib/permissions/route-permissions";
import { usePermissionsContext } from "@/lib/permissions/permissions-context";

interface PageAccessGuardProps {
  children: React.ReactNode;
}

export function PageAccessGuard({ children }: PageAccessGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { permissions, role, isAdmin } = usePermissionsContext();

  const allowed = canAccessRoute(pathname, permissions, isAdmin);
  const requiredPermission = getRequiredPermission(pathname);

  useEffect(() => {
    if (allowed) return;

    // Redirect away from dashboard if user lacks view_dashboard but has other pages
    if (pathname === "/dashboard" && !isAdmin) {
      const fallback = getDefaultRoute(permissions, isAdmin);
      if (fallback !== "/dashboard") {
        router.replace(fallback);
      }
    }
  }, [allowed, pathname, permissions, isAdmin, router]);

  if (!allowed) {
    return (
      <div className="solvexa-card p-12 text-center max-w-lg mx-auto my-12 border-rose-200 bg-rose-50/20">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Your role (
          <span className="font-semibold text-purple-700">{role || "Staff"}</span>
          ) does not have permission to access this page
          {requiredPermission ? (
            <>
              {" "}
              (<span className="font-mono text-slate-500">{requiredPermission}</span>)
            </>
          ) : null}
          . Contact your administrator to update role page access in Employees → Role Permissions Matrix.
        </p>
        <div className="mt-6">
          <Link
            href={getDefaultRoute(permissions, isAdmin)}
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
