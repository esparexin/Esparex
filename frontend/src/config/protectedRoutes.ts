import {
  type UserPage,
  PROTECTED_ROUTE_PREFIXES as CANONICAL_PROTECTED_ROUTE_PREFIXES,
  PROTECTED_USER_PAGE_KEYS as CANONICAL_PROTECTED_USER_PAGE_KEYS,
  isProtectedPath as isCanonicalProtectedPath,
  isProtectedUserPage as isCanonicalProtectedUserPage,
} from "@/lib/routeUtils";

export const PROTECTED_ROUTE_PREFIXES = CANONICAL_PROTECTED_ROUTE_PREFIXES;
export const PROTECTED_USER_PAGE_KEYS = CANONICAL_PROTECTED_USER_PAGE_KEYS;

export const isProtectedPath = (pathname: string): boolean => {
  return isCanonicalProtectedPath(pathname);
};

export const isProtectedUserPage = (page?: UserPage | string): boolean => {
  if (!page) return false;
  return isCanonicalProtectedUserPage(page as UserPage);
};
