"use client";

import Link from "next/link";
import { CheckCircle2, User as UserIcon, X } from "lucide-react";
import { StatusChip } from "@/components/ui/StatusChip";
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
        <div className="absolute right-0 top-0 z-10 h-full w-[400px] overflow-y-auto border-l border-slate-200 bg-white shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">User Details</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
                        aria-label="Close user details"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50 p-6">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                        <UserIcon size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{getUserDisplayName(user)}</h3>
                    <StatusChip
                        status={statusPresentation.status}
                        label={statusPresentation.label}
                        className="mt-2"
                    />
                </div>

                <div className="space-y-4">
                    <h4 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                        Identity
                    </h4>

                    <div>
                        <div className="mb-1 text-xs text-slate-500">Mobile Number</div>
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                            {user.mobile}
                            {user.isPhoneVerified ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : null}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-xs text-slate-500">Email Address</div>
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                            {user.email || "N/A"}
                            {user.isEmailVerified ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : null}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-xs text-slate-500">Overall Verification</div>
                        <div className="font-semibold text-slate-900">
                            {user.isVerified ? (
                                <span className="text-emerald-600">Verified</span>
                            ) : (
                                <span className="text-slate-400">Unverified</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h4 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                        Business & Status
                    </h4>
                    <div>
                        <div className="mb-1 text-xs text-slate-500">Role</div>
                        <div className="font-semibold capitalize text-slate-900">{user.role}</div>
                    </div>
                    <div>
                        <div className="mb-1 text-xs text-slate-500">Business Status</div>
                        <div className="font-semibold capitalize text-slate-900">
                            {user.businessStatus || "None"}
                        </div>
                    </div>
                    <div>
                        <div className="mb-1 text-xs text-slate-500">Account Created</div>
                        <div className="font-semibold text-slate-900">{createdAtLabel}</div>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <h4 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-widest text-slate-500">
                        Quick Access
                    </h4>
                    <div className="flex flex-col gap-2">
                        <Link
                            href={`/moderation?sellerId=${encodeURIComponent(user.id)}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            View User Ads
                        </Link>
                        <Link
                            href={`/reports?search=${encodeURIComponent(user.id)}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            View User Reports
                        </Link>
                        <Link
                            href={`/finance?search=${encodeURIComponent(user.id)}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            View User Payments
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
