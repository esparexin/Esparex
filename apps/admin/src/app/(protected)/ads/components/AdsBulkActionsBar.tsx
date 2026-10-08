"use client";

import { Button } from "@esparex/ui";

export interface AdsBulkActionsBarProps {
    status: string;
    normalizedStatus: string;
    listingType?: "ad" | "service" | "spare_part";
    onBulkApprove: () => void;
    onBulkReject: () => void;
    onBulkDeactivate: () => void;
    onBulkExpire: () => void;
    onBulkExtend: () => void;
    onBulkResendWarnings: () => void;
    onBulkResendSpotlightWarnings: () => void;
    onBulkDelete: () => void;
}

export function AdsBulkActionsBar({
    status,
    normalizedStatus,
    listingType,
    onBulkApprove,
    onBulkReject,
    onBulkDeactivate,
    onBulkExpire,
    onBulkExtend,
    onBulkResendWarnings,
    onBulkResendSpotlightWarnings,
    onBulkDelete,
}: AdsBulkActionsBarProps) {
    return (
        <div className="flex items-center gap-2">
            {normalizedStatus === "pending" && (
                <>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onBulkApprove}
                        className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm text-caption font-semibold"
                    >
                        Approve Selected
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onBulkReject}
                        className="bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm text-caption font-semibold"
                    >
                        Reject Selected
                    </Button>
                </>
            )}

            {status !== "pending" && (
                <div className="flex items-center gap-2">
                    {status === "live" && (
                        <>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={onBulkDeactivate}
                                className="text-caption font-semibold shadow-sm"
                            >
                                Deactivate Selected
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={onBulkExpire}
                                className="bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm text-caption font-semibold"
                            >
                                Expire Selected
                            </Button>
                        </>
                    )}
                    {(status === "live" || status === "expired") && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onBulkExtend}
                            className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm text-caption font-semibold"
                        >
                            Extend Selected
                        </Button>
                    )}
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onBulkResendWarnings}
                        className="text-caption font-semibold shadow-sm"
                    >
                        Resend Warnings
                    </Button>
                    {listingType === "ad" && (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={onBulkResendSpotlightWarnings}
                            className="text-caption font-semibold shadow-sm"
                        >
                            Spotlight Warnings
                        </Button>
                    )}
                </div>
            )}

            <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onBulkDelete}
                className="text-caption font-semibold shadow-sm"
            >
                Delete Selected
            </Button>
        </div>
    );
}
