import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function AdSafetyTips() {
    return (
        <Card className="bg-slate-50/50 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2rem] border border-slate-100/50 overflow-hidden">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-slate-900">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-sm">Buying Safely</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-700">Inspect Personally</p>
                            <p className="text-[10px] text-slate-400">Meet in a public place to check the item status.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-700">Avoid Advance Payments</p>
                            <p className="text-[10px] text-slate-400">Never pay before receiving and verifying the item.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Info className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-slate-700">Fraud Protection</p>
                            <p className="text-[10px] text-slate-400">Report suspicious activity to our support team.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-[9px] text-slate-300 font-medium uppercase tracking-widest text-center">Safety First • Esparex Trust</p>
                </div>
            </CardContent>
        </Card>
    );
}
