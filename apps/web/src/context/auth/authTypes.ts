import type { User } from "@/types/User";

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "authenticated";

export interface AuthStatusContextType {
  status: AuthStatus;
  isAuthResolved: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  logout: (options?: { skipServerLogout?: boolean }) => Promise<void>;
}

export interface AuthUserContextType {
  user: User | null;
  updateUser: (user: User) => void;
}

export interface AuthContextType extends AuthStatusContextType, AuthUserContextType {}

export interface BackendReadyContextType {
  backendReady: boolean;
}
