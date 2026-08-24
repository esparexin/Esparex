import type { useRouter } from "next/navigation";
import type { User } from "@/types/User";
import { isAPIError } from "@/lib/api/APIError";
import { authApi } from "@/lib/api/auth";

export const AUTH_SESSION_STORAGE_KEY = "esparex_user_session";

export function isValidUser(data: unknown): data is User {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<User>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.mobile === "string" &&
    typeof candidate.role === "string"
  );
}

export function isBenignLogoutError(error: unknown): boolean {
  if (!isAPIError(error)) return false;

  if (error.status !== 401) return false;

  const backendMessage = String(
    error.context?.backendErrorMessage ??
      (typeof error.details === "object" && error.details !== null && "error" in error.details
        ? (error.details as { error?: unknown }).error
        : "") ??
      ""
  ).toLowerCase();

  return backendMessage.includes("no token") || error.message.toLowerCase().includes("no token");
}

export function replaceToHomeSafely(router: ReturnType<typeof useRouter>) {
  if (typeof window !== "undefined") {
    window.location.replace("/");
    return;
  }

  void router.push("/");
}

export function getDevUser(): User {
  return {
    id: "local-dev-user",
    name: "Local Dev User",
    email: "dev@localhost",
    mobile: "9999999999",
    role: "user",
    isPhoneVerified: true,
    businessStatus: "pending",
    createdAt: new Date().toISOString(),
  };
}

export async function cleanupUnauthorizedSession(router: ReturnType<typeof useRouter>, hadActiveSession: boolean) {
  try {
    await authApi.logout();
  } catch {
    // Ignore cleanup failures
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }

  if (hadActiveSession) {
    replaceToHomeSafely(router);
  }
}
