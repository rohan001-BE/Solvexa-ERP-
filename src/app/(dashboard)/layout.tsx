import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PermissionsProvider } from "@/lib/permissions/permissions-context";
import { PageAccessGuard } from "@/components/layout/page-access-guard";
import { getUserPermissions } from "@/lib/permissions/get-user-permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single();

  if (profile && profile.is_active === false) {
    redirect("/login?error=account_deactivated");
  }

  const { permissions, role, isAdmin } = await getUserPermissions(user.id, user.email);

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("id", true)
    .single();

  return (
    <PermissionsProvider permissions={permissions} role={role} isAdmin={isAdmin}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-700 selection:text-white">
        <Sidebar
          userEmail={user.email}
          userName={profile?.full_name || user.user_metadata?.full_name}
          userRole={role || "Staff"}
          userPermissions={permissions}
          isAdmin={isAdmin}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            storeName={settings?.store_name || "Solvexa Grocery Store"}
            currency={settings?.currency || "PKR"}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            <PageAccessGuard>{children}</PageAccessGuard>
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
