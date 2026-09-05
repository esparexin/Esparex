"use client";

import { useState } from "react";
import { Cpu, ChevronDown, ChevronUp, Sparkles } from "@esparex/ui";

export interface CapabilityConfig {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
}

export interface ProviderConfig {
    enabled: boolean;
    apiKeyMasked?: string;
    hasKey?: boolean;
    defaultModel?: string;
}

export interface AiConfigData {
    capabilities?: Record<string, CapabilityConfig>;
    providers?: Record<string, ProviderConfig>;
}

interface AICapabilityRoutingTableProps {
    capabilities: Record<string, CapabilityConfig>;
    onChange: (key: string, field: keyof CapabilityConfig, value: string | number) => void;
}

export const PROVIDER_MODELS = {
    gemini: [
        { value: "gemini-2.0-flash", label: "gemini-2.0-flash (Recommended)" },
        { value: "gemini-1.5-flash", label: "gemini-1.5-flash" },
        { value: "gemini-1.5-pro", label: "gemini-1.5-pro" },
    ],
    openai: [
        { value: "gpt-4o-mini", label: "gpt-4o-mini" },
        { value: "gpt-4o", label: "gpt-4o" },
        { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
    ],
    claude: [
        { value: "claude-3-5-haiku-20241022", label: "claude-3-5-haiku" },
        { value: "claude-3-5-sonnet-20241022", label: "claude-3-5-sonnet" },
        { value: "claude-3-opus-20240229", label: "claude-3-opus" },
    ],
    deepseek: [
        { value: "deepseek-chat", label: "deepseek-chat" },
        { value: "deepseek-coder", label: "deepseek-coder" },
    ],
};

const CAPABILITY_LABELS: Record<string, { title: string; desc: string }> = {
    post_ad_title: { title: "Post Ad Title Generation", desc: "Generates concise, catchy listing titles from brand, model & condition." },
    post_ad_description: { title: "Post Ad Description Generation", desc: "Builds structured, natural seller listing descriptions." },
    device_identification: { title: "Device Identification & Suggestion", desc: "Detects brand, model, and category from catalog search inputs." },
    content_moderation: { title: "Content Moderation & Auto-Flagging", desc: "Checks listing titles & descriptions against platform safety policies." },
    spam_detection: { title: "Spam & Duplicate Detection", desc: "Evaluates listing text for automated spam patterns." },
};

const PROVIDER_NAMES: Record<string, string> = {
    gemini: "Google Gemini",
    openai: "OpenAI",
    claude: "Anthropic Claude",
    deepseek: "DeepSeek AI",
};

export function AICapabilityRoutingTable({ capabilities, onChange }: AICapabilityRoutingTableProps) {
    const [expandedKey, setExpandedKey] = useState<string | null>("post_ad_title");

    return (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <Cpu size={16} />
                </div>
                <div>
                    <h3 className="text-body font-bold text-foreground">AI Capability Routing Rules</h3>
                    <p className="text-caption text-foreground-tertiary">Route individual AI capabilities to distinct Provider & Model engines</p>
                </div>
            </div>

            <div className="space-y-2.5">
                {Object.entries(capabilities || {}).map(([key, config]) => {
                    const meta = CAPABILITY_LABELS[key] || { title: key, desc: "System AI capability" };
                    const isExpanded = expandedKey === key;
                    const availableModels = (PROVIDER_MODELS as Record<string, { value: string; label: string }[]>)[config.provider] || PROVIDER_MODELS.gemini;

                    const handleProviderSelect = (newProvider: string) => {
                        onChange(key, "provider", newProvider);
                        const modelsForProvider = (PROVIDER_MODELS as Record<string, { value: string; label: string }[]>)[newProvider] || PROVIDER_MODELS.gemini;
                        const firstModel = modelsForProvider[0]?.value || "gemini-2.0-flash";
                        onChange(key, "model", firstModel);
                    };

                    return (
                        <div
                            key={key}
                            className="rounded-lg border border-border bg-muted/20 overflow-hidden transition-all shadow-xs"
                        >
                            {/* Accordion Header */}
                            <div
                                onClick={() => setExpandedKey(isExpanded ? null : key)}
                                className="flex items-center justify-between p-3 bg-card hover:bg-muted/40 cursor-pointer transition-colors select-none"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-primary" />
                                        <h4 className="font-bold text-body text-foreground">{meta.title}</h4>
                                    </div>
                                    <p className="text-tiny text-foreground-tertiary pl-5">{meta.desc}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 text-caption">
                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-bold text-primary border border-primary/20">
                                            {PROVIDER_NAMES[config.provider] || config.provider}
                                        </span>
                                        <span className="rounded-full bg-muted px-2.5 py-1 font-mono font-medium text-foreground-secondary border border-border">
                                            {config.model}
                                        </span>
                                    </div>

                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground-secondary">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                            </div>

                            {/* Accordion Body */}
                            {isExpanded && (
                                <div className="p-4 border-t border-border bg-muted/30">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">
                                                Provider Engine
                                            </label>
                                            <select
                                                value={config.provider}
                                                onChange={(e) => handleProviderSelect(e.target.value)}
                                                className="w-full rounded-lg border border-input px-3 py-1.5 text-caption font-semibold bg-background text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus:outline-none"
                                            >
                                                <option value="gemini">Google Gemini</option>
                                                <option value="openai">OpenAI</option>
                                                <option value="claude">Anthropic Claude</option>
                                                <option value="deepseek">DeepSeek AI</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">
                                                Engine Model
                                            </label>
                                            <select
                                                value={config.model}
                                                onChange={(e) => onChange(key, "model", e.target.value)}
                                                className="w-full rounded-lg border border-input px-3 py-1.5 text-caption font-mono bg-background text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus:outline-none"
                                            >
                                                {availableModels.map((m) => (
                                                    <option key={m.value} value={m.value}>
                                                        {m.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">
                                                Temperature (0.0 - 1.0)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="1"
                                                value={config.temperature}
                                                onChange={(e) => onChange(key, "temperature", parseFloat(e.target.value))}
                                                className="w-full rounded-lg border border-input px-3 py-1.5 text-caption font-mono bg-background text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">
                                                Max Output Tokens
                                            </label>
                                            <input
                                                type="number"
                                                step="50"
                                                value={config.maxTokens}
                                                onChange={(e) => onChange(key, "maxTokens", parseInt(e.target.value, 10))}
                                                className="w-full rounded-lg border border-input px-3 py-1.5 text-caption font-mono bg-background text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

