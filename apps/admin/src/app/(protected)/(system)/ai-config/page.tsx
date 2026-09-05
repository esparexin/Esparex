"use client";

import { useEffect, useState, useCallback } from "react";
import { Cpu, ShieldCheck, Key, Save, CheckCircle, ChevronDown, ChevronUp, Stack, Grid } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import {
    AICapabilityRoutingTable,
    PROVIDER_MODELS,
    type CapabilityConfig,
    type ProviderConfig,
    type AiConfigData,
} from "@/components/system/ai/AICapabilityRoutingTable";
import { AITestingConsole } from "@/components/system/ai/AITestingConsole";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { showAdminPopup } from "@/lib/popup/popupEvents";

export default function AIConfigPage() {
    const [capabilities, setCapabilities] = useState<Record<string, CapabilityConfig>>({});
    const [providers, setProviders] = useState<Record<string, ProviderConfig>>({});
    const [expandedProvider, setExpandedProvider] = useState<string | null>("gemini");
    const [geminiKeyInput, setGeminiKeyInput] = useState("");
    const [openAiKeyInput, setOpenAiKeyInput] = useState("");
    const [claudeKeyInput, setClaudeKeyInput] = useState("");
    const [deepseekKeyInput, setDeepseekKeyInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminFetch<AiConfigData>(ADMIN_ROUTES.SYSTEM_AI_CONFIG);
            if (response?.data) {
                setCapabilities(response.data.capabilities || {});
                setProviders(response.data.providers || {});
            }
        } catch (err: unknown) {
            showAdminPopup({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to load AI configuration" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleCapabilityChange = (key: string, field: keyof CapabilityConfig, value: string | number) => {
        setCapabilities((prev) => {
            const current: CapabilityConfig = prev[key] || {
                provider: "gemini",
                model: "gemini-2.0-flash",
                temperature: 0.7,
                maxTokens: 200,
            };
            return {
                ...prev,
                [key]: {
                    ...current,
                    [field]: value,
                },
            };
        });
    };

    const handleProviderChange = (
        providerKey: string,
        field: keyof ProviderConfig,
        value: boolean | string
    ) => {
        setProviders((prev) => ({
            ...prev,
            [providerKey]: {
                ...prev[providerKey],
                enabled: prev[providerKey]?.enabled ?? false,
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                capabilities,
                providers: {
                    gemini: {
                        enabled: providers.gemini?.enabled,
                        defaultModel: providers.gemini?.defaultModel,
                        ...(geminiKeyInput.trim() ? { apiKey: geminiKeyInput.trim() } : {}),
                    },
                    openai: {
                        enabled: providers.openai?.enabled,
                        defaultModel: providers.openai?.defaultModel,
                        ...(openAiKeyInput.trim() ? { apiKey: openAiKeyInput.trim() } : {}),
                    },
                    claude: {
                        enabled: providers.claude?.enabled,
                        defaultModel: providers.claude?.defaultModel,
                        ...(claudeKeyInput.trim() ? { apiKey: claudeKeyInput.trim() } : {}),
                    },
                    deepseek: {
                        enabled: providers.deepseek?.enabled,
                        defaultModel: providers.deepseek?.defaultModel,
                        ...(deepseekKeyInput.trim() ? { apiKey: deepseekKeyInput.trim() } : {}),
                    },
                },
            };

            await adminFetch(ADMIN_ROUTES.SYSTEM_AI_CONFIG, {
                method: "PATCH",
                body: payload,
            });

            showAdminPopup({ type: "success", title: "Saved", message: "AI Configuration and routing rules saved" });
            setGeminiKeyInput("");
            setOpenAiKeyInput("");
            setClaudeKeyInput("");
            setDeepseekKeyInput("");
            fetchConfig();
        } catch (err: unknown) {
            showAdminPopup({ type: "error", title: "Error", message: err instanceof Error ? err.message : "Failed to save AI configuration" });
        } finally {
            setSaving(false);
        }
    };

    const activeDefaultProvider = capabilities.post_ad_title?.provider || "gemini";
    const activeDefaultModel = capabilities.post_ad_title?.model || "gemini-2.0-flash";
    const activeProviderName = activeDefaultProvider === "gemini" ? "Google Gemini" : activeDefaultProvider === "openai" ? "OpenAI" : activeDefaultProvider === "claude" ? "Anthropic Claude" : "DeepSeek AI";

    const enabledFallbacks = Object.entries(providers)
        .filter(([k, v]) => v.enabled && k !== activeDefaultProvider)
        .map(([k, v]) => ({
            name: k === "gemini" ? "Google Gemini" : k === "openai" ? "OpenAI" : k === "claude" ? "Anthropic Claude" : "DeepSeek AI",
            model: v.defaultModel || (k === "openai" ? "gpt-4o-mini" : k === "claude" ? "claude-3-5-haiku" : "gemini-2.0-flash")
        }));
    const fallbackDisplay = enabledFallbacks[0] ? `${enabledFallbacks[0].name} (${enabledFallbacks[0].model})` : "Automatic Failover Chain";

    if (loading) {
        return (
            <AdminPageShell
                title="AI Capability & Multi-Provider Settings"
                description="Manage AI providers, capability routing rules, API key encryption, and run live latency benchmarks."
                showGlobalSearch={false}
            >
                <div className="flex items-center justify-center p-12">
                    <span className="text-foreground-secondary text-body font-medium">Loading AI configuration...</span>
                </div>
            </AdminPageShell>
        );
    }

    return (
        <AdminPageShell
            title="AI Capability & Multi-Provider Settings"
            description="Manage AI providers, capability routing rules, API key encryption, and run live latency benchmarks."
            showGlobalSearch={false}
            actions={
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-body font-bold text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                >
                    <Save size={18} /> {saving ? "Saving..." : "Save AI Settings"}
                </button>
            }
        >
            <Stack direction="col" gap="lg">
                {/* KPI Header Grid */}
                <Grid cols={3} gap="sm">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <p className="text-tiny font-bold uppercase tracking-wider text-foreground-subtle">Encrypted Storage</p>
                            <p className="text-body font-bold text-foreground">AES-256-GCM At Rest</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <Cpu size={22} />
                        </div>
                        <div>
                            <p className="text-tiny font-bold uppercase tracking-wider text-foreground-subtle">Active Default Provider</p>
                            <p className="text-body font-bold text-foreground font-mono">{activeProviderName} ({activeDefaultModel})</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                            <Key size={22} />
                        </div>
                        <div>
                            <p className="text-tiny font-bold uppercase tracking-wider text-foreground-subtle">Fallback Provider</p>
                            <p className="text-body font-bold text-foreground font-mono">{fallbackDisplay}</p>
                        </div>
                    </div>
                </Grid>

                {/* Provider API Keys & Settings Accordion */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Key className="text-foreground-secondary" size={20} />
                            <div>
                                <h3 className="text-body font-bold text-foreground">AI Provider Accounts & API Keys</h3>
                                <p className="text-caption text-foreground-subtle">Configure provider state, default models, and encrypted API credentials</p>
                            </div>
                        </div>
                    </div>

                    <Stack direction="col" gap="sm">
                        {[
                            { id: "gemini", name: "Google Gemini", input: geminiKeyInput, setInput: setGeminiKeyInput, models: PROVIDER_MODELS.gemini, defaultM: "gemini-2.0-flash" },
                            { id: "openai", name: "OpenAI", input: openAiKeyInput, setInput: setOpenAiKeyInput, models: PROVIDER_MODELS.openai, defaultM: "gpt-4o-mini" },
                            { id: "claude", name: "Anthropic Claude", input: claudeKeyInput, setInput: setClaudeKeyInput, models: PROVIDER_MODELS.claude, defaultM: "claude-3-5-haiku-20241022" },
                            { id: "deepseek", name: "DeepSeek AI", input: deepseekKeyInput, setInput: setDeepseekKeyInput, models: PROVIDER_MODELS.deepseek, defaultM: "deepseek-chat" },
                        ].map((prov) => {
                            const isExpanded = expandedProvider === prov.id;
                            const provData: ProviderConfig = providers[prov.id] || { enabled: prov.id === "gemini" };

                            return (
                                <div
                                    key={prov.id}
                                    className="rounded-xl border border-border bg-muted/30 overflow-hidden transition-all shadow-2xs"
                                >
                                    {/* Accordion Header */}
                                    <div
                                        onClick={() => setExpandedProvider(isExpanded ? null : prov.id)}
                                        className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 cursor-pointer transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-body text-foreground">{prov.name}</span>
                                            {provData.hasKey && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-tiny font-bold text-emerald-700 border border-emerald-200">
                                                    <CheckCircle size={10} /> Key Configured
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <label
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-1.5 text-caption font-bold text-foreground-secondary cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={provData.enabled ?? (prov.id === "gemini")}
                                                    onChange={(e) => handleProviderChange(prov.id, "enabled", e.target.checked)}
                                                    className="rounded border-border text-primary focus:ring-primary"
                                                />
                                                Enabled
                                            </label>

                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground-secondary">
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accordion Collapsible Content Body */}
                                    {isExpanded && (
                                        <Stack direction="col" gap="md" className="p-4 border-t border-border bg-muted/40">
                                            <Grid cols={2} gap="sm">
                                                <div>
                                                    <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">
                                                        API Key (Masked: {provData.apiKeyMasked || "••••••••"})
                                                    </label>
                                                    <input
                                                        type="password"
                                                        placeholder="Enter new key to override..."
                                                        value={prov.input}
                                                        onChange={(e) => prov.setInput(e.target.value)}
                                                        className="w-full rounded-lg border border-border px-3 py-1.5 text-caption font-mono bg-card focus:border-primary focus:outline-none"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Default Model</label>
                                                    <select
                                                        value={provData.defaultModel || prov.defaultM}
                                                        onChange={(e) => handleProviderChange(prov.id, "defaultModel", e.target.value)}
                                                        className="w-full rounded-lg border border-border px-3 py-1.5 text-caption font-mono bg-card focus:border-primary focus:outline-none"
                                                    >
                                                        {prov.models.map((m) => (
                                                            <option key={m.value} value={m.value}>
                                                                {m.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </Grid>
                                        </Stack>
                                    )}
                                </div>
                            );
                        })}
                    </Stack>
                </div>

                {/* Capability Routing Table */}
                <AICapabilityRoutingTable
                    capabilities={capabilities}
                    onChange={handleCapabilityChange}
                />

                {/* AI Testing Console Sandbox */}
                <AITestingConsole />
            </Stack>
        </AdminPageShell>
    );
}
