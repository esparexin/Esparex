import { Request, Response } from "express";
import { getSystemConfigDoc } from "@esparex/core/utils/systemConfigHelper";
import { encryptApiKey, maskApiKey } from "@esparex/core/utils/aiEncryption";
import { AIProviderFactory } from "@esparex/core/services/ai/AIProviderFactory";
import { generateListingPromptV1, identifyDevicePromptV1 } from "@esparex/core/prompts/listings/v1";
import { logAdminActionDirect } from "@esparex/core/utils/adminLogger";
import logger from "@esparex/core/utils/logger";
import { z } from "zod";

export const getAiConfig = async (req: Request, res: Response) => {
    try {
        const doc = await getSystemConfigDoc();
        const dbAi = doc?.ai || ({} as any);

        const responseData = {
            capabilities: dbAi.capabilities || {
                post_ad_title: { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.7, maxTokens: 200 },
                post_ad_description: { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.7, maxTokens: 1000 },
                device_identification: { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.2, maxTokens: 300 },
                content_moderation: { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.1, maxTokens: 200 },
                spam_detection: { provider: "gemini", model: "gemini-2.5-flash", temperature: 0.1, maxTokens: 200 },
            },
            providers: {
                gemini: {
                    enabled: dbAi.providers?.gemini?.enabled ?? true,
                    apiKeyMasked: maskApiKey(dbAi.providers?.gemini?.apiKeyEncrypted || process.env.GEMINI_API_KEY || ""),
                    hasKey: Boolean(dbAi.providers?.gemini?.apiKeyEncrypted || process.env.GEMINI_API_KEY),
                    defaultModel: dbAi.providers?.gemini?.defaultModel || "gemini-2.5-flash",
                },
                openai: {
                    enabled: dbAi.providers?.openai?.enabled ?? false,
                    apiKeyMasked: maskApiKey(dbAi.providers?.openai?.apiKeyEncrypted || process.env.OPENAI_API_KEY || ""),
                    hasKey: Boolean(dbAi.providers?.openai?.apiKeyEncrypted || process.env.OPENAI_API_KEY),
                    defaultModel: dbAi.providers?.openai?.defaultModel || "gpt-4o-mini",
                },
            },
        };

        res.json({ success: true, data: responseData });
    } catch (err: unknown) {
        logger.error("[adminAiConfigController] getAiConfig error", { error: err });
        res.status(500).json({ success: false, error: "Failed to fetch AI configuration" });
    }
};

export const updateAiConfig = async (req: Request, res: Response) => {
    try {
        const doc = await getSystemConfigDoc();
        if (!doc) {
            res.status(500).json({ success: false, error: "SystemConfig initialization failed" });
            return;
        }

        const { capabilities, providers } = req.body || {};

        if (capabilities) {
            doc.ai.capabilities = { ...doc.ai.capabilities, ...capabilities };
        }

        if (providers) {
            const updatedProviders: any = doc.ai.providers || {};
            if (providers.gemini) {
                updatedProviders.gemini = {
                    enabled: Boolean(providers.gemini.enabled),
                    defaultModel: providers.gemini.defaultModel || "gemini-2.5-flash",
                    apiKeyEncrypted: providers.gemini.apiKey
                        ? encryptApiKey(providers.gemini.apiKey)
                        : updatedProviders.gemini?.apiKeyEncrypted,
                };
            }
            if (providers.openai) {
                updatedProviders.openai = {
                    enabled: Boolean(providers.openai.enabled),
                    defaultModel: providers.openai.defaultModel || "gpt-4o-mini",
                    apiKeyEncrypted: providers.openai.apiKey
                        ? encryptApiKey(providers.openai.apiKey)
                        : updatedProviders.openai?.apiKeyEncrypted,
                };
            }
            doc.ai.providers = updatedProviders;
        }

        doc.updatedAt = new Date();
        if (req.user?.id) doc.updatedBy = req.user.id;
        await doc.save();

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
        res.status(500).json({ success: false, error: "Failed to update AI configuration" });
    }
};

export const testAiProvider = async (req: Request, res: Response) => {
    try {
        const { providerName = "gemini", capability = "post_ad_title", brand = "Apple", model = "iPhone 15 Pro", condition = "Good" } = req.body || {};

        const t0 = Date.now();
        const provider = AIProviderFactory.create(providerName);
        let prompt = "";
        let schema = z.object({}) as any;

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
