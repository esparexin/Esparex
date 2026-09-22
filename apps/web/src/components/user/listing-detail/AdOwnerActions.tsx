import { Button } from "@esparex/ui";
import { AlertCircle, CheckCheck, Edit2, Trash2, TrendingUp, Zap } from "@esparex/ui";

interface AdOwnerActionsProps {
    isSold: boolean;
    isSpotlight?: boolean;
    isChatLocked?: boolean;
    status?: string;
    onEdit: () => void;
    onDelete: () => void;
    onMarkSold: () => void;
    onPromote: () => void;
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
    const isActive = status === "live" || status === "active" || status === "approved" || status === "published";
    const isExpired = status === "expired" || status === "rejected";
    const showViewOnlyState = !isPending && !isActive && !isSold;

    return (
        <div className="hidden md:block border-b border-border/80 pb-4 space-y-2">
            <h3 className="font-bold text-caption uppercase text-muted-foreground tracking-wider mb-2">Quick Actions</h3>

                {isPending && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <div className="flex items-center gap-2 text-amber-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-body font-semibold">Status: Pending</span>
                        </div>
                        <p className="mt-1 text-caption text-amber-700">Waiting for admin approval</p>
                        <p className="mt-1 text-caption text-amber-700/80">Your listing will become visible after admin approval.</p>
                    </div>
                )}

                {(isPending || isActive) && (
                    <Button
                        onClick={onEdit}
                        variant="outline"
                        disabled={isSold || isChatLocked}
                        className="w-full gap-2 justify-start text-body h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Edit2 className="h-4 w-4" />
                        Edit Listing
                    </Button>
                )}

                {!isSold && (isActive || isExpired) && (
                    <Button
                        onClick={onMarkSold}
                        variant="outline"
                        className="w-full gap-2 justify-start text-body h-11"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark as Sold
                    </Button>
                )}

                {(isPending || isExpired) && (
                    <Button
                        onClick={onDelete}
                        variant="outline"
                        className="w-full gap-2 justify-start text-body h-11 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Listing
                    </Button>
                )}

                {isSold && (
                    <div className="bg-muted border-2 border-border rounded-xl p-4 text-center">
                        <CheckCheck className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-body font-bold text-foreground-secondary">Listing Marked as Sold</p>
                        <p className="text-caption text-muted-foreground mt-1">This listing is now archived</p>
                    </div>
                )}

                {isChatLocked && !isSold && (
                    <div className="rounded-xl border border-border bg-muted/40 p-3 text-caption text-foreground-tertiary flex items-center gap-2">
                        <CheckCheck className="h-4 w-4 text-foreground-subtle" />
                        Chat is locked for this listing.
                    </div>
                )}

                {showViewOnlyState && !isChatLocked && (
                    <div className="rounded-xl border border-border bg-muted/40 p-3 text-caption text-foreground-tertiary">
                        This listing is no longer active. View-only mode is enabled.
                    </div>
                )}

                {isActive && isSpotlight ? (
                    <div className="w-full gap-2 px-3 py-2.5 rounded-xl text-body font-bold bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-start select-none">
                        <Zap className="h-4 w-4 text-amber-600 fill-amber-500 shrink-0" />
                        Spotlight Applied
                    </div>
                ) : isActive ? (
                    <Button
                        onClick={onPromote}
                        variant="primary"
                        disabled={isSold}
                        className="w-full gap-2 justify-start text-body h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrendingUp className="h-4 w-4" />
                        Promote Listing
                    </Button>
                ) : null}
        </div>
    );
}
