import { apiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";

export async function applySpotlightPromotion(
    listingId: string | number,
    durationDays: number
): Promise<void> {
    await apiClient.post(
        API_ROUTES.USER.LISTING_PROMOTE(String(listingId)),
        {
            days: durationDays,
            type: "spotlight_hp",
        },
        { silent: true }
    );
}
