"use client";

import { Cpu } from "@esparex/ui";

interface CapabilityConfig {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
}

interface AICapabilityRoutingTableProps {
    capabilities: Record<string, CapabilityConfig>;
    onChange: (key: string, field: keyof CapabilityConfig, value: string | number) => void;
}

const CAPABILITY_LABELS: Record<string, { title: string; desc: string }> = {
    post_ad_title: { title: "Post Ad Title Generation", desc: "Generates concise, catchy listing titles from brand, model & condition." },
    post_ad_description: { title: "Post Ad Description Generation", desc: "Builds structured, natural seller listing descriptions." },
    device_identification: { title: "Device Identification & Suggestion", desc: "Detects brand, model, and category from catalog search inputs." },
    content_moderation: { title: "Content Moderation & Auto-Flagging", desc: "Checks listing titles & descriptions against platform safety policies." },
    spam_detection: { title: "Spam & Duplicate Detection", desc: "Evaluates listing text for automated spam patterns." },
};

export function AICapabilityRoutingTable({ capabilities, onChange }: AICapabilityRoutingTableProps) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                    <Cpu size={18} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900">AI Capability Routing Rules</h3>
                    <p className="text-xs text-slate-500">Route individual AI capabilities to distinct Provider & Model engines</p>
                </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3">Capability</th>
                            <th className="px-4 py-3">Provider</th>
                            <th className="px-4 py-3">Model</th>
                            <th className="px-4 py-3">Temp</th>
                            <th className="px-4 py-3">Max Tokens</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {Object.entries(capabilities || {}).map(([key, config]) => {
                            const meta = CAPABILITY_LABELS[key] || { title: key, desc: "System AI capability" };
                            return (
                                <tr key={key} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-900">{meta.title}</p>
                                        <p className="text-tiny text-slate-500">{meta.desc}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={config.provider}
                                            onChange={(e) => onChange(key, "provider", e.target.value)}
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none bg-white font-semibold"
                                        >
                                            <option value="gemini">Google Gemini</option>
                                            <option value="openai">OpenAI</option>
                                            <option value="claude">Anthropic Claude</option>
                                            <option value="deepseek">DeepSeek AI</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={config.model}
                                            onChange={(e) => onChange(key, "model", e.target.value)}
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono focus:border-sky-500 focus:outline-none w-32"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            value={config.temperature}
                                            onChange={(e) => onChange(key, "temperature", parseFloat(e.target.value))}
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono focus:border-sky-500 focus:outline-none w-16"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="50"
                                            value={config.maxTokens}
                                            onChange={(e) => onChange(key, "maxTokens", parseInt(e.target.value, 10))}
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono focus:border-sky-500 focus:outline-none w-20"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
