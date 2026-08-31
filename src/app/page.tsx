import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPermissions } from "@/lib/permissions/get-user-permissions";
import { getDefaultRoute } from "@/lib/permissions/route-permissions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { permissions, isAdmin } = await getUserPermissions(user.id, user.email);
    redirect(getDefaultRoute(permissions, isAdmin));
  } else {
    redirect("/login");
  }
}
