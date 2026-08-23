/**
 * Route Utilities for Web Application
 * Single Source of Truth for wizard route detection and navigation helpers.
 */

export function isWizardPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/post-ad") ||
    pathname.startsWith("/post-service") ||
    pathname.startsWith("/post-spare-part-listing") ||
    pathname.startsWith("/edit-ad") ||
    pathname.startsWith("/edit-service") ||
    pathname.startsWith("/edit-spare-part") ||
    pathname === "/account/business/apply"
  );
}
