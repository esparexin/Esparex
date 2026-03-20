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
}

export function AdOwnerActions({ isSold, isChatLocked, status, onEdit, onDelete, onMarkSold, onPromote }: AdOwnerActionsProps) {
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
                        className="w-full gap-2 justify-start text-sm h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Edit2 className="h-4 w-4" />
                        Edit Listing
                    </Button>
                )}

                {isPending && (
                    <Button
                        onClick={onDelete}
                        variant="outline"
                        className="w-full gap-2 justify-start text-sm h-10 text-red-700 border-red-200 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Listing
                    </Button>
                )}

                {!isSold && isActive && (
                    <Button
                        onClick={onMarkSold}
                        variant="outline"
                        className="w-full gap-2 justify-start text-sm h-10"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark as Sold
                    </Button>
                )}

                {isSold && (
                    <div className="bg-slate-100 border-2 border-slate-200 rounded-xl p-4 text-center">
                        <CheckCheck className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700">Listing Marked as Sold</p>
                        <p className="text-xs text-slate-500 mt-1">This listing is now archived</p>
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
                        className="w-full gap-2 justify-start text-sm h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Promote Listing
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
