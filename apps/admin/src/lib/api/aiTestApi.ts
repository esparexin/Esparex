import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { AiTestPayload } from "@esparex/contracts";

/**
 * Phase 3a (§5): the local `AiTestPayload` interface is relocated to
 * `@esparex/contracts` (canonical owner per DECISION-GATE §3) and re-exported
 * here so existing importers keep working. Deletion of this shim is Phase 4 (§10).
 */
export type { AiTestPayload };

export interface AiTestUsage {
    totalTokens?: number;
    promptTokens?: number;
    completionTokens?: number;
}

export interface AiTestResult {
    latencyMs: number;
    provider?: string;
    model?: string;
    usage?: AiTestUsage;
    rawPrompt?: string;
    output?: unknown;
    title?: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
}

export async function runAiCapabilityTest(payload: AiTestPayload): Promise<AiTestResult | null> {
    const response = await adminFetch<AiTestResult>(ADMIN_ROUTES.SYSTEM_AI_TEST, {
        method: "POST",
        body: payload,
    });
    return response?.data ?? null;
}
