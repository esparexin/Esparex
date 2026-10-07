import { Request, Response } from "express";
import { getSystemConfigDoc } from "@esparex/core";
import { updateSystemConfigSections, SystemConfigValidationError } from "@esparex/core";
import { encryptApiKey, maskApiKey } from "@esparex/core";
import { AIProviderFactory } from "@esparex/core";
import { generateListingPromptV1, identifyDevicePromptV1 } from "@esparex/core";
import { logAdminActionDirect } from "@esparex/core";
import { logger } from "@esparex/core";
import { z } from "zod";

export const getAiConfig = async (req: Request, res: Response) => {
    try {
        const doc = await getSystemConfigDoc();
        const capabilities = doc?.ai?.capabilities;
        const providers = doc?.ai?.providers;

        const responseData = {
            capabilities: capabilities || {
                post_ad_title: { provider: "gemini", model: "gemini-2.0-flash", temperature: 0.7, maxTokens: 200 },
                post_ad_description: { provider: "gemini", model: "gemini-2.0-flash", temperature: 0.7, maxTokens: 1000 },
                device_identification: { provider: "gemini", model: "gemini-2.0-flash", temperature: 0.2, maxTokens: 300 },
                content_moderation: { provider: "gemini", model: "gemini-2.0-flash", temperature: 0.1, maxTokens: 200 },
                spam_detection: { provider: "gemini", model: "gemini-2.0-flash", temperature: 0.1, maxTokens: 200 },
            },
            providers: {
                gemini: {
                    enabled: providers?.gemini?.enabled ?? true,
                    apiKeyMasked: maskApiKey(providers?.gemini?.apiKeyEncrypted || process.env.GEMINI_API_KEY || ""),
                    hasKey: Boolean(providers?.gemini?.apiKeyEncrypted || process.env.GEMINI_API_KEY),
                    defaultModel: providers?.gemini?.defaultModel || "gemini-2.0-flash",
                },
                openai: {
                    enabled: providers?.openai?.enabled ?? false,
                    apiKeyMasked: maskApiKey(providers?.openai?.apiKeyEncrypted || process.env.OPENAI_API_KEY || ""),
                    hasKey: Boolean(providers?.openai?.apiKeyEncrypted || process.env.OPENAI_API_KEY),
                    defaultModel: providers?.openai?.defaultModel || "gpt-4o-mini",
                },
                claude: {
                    enabled: providers?.claude?.enabled ?? false,
                    apiKeyMasked: maskApiKey(providers?.claude?.apiKeyEncrypted || process.env.CLAUDE_API_KEY || ""),
                    hasKey: Boolean(providers?.claude?.apiKeyEncrypted || process.env.CLAUDE_API_KEY),
                    defaultModel: providers?.claude?.defaultModel || "claude-3-5-haiku-20241022",
                },
                deepseek: {
                    enabled: providers?.deepseek?.enabled ?? false,
                    apiKeyMasked: maskApiKey(providers?.deepseek?.apiKeyEncrypted || process.env.DEEPSEEK_API_KEY || ""),
                    hasKey: Boolean(providers?.deepseek?.apiKeyEncrypted || process.env.DEEPSEEK_API_KEY),
                    defaultModel: providers?.deepseek?.defaultModel || "deepseek-chat",
                },
            },
        };

        res.json({ success: true, data: responseData });
    } catch (err: unknown) {
        logger.error("[adminAiConfigController] getAiConfig error", { error: err });
        res.status(500).json({ success: false, error: "Failed to fetch AI configuration" });
    }
};

const PROVIDER_DEFAULT_MODELS = {
    gemini: "gemini-2.0-flash",
    openai: "gpt-4o-mini",
    claude: "claude-3-5-haiku-20241022",
    deepseek: "deepseek-chat",
} as const;

type ProviderName = keyof typeof PROVIDER_DEFAULT_MODELS;

type ProviderIncoming = { enabled?: unknown; defaultModel?: string; apiKey?: string };
type ProviderExisting = { defaultModel?: string; apiKeyEncrypted?: string };

/** Shape one provider's persisted settings; preserves the stored encrypted key when no new key is supplied. */
const buildProviderPatch = (
    incoming: ProviderIncoming | undefined,
    existing: ProviderExisting | undefined,
    fallbackModel: string
) =>
    incoming
        ? {
              enabled: Boolean(incoming.enabled),
              defaultModel: incoming.defaultModel || fallbackModel,
              apiKeyEncrypted: incoming.apiKey ? encryptApiKey(incoming.apiKey) : existing?.apiKeyEncrypted,
          }
        : undefined;

export const updateAiConfig = async (req: Request, res: Response) => {
    try {
        const doc = await getSystemConfigDoc();
        if (!doc) {
            res.status(500).json({ success: false, error: "SystemConfig initialization failed" });
            return;
        }

        const { capabilities, providers } = req.body || {};

        // Phase 3b: persist via the SystemConfig core service (was doc.save() on
        // the plain object returned by getSystemConfigDoc). Merge logic unchanged.
        // Empty patches are rejected by the service (400 via SystemConfigValidationError).
        const aiPatch: Record<string, unknown> = {};

        if (capabilities) {
            aiPatch.capabilities = { ...(doc.ai?.capabilities || {}), ...capabilities };
        }

        if (providers) {
            const existingProviders = (doc.ai?.providers || {}) as Record<ProviderName, { defaultModel?: string; apiKeyEncrypted?: string } | undefined>;
            const updatedProviders: Record<string, unknown> = { ...existingProviders };
            (Object.keys(PROVIDER_DEFAULT_MODELS) as ProviderName[]).forEach((name) => {
                const patched = buildProviderPatch(providers[name], existingProviders[name], PROVIDER_DEFAULT_MODELS[name]);
                if (patched) updatedProviders[name] = patched;
            });
            aiPatch.providers = updatedProviders;
        }

        await updateSystemConfigSections({ ai: aiPatch }, req.user?.id);

        if (req.user?.id) {
            await logAdminActionDirect(
                req.user.id,
                "update_ai_config",
                "Config",
                "global_ai_config",
                { updatedCapabilities: Boolean(capabilities), updatedProviders: Boolean(providers) },
                req.ip || "",
                req.get("user-agent") || ""
            );
        }

        res.json({ success: true, message: "AI Configuration updated successfully" });
    } catch (err: unknown) {
        logger.error("[adminAiConfigController] updateAiConfig error", { error: err });
        if (err instanceof SystemConfigValidationError) {
            res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
            return;
        }
        res.status(500).json({ success: false, error: "Failed to update AI configuration" });
    }
};

export const testAiProvider = async (req: Request, res: Response) => {
    try {
        const { providerName = "gemini", capability = "post_ad_title", brand = "Apple", model = "iPhone 15 Pro", condition = "Good" } = req.body || {};

        const t0 = Date.now();
        const provider = AIProviderFactory.create(providerName);
        let prompt = "";
        let schema: z.ZodTypeAny;

        if (capability === "device_identification") {
            prompt = identifyDevicePromptV1(`${brand} ${model}`);
            schema = z.object({ brand: z.string(), model: z.string(), confidence: z.number().optional() });
        } else {
            prompt = generateListingPromptV1({ brand, model, condition, category: "Mobiles" });
            schema = z.object({ title: z.string(), description: z.string() });
        }

        const result = await provider.generateStructured(prompt, schema, { timeoutMs: 15000 });
        const totalMs = Date.now() - t0;

        res.json({
            success: true,
            data: {
                provider: result.provider,
                model: result.model,
                rawPrompt: prompt,
                output: result.data,
                latencyMs: result.latency,
                totalMs,
                usage: result.usage || { promptTokens: 45, completionTokens: 60, totalTokens: 105 },
            },
        });
    } catch (err: unknown) {
        logger.error("[adminAiConfigController] testAiProvider error", { error: err });
        res.status(502).json({
            success: false,
            error: err instanceof Error ? err.message : "AI Provider test execution failed",
        });
    }
};
