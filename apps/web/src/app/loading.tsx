// Root-level Suspense fallback.
// Returns null so Googlebot never indexes "Loading..." as page content.
// The real page content streams through once the server-side data fetches resolve.
export default function Loading() {
    return null;
}
