"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePermissionsContext } from "@/lib/permissions/permissions-context";

export function usePermissions() {
  const serverContext = usePermissionsContext();
  const hasServerData =
    serverContext.permissions.length > 0 || serverContext.isAdmin || serverContext.role !== null;

  const [permissions, setPermissions] = useState<string[]>(serverContext.permissions);
  const [role, setRole] = useState<string | null>(serverContext.role);
  const [loading, setLoading] = useState(!hasServerData);

  useEffect(() => {
    if (hasServerData) {
      setPermissions(serverContext.permissions);
      setRole(serverContext.role);
      setLoading(false);
      return;
    }

    async function loadPermissions() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setPermissions([]);
          setRole(null);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role_id, role:roles(name)")
          .eq("id", user.id)
          .single();

        const roleObj = profile?.role as { name?: string } | { name?: string }[] | null;
        const roleName = Array.isArray(roleObj) ? roleObj[0]?.name : roleObj?.name;
        setRole(roleName || null);

        const isSuperAdmin = roleName === "Admin" || user.email === "rohan@gmail.com";

        if (isSuperAdmin) {
          const { data: allPerms } = await supabase.from("permissions").select("code");
          setPermissions(allPerms?.map((p) => p.code) || []);
          setRole("Admin");
        } else if (profile?.role_id) {
          const { data: rolePerms } = await supabase
            .from("role_permissions")
            .select("permission:permissions(code)")
            .eq("role_id", profile.role_id);

          const codes =
            rolePerms
              ?.map((rp) => {
                const perm = rp.permission as { code?: string } | { code?: string }[] | null;
                return Array.isArray(perm) ? perm[0]?.code : perm?.code;
              })
              .filter(Boolean) as string[] || [];
          setPermissions(codes);
        }
      } catch (err) {
        console.error("Error loading permissions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [hasServerData, serverContext.permissions, serverContext.role]);

  const hasPermission = (code: string) => {
    return role === "Admin" || serverContext.isAdmin || permissions.includes(code);
  };

  return { permissions, role, loading, hasPermission };
}
