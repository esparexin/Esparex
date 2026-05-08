"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AdminApiError, adminFetch, setAdminAccessToken, fetchCsrfToken } from "@/lib/api/adminClient";
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
  const item = payload as Record<string, unknown>;
  const id = item.id || item._id;
  if (!id || typeof item.email !== "string" || typeof item.role !== "string") return null;
  return {
    id: String(id),
    email: item.email,
    role: item.role,
    firstName: typeof item.firstName === "string" ? item.firstName : undefined,
    lastName: typeof item.lastName === "string" ? item.lastName : undefined,
    permissions: Array.isArray(item.permissions) ? item.permissions.filter((p): p is string => typeof p === "string") : []
  };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const authRequestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++authRequestSeq.current;
    try {
      // 1. Force CSRF token pre-fetch first so cookies are initialized & matching on subsequent state-changing requests
      await fetchCsrfToken().catch((err) => {
        console.error("[AdminAuth] CSRF bootstrap token failed:", err);
      });

      // 2. Safely call the authenticated /me endpoint
      const result = await adminFetch<unknown>(ADMIN_ROUTES.ME);
      const parsed = parseAdminResponse<never, { admin?: AdminUser }>(result);
      const nextAdmin = normalizeAdmin(parsed.data?.admin);
      if (requestId === authRequestSeq.current) {
        setAdmin(nextAdmin);
      }
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        setAdminAccessToken(null);
      }
      if (requestId === authRequestSeq.current) {
        setAdmin(null);
      }
    } finally {
      if (requestId === authRequestSeq.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void (async () => { await refresh(); })();
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const requestId = ++authRequestSeq.current;
    setLoading(true);
    try {
      const result = await adminFetch<unknown>(ADMIN_ROUTES.LOGIN, {
        method: "POST",
        body: input
      });
      const parsed = parseAdminResponse<never, { admin?: AdminUser; accessToken?: string }>(result);
      const accessToken = typeof parsed.data?.accessToken === "string" ? parsed.data.accessToken : null;
      setAdminAccessToken(accessToken);

      let nextAdmin = normalizeAdmin(parsed.data?.admin);
      if (!nextAdmin) {
        const meResult = await adminFetch<unknown>(ADMIN_ROUTES.ME);
        const meParsed = parseAdminResponse<never, { admin?: AdminUser }>(meResult);
        nextAdmin = normalizeAdmin(meParsed.data?.admin);
      }

      if (!nextAdmin) throw new Error("Login succeeded but admin profile could not be loaded. Please try again.");
      if (requestId === authRequestSeq.current) {
        setAdmin(nextAdmin);
      }
    } catch (error) {
      setAdminAccessToken(null);
      throw error;
    } finally {
      if (requestId === authRequestSeq.current) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    const requestId = ++authRequestSeq.current;
    setLoading(true);
    try {
      await adminFetch<never>(ADMIN_ROUTES.LOGOUT, { method: "POST" });
    } finally {
      setAdminAccessToken(null);
      if (requestId === authRequestSeq.current) {
        setAdmin(null);
        setLoading(false);
      }
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
