import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2, AlertCircle, Info } from "@/icons/IconRegistry";

interface AdSafetyTipsProps {
    adId?: string | number;
}

export function AdSafetyTips({ adId }: AdSafetyTipsProps) {
    return (
        <Card className="bg-amber-50/50 border border-amber-200/80 shadow-xs rounded-2xl overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-3.5">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground-secondary">Buying Safely</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground-secondary">Inspect Personally</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Meet in a public place to check the item status.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground-secondary">Avoid Advance Payments</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Never pay before receiving and verifying the item.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Info className="h-3.5 w-3.5 text-link" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-foreground-secondary">Fraud Protection</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Report suspicious activity to our support team.</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-amber-200/80 pt-3 text-center space-y-1">
                    <p className="text-2xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest">Safety First · Esparex Trust</p>
                    {adId && (
                        <p className="text-2xs text-muted-foreground font-medium pt-0.5">
                            Listing ID: <span className="font-bold text-foreground font-mono">#{typeof adId === 'string' && adId.length === 24 ? adId.slice(-8).toUpperCase() : String(adId)}</span>
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
