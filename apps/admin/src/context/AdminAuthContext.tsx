"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AdminApiError, AdminNetworkError, adminFetch, setAdminAccessToken, fetchCsrfToken } from "@/lib/api/adminClient";
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
  error: AdminNetworkError | null;
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
  const [state, setState] = useState<{
    admin: AdminUser | null;
    loading: boolean;
    error: AdminNetworkError | null;
  }>({
    admin: null,
    loading: true,
    error: null
  });
  const authRequestSeq = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++authRequestSeq.current;
    try {
      try {
        await fetchCsrfToken();
      } catch {
        // ignored
      }

      const result = await adminFetch<unknown>(ADMIN_ROUTES.ME);
      const parsed = parseAdminResponse<never, { admin?: AdminUser }>(result);
      const nextAdmin = normalizeAdmin(parsed.data?.admin);
      
      if (requestId === authRequestSeq.current) {
        setState({ admin: nextAdmin, loading: false, error: null });
      }
    } catch (err: any) {
      if (requestId === authRequestSeq.current) {
        const isAuthFailure = (err instanceof AdminApiError && (err.status === 401 || err.status === 403)) ||
                             (err && typeof err === 'object' && 'status' in err && (err['status'] === 401 || err['status'] === 403));
        
        if (isAuthFailure) {
          setAdminAccessToken(null);
          setState({ admin: null, loading: false, error: null });
        } else {
          const message = err instanceof Error ? err.message : String(err);
          const networkError = err instanceof AdminNetworkError ? err : new AdminNetworkError(message, err);
          setState(prev => ({ ...prev, loading: false, error: networkError }));
          console.warn("[AdminAuth] Refresh failed. Preserving session state.", message);
        }
      }
    }
  }, []);



  useEffect(() => {
    void (async () => { await refresh(); })();
  }, [refresh]);

  const login = useCallback(async (input: LoginInput) => {
    const requestId = ++authRequestSeq.current;
    setState(prev => ({ ...prev, loading: true, error: null }));
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

      if (!nextAdmin) throw new Error("Login succeeded but admin profile could not be loaded.");
      
      if (requestId === authRequestSeq.current) {
        setState({ admin: nextAdmin, loading: false, error: null });
      }
    } catch (error) {
      setAdminAccessToken(null);
      if (requestId === authRequestSeq.current) {
        setState(prev => ({ ...prev, loading: false, error: null }));
      }
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const requestId = ++authRequestSeq.current;
    setState(prev => ({ ...prev, loading: true }));
    try {
      await adminFetch<never>(ADMIN_ROUTES.LOGOUT, { method: "POST" });
    } finally {
      setAdminAccessToken(null);
      if (requestId === authRequestSeq.current) {
        setState({ admin: null, loading: false, error: null });
      }
    }
  }, []);

  const value = useMemo<AdminAuthState>(
    () => ({
      admin: state.admin,
      loading: state.loading,
      error: state.error,
      login,
      logout,
      refresh
    }),
    [state.admin, state.loading, state.error, login, logout, refresh]
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
