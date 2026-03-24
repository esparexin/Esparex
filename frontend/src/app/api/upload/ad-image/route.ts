import { NextResponse } from "next/server";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

export const runtime = "nodejs";

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`
).replace(/\/$/, "");

const ALLOWED_FOLDERS = new Set(["ads", "businesses", "profiles", "documents", "services"]);

const normalizeFolder = (folder: string, options: { adId?: string } = {}): string => {
    if (folder === "ads" && !options.adId) return "staging";
    if (folder === "profiles") return "avatars";
    if (folder === "services") return "service";
    if (folder === "businesses") return "business";
    return folder;
};

const toDataUrl = async (file: File): Promise<string> => {
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
};

export async function POST(req: Request) {
    try {
        const incoming = await req.formData();
        const file = incoming.get("image") || incoming.get("file");
        const folder = String(incoming.get("folder") || "ads").trim().toLowerCase();
        const adId = String(incoming.get("adId") || "").trim();
        const businessId = String(incoming.get("businessId") || "").trim();
        const serviceId = String(incoming.get("serviceId") || "").trim();

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Invalid file request" }, { status: 400 });
        }

        if (!ALLOWED_FOLDERS.has(folder)) {
            return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
        }
        if (folder === "documents") {
            return NextResponse.json({ error: "Document uploads are not supported by this route" }, { status: 400 });
        }

        const cookie = req.headers.get("cookie") || "";

        if (folder === "ads" && adId) {
            const response = await fetch(`${API_BASE_URL}/${API_ROUTES.USER.ADS_UPLOAD_IMAGE}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(cookie ? { cookie } : {}),
                },
                body: JSON.stringify({
                    adId,
                    image: await toDataUrl(file),
                }),
                cache: "no-store",
            });

            const payload = await response.json().catch(() => ({}));
            const url = payload?.data?.url;
            if (!response.ok || typeof url !== "string") {
                return NextResponse.json(
                    { error: payload?.message || payload?.error || "Upload failed" },
                    { status: response.status || 500 }
                );
            }

            return NextResponse.json({ success: true, url });
        }

        const forward = new FormData();
        forward.set("file", file);
        forward.set("folder", normalizeFolder(folder, { adId }));
        if (adId) forward.set("adId", adId);
        if (businessId) forward.set("businessId", businessId);
        if (serviceId) forward.set("serviceId", serviceId);

        const response = await fetch(`${API_BASE_URL}/${API_ROUTES.USER.BUSINESSES_UPLOAD}`, {
            method: "POST",
            headers: cookie ? { cookie } : undefined,
            body: forward,
            cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        const url = payload?.data?.url;
        if (!response.ok || typeof url !== "string") {
            return NextResponse.json(
                { error: payload?.message || payload?.error || "Upload failed" },
                { status: response.status || 500 }
            );
        }

        return NextResponse.json({ success: true, url });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Internal server error during upload";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
