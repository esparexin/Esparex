/**
 * Canonical SEO Host & URL Resolution (Single Source of Truth)
 * Enforces https://esparex.in as the sole canonical public SEO origin.
 */

export const CANONICAL_ORIGIN = "https://esparex.in";

/**
 * Resolves a path or route to an absolute canonical URL on the authoritative public host.
 * Trailing slashes are stripped (except for the root path "/").
 */
export function toCanonicalUrl(pathnameOrPath: string): string {
  if (!pathnameOrPath || pathnameOrPath === "/" || pathnameOrPath === "") {
    return CANONICAL_ORIGIN;
  }
  const cleanPath = pathnameOrPath.startsWith("/")
    ? pathnameOrPath
    : `/${pathnameOrPath}`;
  // Strip redundant trailing slash if present
  const normalized = cleanPath.length > 1 && cleanPath.endsWith("/")
    ? cleanPath.slice(0, -1)
    : cleanPath;
  return `${CANONICAL_ORIGIN}${normalized}`;
}

