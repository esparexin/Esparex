"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import type { AdminUser } from "@/types/admin";

type LoginInput = {
  email: string;
  password: string;
  twoFactorCode?: string;
};

type AdminAuthState = {
  admin: AdminUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

function normalizeAdmin(payload: unknown): AdminUser | null {
  if (!payload || typeof payload !== "object") return null;
  const item = payload as any;
  if (!item.id || !item.email || !item.role) return null;
  return {
    id: item.id,
    email: item.email,
    role: item.role,
    firstName: item.firstName,
    lastName: item.lastName,
    permissions: Array.isArray(item.permissions) ? item.permissions : []
  };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await adminFetch<unknown>(ADMIN_ROUTES.ME);
      const parsed = parseAdminResponse<never, { admin?: AdminUser }>(result);
      const nextAdmin = normalizeAdmin(parsed.data?.admin);
      setAdmin(nextAdmin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    setLoading(true);
    try {
      const result = await adminFetch<unknown>(ADMIN_ROUTES.LOGIN, {
        method: "POST",
        body: input
      });
      const parsed = parseAdminResponse<never, { admin?: AdminUser }>(result);
      const nextAdmin = normalizeAdmin(parsed.data?.admin);
      if (!nextAdmin) throw new Error("Login succeeded but admin profile could not be loaded. Please try again.");
      setAdmin(nextAdmin);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await adminFetch<never>(ADMIN_ROUTES.LOGOUT, { method: "POST" });
    } finally {
      setAdmin(null);
      setLoading(false);
    }
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({
      admin,
      loading,
      login,
      logout,
      refresh
    }),
    [admin, loading, login, logout, refresh]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
