"use client";

import { useEffect, useState, useCallback } from "react";
import { Cpu, ShieldCheck, Key, Save, CheckCircle } from "@esparex/ui";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AICapabilityRoutingTable, PROVIDER_MODELS } from "@/components/system/ai/AICapabilityRoutingTable";
import { AITestingConsole } from "@/components/system/ai/AITestingConsole";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { showAdminPopup } from "@/lib/popup/popupEvents";

export default function AIConfigPage() {
    const [capabilities, setCapabilities] = useState<any>({});
    const [providers, setProviders] = useState<any>({});
    const [geminiKeyInput, setGeminiKeyInput] = useState("");
    const [openAiKeyInput, setOpenAiKeyInput] = useState("");
    const [claudeKeyInput, setClaudeKeyInput] = useState("");
    const [deepseekKeyInput, setDeepseekKeyInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminFetch<any>(ADMIN_ROUTES.SYSTEM_AI_CONFIG);
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

    const handleCapabilityChange = (key: string, field: string, value: string | number) => {
        setCapabilities((prev: any) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }));
    };

    const handleProviderChange = (providerKey: string, field: string, value: any) => {
        setProviders((prev: any) => ({
            ...prev,
            [providerKey]: {
                ...prev[providerKey],
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: any = {
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
                body: JSON.stringify(payload),
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
                    className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-sky-700 disabled:opacity-50 transition-all active:scale-95"
                >
                    <Save size={18} /> {saving ? "Saving..." : "Save AI Settings"}
                </button>
            }
        >
            <div className="space-y-6">
                {/* KPI Header Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <p className="text-tiny font-bold uppercase tracking-wider text-slate-500">Encrypted Storage</p>
                            <p className="text-sm font-bold text-slate-900">AES-256-GCM At Rest</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-100 shrink-0">
                            <Cpu size={22} />
                        </div>
                        <div>
                            <p className="text-tiny font-bold uppercase tracking-wider text-slate-500">Active Default Provider</p>
                            <p className="text-sm font-bold text-slate-900 font-mono">Google Gemini (Flash)</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                            <Key size={22} />
                        </div>
                        <div>
                            <p className="text-tiny font-bold uppercase tracking-wider text-slate-500">Fallback Provider</p>
                            <p className="text-sm font-bold text-slate-900 font-mono">OpenAI (GPT-4o-mini)</p>
                        </div>
                    </div>
                </div>

                {/* Provider API Keys & Settings */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2.5">
                        <Key className="text-slate-700" size={20} />
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">AI Provider Accounts & API Keys</h3>
                            <p className="text-xs text-slate-500">Configure provider state, default models, and encrypted API credentials</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Google Gemini Card */}
                        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">Google Gemini</span>
                                    {providers.gemini?.hasKey && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-tiny font-bold text-emerald-700">
                                            <CheckCircle size={10} /> Key Configured
                                        </span>
                                    )}
                                </div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={providers.gemini?.enabled ?? true}
                                        onChange={(e) => handleProviderChange("gemini", "enabled", e.target.checked)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Enabled
                                </label>
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    API Key (Masked: {providers.gemini?.apiKeyMasked || "••••••••"})
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter new key to override..."
                                    value={geminiKeyInput}
                                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">Default Model</label>
                                <select
                                    value={providers.gemini?.defaultModel || "gemini-2.5-flash"}
                                    onChange={(e) => handleProviderChange("gemini", "defaultModel", e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                >
                                    {PROVIDER_MODELS.gemini.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* OpenAI Card */}
                        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">OpenAI</span>
                                    {providers.openai?.hasKey && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-tiny font-bold text-emerald-700">
                                            <CheckCircle size={10} /> Key Configured
                                        </span>
                                    )}
                                </div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={providers.openai?.enabled ?? false}
                                        onChange={(e) => handleProviderChange("openai", "enabled", e.target.checked)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Enabled
                                </label>
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    API Key (Masked: {providers.openai?.apiKeyMasked || "••••••••"})
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter new key to override..."
                                    value={openAiKeyInput}
                                    onChange={(e) => setOpenAiKeyInput(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">Default Model</label>
                                <select
                                    value={providers.openai?.defaultModel || "gpt-4o-mini"}
                                    onChange={(e) => handleProviderChange("openai", "defaultModel", e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                >
                                    {PROVIDER_MODELS.openai.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Anthropic Claude Card */}
                        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">Anthropic Claude</span>
                                    {providers.claude?.hasKey && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-tiny font-bold text-emerald-700">
                                            <CheckCircle size={10} /> Key Configured
                                        </span>
                                    )}
                                </div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={providers.claude?.enabled ?? false}
                                        onChange={(e) => handleProviderChange("claude", "enabled", e.target.checked)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Enabled
                                </label>
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    API Key (Masked: {providers.claude?.apiKeyMasked || "••••••••"})
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter new key to override..."
                                    value={claudeKeyInput}
                                    onChange={(e) => setClaudeKeyInput(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">Default Model</label>
                                <select
                                    value={providers.claude?.defaultModel || "claude-3-5-haiku-20241022"}
                                    onChange={(e) => handleProviderChange("claude", "defaultModel", e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                >
                                    {PROVIDER_MODELS.claude.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* DeepSeek AI Card */}
                        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">DeepSeek AI</span>
                                    {providers.deepseek?.hasKey && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-tiny font-bold text-emerald-700">
                                            <CheckCircle size={10} /> Key Configured
                                        </span>
                                    )}
                                </div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={providers.deepseek?.enabled ?? false}
                                        onChange={(e) => handleProviderChange("deepseek", "enabled", e.target.checked)}
                                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    Enabled
                                </label>
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    API Key (Masked: {providers.deepseek?.apiKeyMasked || "••••••••"})
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter new key to override..."
                                    value={deepseekKeyInput}
                                    onChange={(e) => setDeepseekKeyInput(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-tiny font-bold uppercase tracking-wider text-slate-600 mb-1">Default Model</label>
                                <select
                                    value={providers.deepseek?.defaultModel || "deepseek-chat"}
                                    onChange={(e) => handleProviderChange("deepseek", "defaultModel", e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono bg-white focus:border-sky-500 focus:outline-none"
                                >
                                    {PROVIDER_MODELS.deepseek.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Capability Routing Table */}
                <AICapabilityRoutingTable
                    capabilities={capabilities}
                    onChange={handleCapabilityChange}
                />

                {/* AI Testing Console Sandbox */}
                <AITestingConsole />
            </div>
        </AdminPageShell>
    );
}
