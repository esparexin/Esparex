import type { AppLocation } from "@/types/location";

type LocationStatus = "unknown" | "checking" | "prompt" | "granted" | "denied" | "manual_selection";

export function shouldShowLocationFirstVisitPrompt(params: {
    status: LocationStatus;
    source: AppLocation["source"];
    promptDismissed: boolean;
    isPermissionBlocked: boolean;
    promptDelayElapsed: boolean;
}) {
    // Only show prompt if status is explicitly "prompt" (which is set after delay if unknown)
    // or if it was unknown/checking and we need to prompt.
    // The state machine makes this much simpler now.
    return (
        params.status === "prompt" &&
        !params.promptDismissed &&
        params.source === "default"
    );
}
