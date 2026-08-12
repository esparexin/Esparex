import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";

export interface AiTestPayload {
    providerName: string;
    capability: string;
    brand: string;
    model: string;
    condition: string;
}

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
        body: JSON.stringify(payload),
    });
    return response?.data ?? null;
}
