import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CANONICAL_SLUG_MAPPING } from "@/lib/seo/canonicalSlugs";
import { isProtectedPath } from "@/config/protectedRoutes";
import { ADMIN_API_V1_BASE_PATH } from "@/lib/api/routes";
import logger from "@/lib/logger";
import { buildAuthCallbackUrl, buildLoginUrl } from "@/lib/authHelpers";

/**
 * Check whether an IP is allowed based on a comma-separated whitelist.
 * If no whitelist is provided, allow all IPs.
 */
function isIpAllowed(ip: string, allowedIps?: string): boolean {
    if (!allowedIps) return true;

    const allowed = allowedIps.split(",").map((item) => item.trim());
    return allowed.includes(ip) || ip === "127.0.0.1" || ip === "::1";
}


export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("esparex_auth")?.value;

    // 1) IP restriction for admin endpoints
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith(ADMIN_API_V1_BASE_PATH)) {
        const adminAllowedIps = process.env.ADMIN_ALLOWED_IPS;

        if (adminAllowedIps) {
            const forwardedFor = request.headers.get("x-forwarded-for");
            const realIp = forwardedFor
                ? forwardedFor.split(",")[0]?.trim() || "127.0.0.1"
                : "127.0.0.1";

            if (!isIpAllowed(realIp, adminAllowedIps)) {
                logger.warn(`[Security] Blocked access to ${pathname} from IP: ${realIp}`);

                return new NextResponse(
                    JSON.stringify({
                        error: "Access Denied",
                        message: "Your IP address is not authorized.",
                    }),
                    {
                        status: 403,
                        headers: { "Content-Type": "application/json" },
                    }
                );
            }
        }
    }

    // 2) SEO redirects (category aliases)
    if (pathname.startsWith("/category/")) {
        const segments = pathname.split("/");
        const slug = segments[2]?.toLowerCase();

        if (slug) {
            const canonical = CANONICAL_SLUG_MAPPING[slug];
            if (canonical && canonical !== slug) {
                const url = request.nextUrl.clone();
                url.pathname = `/category/${canonical}`;
                return NextResponse.redirect(url, 308);
            }
        }
    }

    // 3) Auth-protected routes
    const isProtectedRoute = isProtectedPath(pathname);

    if (isProtectedRoute && !token) {
        const callbackUrl = buildAuthCallbackUrl(pathname, request.nextUrl.search);
        const url = new URL(buildLoginUrl(callbackUrl), request.url);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static
         * - _next/image
         * - favicon.ico
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
