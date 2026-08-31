"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        const roleObj: any = profile?.role;
        const roleName = Array.isArray(roleObj) ? roleObj[0]?.name : roleObj?.name;
        setRole(roleName || null);

        if (profile?.role_id) {
          const { data: rolePerms } = await supabase
            .from("role_permissions")
            .select("permission:permissions(code)")
            .eq("role_id", profile.role_id);

          const codes =
            rolePerms?.map((rp: any) => rp.permission?.code).filter(Boolean) || [];
          setPermissions(codes);
        } else {
          // If first profile or Admin email, grant all
          if (user.email === "rohan@gmail.com") {
            const { data: allPerms } = await supabase.from("permissions").select("code");
            setPermissions(allPerms?.map((p) => p.code) || []);
            setRole("Admin");
          }
        }
      } catch (err) {
        console.error("Error loading permissions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, []);

  const hasPermission = (code: string) => {
    return role === "Admin" || permissions.includes(code);
  };

  return { permissions, role, loading, hasPermission };
}
