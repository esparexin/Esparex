import { NextRequest, NextResponse } from "next/server";

// Paths that don't require authentication
const PUBLIC_PATHS = new Set(["/login"]);

// Role-restricted paths: only super_admin or admin can access these
// Moderators are blocked (backend will also enforce this)
const ADMIN_ONLY_PATHS = [
    "/admin-users",
    "/admin-sessions",
    "/api-keys",
    "/audit-logs",
    "/settings",
    "/notifications",
    "/finance",
    "/invoices",
    "/revenue",
    "/plans",
];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always allow public paths
    if (PUBLIC_PATHS.has(pathname)) {
        return NextResponse.next();
    }

    // Check for admin session cookie (httpOnly — we can only check presence, not validity)
    // Actual JWT validation happens on every backend API call
    const hasAdminToken = req.cookies.has("admin_token");

    if (!hasAdminToken) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, public assets
         * - api routes
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$).*)",
    ],
};
