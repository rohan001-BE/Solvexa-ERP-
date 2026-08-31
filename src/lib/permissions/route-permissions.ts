/**
 * Maps dashboard routes to the permission code required to access them.
 * Used by sidebar filtering, page guards, and the admin role matrix.
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/dashboard": "view_dashboard",
  "/products": "view_products",
  "/categories": "view_categories",
  "/inventory": "view_inventory",
  "/suppliers": "view_suppliers",
  "/purchases": "view_purchases",
  "/purchase-returns": "return_purchases",
  "/customers": "view_customers",
  "/sales": "view_sales",
  "/sales-returns": "return_sales",
  "/payments": "view_payments",
  "/expenses": "view_expenses",
  "/reports": "view_reports",
  "/employees": "view_employees",
  "/audit-logs": "view_audit_logs",
  "/settings": "manage_settings",
  "/about": "view_dashboard",
};

/** Routes that any authenticated user may access (no permission required). */
export const PUBLIC_DASHBOARD_ROUTES = ["/"];

export function getRequiredPermission(pathname: string): string | null {
  if (PUBLIC_DASHBOARD_ROUTES.includes(pathname)) return null;

  const exact = ROUTE_PERMISSIONS[pathname];
  if (exact) return exact;

  const match = Object.entries(ROUTE_PERMISSIONS).find(
    ([route]) => route !== "/" && pathname.startsWith(route + "/")
  );
  return match ? match[1] : null;
}

export function canAccessRoute(
  pathname: string,
  permissions: string[],
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  const required = getRequiredPermission(pathname);
  if (!required) return true;
  return permissions.includes(required);
}

/** First dashboard route the user is allowed to visit (fallback landing page). */
export function getDefaultRoute(permissions: string[], isAdmin: boolean): string {
  if (isAdmin) return "/dashboard";

  const priority = [
    "/dashboard",
    "/products",
    "/sales",
    "/inventory",
    "/reports",
    "/payments",
    "/customers",
    "/purchases",
    "/categories",
    "/suppliers",
    "/expenses",
    "/employees",
  ];

  for (const route of priority) {
    const perm = ROUTE_PERMISSIONS[route];
    if (perm && permissions.includes(perm)) return route;
  }

  return "/dashboard";
}
