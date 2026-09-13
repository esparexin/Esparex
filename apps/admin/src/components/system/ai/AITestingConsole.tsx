"use client";

import { useState } from "react";
import { Play, Clock, Zap, FileText, CheckCircle } from "@esparex/ui";
import { runAiCapabilityTest, type AiTestResult, type AiTestUsage } from "@/lib/api/aiTestApi";
import { showAdminPopup } from "@/lib/popup/popupEvents";

export function AITestingConsole() {
    const [providerName, setProviderName] = useState("gemini");
    const [capability, setCapability] = useState("post_ad_title");
    const [brand, setBrand] = useState("Apple");
    const [model, setModel] = useState("iPhone 15 Pro Max");
    const [condition, setCondition] = useState("Like New");
    const [running, setRunning] = useState(false);
    const [testResult, setTestResult] = useState<AiTestResult | null>(null);

    const handleRunTest = async () => {
        setRunning(true);
        setTestResult(null);
        try {
            const result = await runAiCapabilityTest({ providerName, capability, brand, model, condition });
            if (result) {
                setTestResult(result);
                showAdminPopup({ type: "success", title: "Test Complete", message: `Generated in ${result.latencyMs}ms` });
            }
        } catch (err: unknown) {
            showAdminPopup({ type: "error", title: "Test Failed", message: err instanceof Error ? err.message : "AI test failed" });
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                        <Zap size={16} />
                    </div>
                    <div>
                        <h3 className="text-body font-bold text-foreground">AI Sandbox & Provider Benchmark Console</h3>
                        <p className="text-caption text-foreground-tertiary">Test raw prompts, measure latency, token counts, and inspect outputs side-by-side</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleRunTest}
                    disabled={running}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-caption font-bold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                >
                    <Play size={14} /> {running ? "Running Test..." : "Run AI Benchmark"}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                    <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Provider</label>
                    <select
                        value={providerName}
                        onChange={(e) => setProviderName(e.target.value)}
                        className="w-full rounded-lg border border-input px-2.5 py-1.5 text-caption font-bold bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="claude">Anthropic Claude</option>
                        <option value="deepseek">DeepSeek AI</option>
                    </select>
                </div>
                <div>
                    <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Capability</label>
                    <select
                        value={capability}
                        onChange={(e) => setCapability(e.target.value)}
                        className="w-full rounded-lg border border-input px-2.5 py-1.5 text-caption bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                        <option value="post_ad_title">Post Ad Title & Description</option>
                        <option value="device_identification">Device Identification</option>
                    </select>
                </div>
                <div>
                    <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Brand</label>
                    <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full rounded-lg border border-input px-2.5 py-1.5 text-caption bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                </div>
                <div>
                    <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Model</label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full rounded-lg border border-input px-2.5 py-1.5 text-caption bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                </div>
                <div>
                    <label className="block text-tiny font-bold uppercase tracking-wider text-foreground-secondary mb-1">Condition</label>
                    <input
                        type="text"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full rounded-lg border border-input px-2.5 py-1.5 text-caption bg-background text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                </div>
            </div>

            {testResult && (
                <div className="space-y-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-3 text-caption">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700 border border-emerald-200">
                            <CheckCircle size={12} /> {String(testResult.provider ?? "")} ({String(testResult.model ?? "")})
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-bold text-sky-700 border border-sky-200">
                            <Clock size={12} /> Latency: {testResult.latencyMs} ms
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 font-bold text-purple-700 border border-purple-200">
                            <FileText size={12} /> Tokens: {(testResult.usage as AiTestUsage)?.totalTokens} ({(testResult.usage as AiTestUsage)?.promptTokens} in / {(testResult.usage as AiTestUsage)?.completionTokens} out)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-caption font-bold text-foreground mb-1">Constructed Prompt Payload</p>
                            <pre className="rounded-xl bg-foreground text-background p-3 text-tiny font-mono overflow-x-auto max-h-48 leading-relaxed">
                                {String(testResult.rawPrompt ?? "")}
                            </pre>
                        </div>
                        <div>
                            <p className="text-caption font-bold text-foreground mb-1">Parsed Output Response JSON</p>
                            <pre className="rounded-xl bg-foreground text-background p-3 text-tiny font-mono overflow-x-auto max-h-48 leading-relaxed">
                                {JSON.stringify(testResult.output, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
