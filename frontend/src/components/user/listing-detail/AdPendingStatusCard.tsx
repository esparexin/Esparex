import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function AdPendingStatusCard() {
    return (
        <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900">Status: Pending</p>
                        <p className="mt-1 text-sm text-amber-800">Waiting for admin approval</p>
                        <p className="mt-1 text-xs text-amber-700">
                            Your ad will become visible after admin approval.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
