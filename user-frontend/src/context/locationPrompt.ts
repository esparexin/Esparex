import type { AppLocation } from "@/types/location";

type LocationStatus = "detecting" | "available" | "manual" | "unavailable";

export function shouldShowLocationFirstVisitPrompt(params: {
    status: LocationStatus;
    source: AppLocation["source"];
    promptDismissed: boolean;
    isPermissionBlocked: boolean;
    promptDelayElapsed: boolean;
}) {
    return (
        params.status !== "detecting" &&
        params.source === "default" &&
        !params.promptDismissed &&
        !params.isPermissionBlocked &&
        params.promptDelayElapsed
    );
}
