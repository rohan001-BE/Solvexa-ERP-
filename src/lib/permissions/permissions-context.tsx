"use client";

import { createContext, useContext } from "react";

interface PermissionsContextValue {
  permissions: string[];
  role: string | null;
  isAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: [],
  role: null,
  isAdmin: false,
});

export function PermissionsProvider({
  children,
  permissions,
  role,
  isAdmin,
}: PermissionsContextValue & { children: React.ReactNode }) {
  return (
    <PermissionsContext.Provider value={{ permissions, role, isAdmin }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  return useContext(PermissionsContext);
}
