import { NextRequest, NextResponse } from "next/server";

// Paths that don't require authentication
const PUBLIC_PATHS = new Set(["/login"]);

const getApiHostname = (): string | null => {
    const raw = process.env.NEXT_PUBLIC_ADMIN_API_URL;
    if (!raw) return null;
    try {
        return new URL(raw).hostname;
    } catch {
        return null;
    }
};

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always allow public paths
    if (PUBLIC_PATHS.has(pathname)) {
        return NextResponse.next();
    }

    // Best-effort cookie gate only when the admin app and API share the same host.
    // In split-subdomain deployments (admin.esparex.in -> api.esparex.in),
    // host-only admin_token cookies are not visible to this middleware.
    const apiHostname = getApiHostname();
    const canReliablyReadAdminCookie = !apiHostname || apiHostname === req.nextUrl.hostname;
    const hasAdminToken = req.cookies.has("admin_token");

    if (canReliablyReadAdminCookie && !hasAdminToken) {
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
