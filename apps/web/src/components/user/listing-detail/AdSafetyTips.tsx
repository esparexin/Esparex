import { ShieldAlert, CheckCircle2, AlertCircle, Info } from "@/icons/IconRegistry";

interface AdSafetyTipsProps {
    adId?: string | number;
}

export function AdSafetyTips({ adId }: AdSafetyTipsProps) {
    const formattedId = adId && typeof adId === 'string' && adId.length === 24 ? adId.slice(-8).toUpperCase() : String(adId || '');

    return (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Safety First</span>
                </div>
                {formattedId ? (
                    <span className="text-2xs font-mono text-amber-700/80">#{formattedId}</span>
                ) : null}
            </div>

            <div className="space-y-2 text-xs text-amber-900/90">
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-amber-950">Inspect in person: </span>
                        <span>Meet in a public place to check the item status.</span>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-amber-950">No advance payments: </span>
                        <span>Never pay before receiving and verifying the item.</span>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-amber-950">Report fraud: </span>
                        <span>Report suspicious activity to our support team.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
