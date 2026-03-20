"use client";

import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/User";

export interface UseCurrentUserResult {
    user: User | null;
    loading: boolean;
    error: Error | null;
    refreshUser: () => Promise<void>;
    updateUser: (user: User) => void;
    logout: () => Promise<void>;
    status: "loading" | "authenticated" | "unauthenticated";
}

export function useCurrentUser(): UseCurrentUserResult {
    const {
        user,
        status,
        error,
        refreshUser,
        updateUser,
        logout,
    } = useAuth();

    return {
        user,
        loading: status === "loading",
        error: error ?? null,
        refreshUser,
        updateUser,
        logout,
        status,
    };
}
