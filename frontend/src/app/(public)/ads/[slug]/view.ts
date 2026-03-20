'use server';

import { headers } from "next/headers";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/api/routes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

export async function trackView(adId: string) {
    const headersList = await headers();
    const ua = headersList.get("user-agent") || "";

    const isBot = /bot|crawler|spider|crawling/i.test(ua);
    if (isBot) return;

    try {
        await fetch(`${API_URL}/${API_ROUTES.USER.AD_VIEW(adId)}`, {
            method: 'GET',
            cache: 'no-store', // Force request to reach backend to trigger view increment
            headers: {
                'User-Agent': ua // Pass through UA if needed by backend (though we filter here)
            }
        });
    } catch {
        // ignore
    }
}
