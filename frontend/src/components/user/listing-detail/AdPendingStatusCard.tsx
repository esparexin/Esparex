import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function AdPendingStatusCard() {
    return (
        <Card className="border border-amber-200 bg-amber-50/80 shadow-none rounded-2xl">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">Pending Approval</p>
                        <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
                            Your ad is under review and will become visible once approved by admin.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
