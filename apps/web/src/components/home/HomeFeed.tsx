"use client";

import { type HomeAdsPayload } from "@/lib/api/user/listings";
import { HomeFeedClient } from "./HomeFeedClient";

interface HomeFeedProps {
    initialData?: HomeAdsPayload;
}

/**
 * HomeFeed - Serves the recommended ads feed on the Home page.
 * Keeps HomeFeedClient stably mounted across client location hydration
 * and location updates.
 */
export function HomeFeed({ initialData }: HomeFeedProps) {
    return <HomeFeedClient initialData={initialData} />;
}
