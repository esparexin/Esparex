import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCheck, Edit2, Trash2, TrendingUp } from "lucide-react";

interface AdOwnerActionsProps {
    isSold: boolean;
    isChatLocked?: boolean;
    status?: string;
    onEdit: () => void;
    onDelete: () => void;
    onMarkSold: () => void;
    onPromote: () => void;
    onViewAnalytics: () => void;
}

export function AdOwnerActions({
    isSold,
    isChatLocked,
    status,
    onEdit,
    onDelete,
    onMarkSold,
    onPromote,
    onViewAnalytics,
}: AdOwnerActionsProps) {
    const isPending = status === "pending";
    const isActive = status === "live";
    const showViewOnlyState = !isPending && !isActive && !isSold;

    return (
        <Card className="hidden md:block">
            <CardContent className="p-3 md:p-4 space-y-2">
                <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>

                {isPending && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-center gap-2 text-amber-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">Status: Pending</span>
                        </div>
                        <p className="mt-1 text-xs text-amber-700">Waiting for admin approval</p>
                        <p className="mt-1 text-xs text-amber-600">Your listing will become visible after admin approval.</p>
                    </div>
                )}

                {(isPending || isActive) && (
                    <Button
                        onClick={onEdit}
                        variant="outline"
                        disabled={isSold || isChatLocked}
                        className="w-full gap-2 justify-start text-sm h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Edit2 className="h-4 w-4" />
                        Edit Listing
                    </Button>
                )}

                {isPending && (
                    <Button
                        onClick={onDelete}
                        variant="outline"
                        className="w-full gap-2 justify-start text-sm h-11 text-red-600 border-red-200 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Listing
                    </Button>
                )}

                {!isSold && isActive && (
                    <Button
                        onClick={onMarkSold}
                        variant="outline"
                        className="w-full gap-2 justify-start text-sm h-11"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark as Sold
                    </Button>
                )}

                {isSold && (
                    <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-4 text-center">
                        <CheckCheck className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">Listing Marked as Sold</p>
                        <p className="text-xs text-muted-foreground mt-1">This listing is now archived</p>
                    </div>
                )}

                {isChatLocked && !isSold && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex items-center gap-2">
                        <CheckCheck className="h-4 w-4 text-slate-400" />
                        Chat is locked for this listing.
                    </div>
                )}

                {showViewOnlyState && !isChatLocked && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        This listing is no longer active. View-only mode is enabled.
                    </div>
                )}

                {isActive && (
                    <Button
                        onClick={onPromote}
                        disabled={isSold}
                        className="w-full gap-2 justify-start text-sm h-11 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Promote Listing
                    </Button>
                )}

                {(isActive || isSold || showViewOnlyState) && (
                    <Button
                        onClick={onViewAnalytics}
                        variant="outline"
                        className="w-full gap-2 justify-start text-sm h-11"
                    >
                        <TrendingUp className="h-4 w-4" />
                        View Analytics
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
