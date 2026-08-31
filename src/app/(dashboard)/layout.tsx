import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

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

  // Fetch profile and role details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, role:roles(*)")
    .eq("id", user.id)
    .single();

  // Fetch role permissions
  let permissions: string[] = [];
  
  if (profile?.role_id) {
    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select("permission:permissions(code)")
      .eq("role_id", profile.role_id);
      
    if (rolePerms) {
      permissions = rolePerms
        .map((rp: any) => rp.permission?.code)
        .filter(Boolean);
    }
  } else {
    // If no role assigned yet or role is empty, check if first user (Admin)
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    if (count === 1) {
      const { data: allPerms } = await supabase.from("permissions").select("code");
      permissions = allPerms?.map(p => p.code) || [];
    }
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("id", true)
    .single();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-700 selection:text-white">
      {/* Fixed Sidebar */}
      <Sidebar
        userEmail={user.email}
        userName={profile?.full_name || user.user_metadata?.full_name}
        userRole={profile?.role?.name || "Admin"}
        userPermissions={permissions}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          storeName={settings?.store_name || "Solvexa Grocery Store"}
          currency={settings?.currency || "PKR"}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
