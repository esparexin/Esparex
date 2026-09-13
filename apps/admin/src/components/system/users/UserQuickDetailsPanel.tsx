"use client";

import Link from "next/link";
import { CheckCircle2, User as UserIcon, X, StatusChip } from "@esparex/ui";
import { REPORT_STATUS } from "@esparex/contracts";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";
import {
    getUserDisplayName,
    getUserStatusPresentation,
    type ManagedUser,
} from "@/components/system/users/userManagement";

interface UserQuickDetailsPanelProps {
    user: ManagedUser;
    onClose: () => void;
}

export function UserQuickDetailsPanel({ user, onClose }: UserQuickDetailsPanelProps) {
    const statusPresentation = getUserStatusPresentation(user.status);
    const createdAtLabel = user.createdAt ? new Date(user.createdAt).toLocaleString() : "Unknown";

    return (
        <div className="absolute right-0 top-0 z-10 h-full w-[400px] overflow-y-auto border-l border-border bg-card shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-body-lg font-bold text-foreground">User Details</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-foreground-tertiary transition-colors hover:bg-muted cursor-pointer"
                        aria-label="Close user details"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-border bg-muted/20 p-6">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-foreground-tertiary">
                        <UserIcon size={40} />
                    </div>
                    <h3 className="text-body-lg font-bold text-foreground">{getUserDisplayName(user)}</h3>
                    <StatusChip
                        status={statusPresentation.status}
                        label={statusPresentation.label}
                        className="mt-2"
                    />
                </div>

                <div className="space-y-4">
                    <h4 className="border-b border-border pb-2 text-caption font-bold uppercase tracking-widest text-foreground-tertiary">
                        Identity
                    </h4>

                    <div>
                        <div className="mb-1 text-tiny text-foreground-tertiary">Mobile Number</div>
                        <div className="flex items-center gap-2 font-semibold text-foreground text-body">
                            {user.mobile}
                            {user.isPhoneVerified ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : null}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-tiny text-foreground-tertiary">Email Address</div>
                        <div className="flex items-center gap-2 font-semibold text-foreground text-body">
                            {user.email || "N/A"}
                            {user.isEmailVerified ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : null}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-tiny text-foreground-tertiary">Overall Verification</div>
                        <div className="font-semibold text-foreground text-body">
                            {user.isVerified ? (
                                <span className="text-emerald-600">Verified</span>
                            ) : (
                                <span className="text-foreground-subtle">Unverified</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h4 className="border-b border-border pb-2 text-caption font-bold uppercase tracking-widest text-foreground-tertiary">
                        Business & Status
                    </h4>
                    <div>
                        <div className="mb-1 text-tiny text-foreground-tertiary">Role</div>
                        <div className="font-semibold capitalize text-foreground text-body">{user.role}</div>
                    </div>
                    <div>
                        <div className="mb-1 text-tiny text-foreground-tertiary">Business Status</div>
                        <div className="font-semibold capitalize text-foreground text-body">
                            {(user.businessStatus as string) || "None"}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-tiny text-foreground-tertiary">Account Created</div>
                        <div className="font-semibold text-foreground text-body">{createdAtLabel}</div>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <h4 className="border-b border-border pb-2 text-caption font-bold uppercase tracking-widest text-foreground-tertiary">
                        Quick Access
                    </h4>
                    <div className="flex flex-col gap-2">
                        <Link
                            href={ADMIN_UI_ROUTES.ads({ status: "all", sellerId: user.id })}
                            className="rounded-lg border border-border px-3 py-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 transition-colors text-center"
                        >
                            View User Ads
                        </Link>
                        <Link
                            href={ADMIN_UI_ROUTES.reports({ status: REPORT_STATUS.OPEN })}
                            className="rounded-lg border border-border px-3 py-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 transition-colors text-center"
                        >
                            View Reports Queue
                        </Link>
                        <Link
                            href={ADMIN_UI_ROUTES.finance({ q: user.id })}
                            className="rounded-lg border border-border px-3 py-2 text-body font-medium text-foreground-secondary hover:bg-muted/50 transition-colors text-center"
                        >
                            View User Payments
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
