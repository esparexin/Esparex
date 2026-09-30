"use client";

import { type HomeAdsPayload } from "@/lib/api/user/listings";
import { HomeFeedClient } from "./HomeFeedClient";

interface HomeFeedProps {
    initialData?: HomeAdsPayload;
    initialLocationIdentity?: string;
}

/**
 * HomeFeed - Serves the marketplace listing feed on the Home page.
 * Keeps HomeFeedClient stably mounted across client location hydration
 * and location updates.
 */
export function HomeFeed({ initialData, initialLocationIdentity }: HomeFeedProps) {
    return <HomeFeedClient initialData={initialData} initialLocationIdentity={initialLocationIdentity} />;
}
