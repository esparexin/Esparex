import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function AdSafetyTips() {
    return (
        <Card className="bg-amber-50/40 border border-amber-100/80 shadow-none rounded-2xl overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-3.5">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-800">Buying Safely</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Inspect Personally</p>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Meet in a public place to check the item status.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Avoid Advance Payments</p>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Never pay before receiving and verifying the item.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Info className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Fraud Protection</p>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Report suspicious activity to our support team.</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-amber-100 pt-3">
                    <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-widest text-center">Safety First · Esparex Trust</p>
                </div>
            </CardContent>
        </Card>
    );
}
