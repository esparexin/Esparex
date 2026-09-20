import { ShieldAlert, CheckCircle2, AlertCircle, Info } from "@esparex/ui";

interface AdSafetyTipsProps {
    adId?: string | number;
    listingType?: "ad" | "service" | "spare_part";
}

export function AdSafetyTips({ adId, listingType = "ad" }: AdSafetyTipsProps) {
    const formattedId = adId && typeof adId === 'string' && adId.length === 24 ? adId.slice(-8).toUpperCase() : String(adId || '');
    const isService = listingType === "service";
    const isSparePart = listingType === "spare_part";

    return (
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-caption font-bold text-foreground">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Safety First</span>
                </div>
                {formattedId ? (
                    <span className="text-tiny font-mono font-medium text-foreground-subtle bg-muted px-1.5 py-0.5 rounded-md">
                        #{formattedId}
                    </span>
                ) : null}
            </div>

            <div className="space-y-2 text-caption text-foreground-secondary">
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold text-foreground">
                            {isService ? "Verify service scope: " : isSparePart ? "Inspect part in person: " : "Inspect in person: "}
                        </span>
                        <span>
                            {isService
                                ? "Confirm scope of work, warranty, and estimated turnaround before handing over devices."
                                : isSparePart
                                ? "Check connector pins, model fit, and physical integrity before purchasing."
                                : "Meet in a public place to check the item status."}
                        </span>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold text-foreground">
                            {isService ? "No unauthorized advance: " : "No advance payments: "}
                        </span>
                        <span>
                            {isService
                                ? "Pay only agreed diagnostic or service fees upon service verification or completion."
                                : "Never pay before receiving and verifying the item."}
                        </span>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold text-foreground">Report fraud: </span>
                        <span>Report suspicious activity to our support team.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
