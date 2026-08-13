import { Button } from "@esparex/ui";
import { AlertCircle, CheckCheck, Edit2, Trash2, TrendingUp, Sparkles } from "@/icons/IconRegistry";

interface AdOwnerActionsProps {
    isSold: boolean;
    isSpotlight?: boolean;
    isChatLocked?: boolean;
    status?: string;
    onEdit: () => void;
    onDelete: () => void;
    onMarkSold: () => void;
    onPromote: () => void;
    onViewAnalytics?: () => void;
}

export function AdOwnerActions({
    isSold,
    isSpotlight = false,
    isChatLocked,
    status,
    onEdit,
    onDelete,
    onMarkSold,
    onPromote,
}: AdOwnerActionsProps) {
    const isPending = status === "pending";
    const isActive = status === "live";
    const showViewOnlyState = !isPending && !isActive && !isSold;

    return (
        <div className="hidden md:block border-b border-slate-200/80 pb-4 space-y-2">
            <h3 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">Quick Actions</h3>

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
                        <p className="text-sm font-bold text-foreground-secondary">Listing Marked as Sold</p>
                        <p className="text-xs text-muted-foreground mt-1">This listing is now archived</p>
                    </div>
                )}

                {isChatLocked && !isSold && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-foreground-tertiary flex items-center gap-2">
                        <CheckCheck className="h-4 w-4 text-foreground-subtle" />
                        Chat is locked for this listing.
                    </div>
                )}

                {showViewOnlyState && !isChatLocked && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-foreground-tertiary">
                        This listing is no longer active. View-only mode is enabled.
                    </div>
                )}

                {isActive && isSpotlight ? (
                    <div className="w-full gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-start select-none">
                        <Sparkles className="h-4 w-4 text-amber-600 fill-amber-500 shrink-0" />
                        ✨ Spotlight Applied
                    </div>
                ) : isActive ? (
                    <Button
                        onClick={onPromote}
                        disabled={isSold}
                        className="w-full gap-2 justify-start text-sm h-11 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Promote Listing
                    </Button>
                ) : null}
        </div>
    );
}
