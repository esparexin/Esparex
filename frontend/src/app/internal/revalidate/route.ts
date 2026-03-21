import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

type RevalidatePayload = {
    tag?: string;
    path?: string;
    secret?: string;
};

const resolveSecret = () =>
    process.env.INTERNAL_REVALIDATE_SECRET ||
    process.env.REVALIDATE_SECRET ||
    "";

const isAuthorized = (request: NextRequest, payload: RevalidatePayload) => {
    const configuredSecret = resolveSecret();
    if (!configuredSecret) {
        return process.env.NODE_ENV !== "production";
    }

    const headerSecret = request.headers.get("x-revalidate-secret") || "";
    return headerSecret === configuredSecret || payload.secret === configuredSecret;
};

export async function POST(request: NextRequest) {
    let payload: RevalidatePayload = {};

    try {
        payload = (await request.json()) as RevalidatePayload;
    } catch {
        payload = {};
    }

    if (!isAuthorized(request, payload)) {
        return NextResponse.json(
            { success: false, message: "Unauthorized revalidation request" },
            { status: 401 }
        );
    }

    const tag = typeof payload.tag === "string" && payload.tag.trim().length > 0
        ? payload.tag.trim()
        : undefined;
    const path = typeof payload.path === "string" && payload.path.trim().length > 0
        ? payload.path.trim()
        : "/";

    if (tag) {
        revalidateTag(tag, "max");
    }
    revalidatePath(path);

    return NextResponse.json({
        success: true,
        revalidated: true,
        tag: tag || null,
        path,
    });
}
