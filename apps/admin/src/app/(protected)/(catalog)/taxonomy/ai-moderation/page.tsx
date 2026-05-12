"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { catalogManagementTabs } from "@/components/layout/adminModuleTabSets";
import { getAiModerationQueue } from "@/lib/api/catalogGovernance";
import {
    BrainCircuit,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    Sparkles,
    Smartphone,
    Box
} from "lucide-react";

export default function TaxonomyAiModerationPage() {
    const [queue, setQueue] = useState<{ brands: any[], models: any[] }>({ brands: [], models: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadQueue = async () => {
        setLoading(true);
        try {
            const data = await getAiModerationQueue();
            setQueue(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load AI moderation queue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadQueue();
    }, []);

    const getConfidenceColor = (score: number) => {
        if (score >= 0.95) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (score >= 0.80) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <AdminPageShell
            title="AI Taxonomy Moderation"
            description="Review and verify AI-assisted brand and model suggestions."
            tabs={<AdminModuleTabs tabs={catalogManagementTabs} />}
            className="h-full overflow-y-auto"
        >
            <div className="space-y-6 pb-10">
                {/* Stats Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{queue.brands.length + queue.models.length}</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Awaiting Review</div>
                        </div>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {([...queue.brands, ...queue.models].filter(i => i.aiAnalysis?.confidence >= 0.95)).length}
                            </div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">High Confidence</div>
                        </div>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">
                                {([...queue.brands, ...queue.models].filter(i => i.aiAnalysis?.confidence < 0.80)).length}
                            </div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Uncertain Match</div>
                        </div>
                    </div>
                </div>

                {/* Queue Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            Moderation Queue
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/30">
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Original Suggestion</th>
                                    <th className="px-6 py-3">AI Recommendation</th>
                                    <th className="px-6 py-3">Confidence</th>
                                    <th className="px-6 py-3">Analysis</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...queue.brands.map(b => ({ ...b, itemType: 'Brand' })), ...queue.models.map(m => ({ ...m, itemType: 'Model' }))].map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.itemType === 'Brand' ? <Smartphone size={14} className="text-sky-500" /> : <Box size={14} className="text-violet-500" />}
                                                <span className="text-xs font-bold text-slate-600">{item.itemType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-900">{item.name}</div>
                                            <div className="text-[10px] text-slate-400">by User: {item.suggestedBy?.name || item.suggestedBy || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-400 font-medium">Category:</span>
                                                    <span className="font-bold text-slate-700">{item.aiAnalysis?.categorySuggestion}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-400 font-medium">Brand:</span>
                                                    <span className="font-bold text-slate-700">{item.aiAnalysis?.brandSuggestion}</span>
                                                </div>
                                                {item.aiAnalysis?.modelSuggestion && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-slate-400 font-medium">Model:</span>
                                                        <span className="font-bold text-slate-700">{item.aiAnalysis?.modelSuggestion}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black border ${getConfidenceColor(item.aiAnalysis?.confidence)}`}>
                                                {(item.aiAnalysis?.confidence * 100).toFixed(0)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 max-w-[200px]">
                                                <Info size={14} className="shrink-0" />
                                                <span className="line-clamp-2">{item.aiAnalysis?.explanation}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                    <CheckCircle2 size={20} />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <XCircle size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {queue.brands.length === 0 && queue.models.length === 0 && !loading && (
                            <div className="p-12 text-center text-slate-400 text-sm italic">
                                AI moderation queue is empty.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminPageShell>
    );
}
