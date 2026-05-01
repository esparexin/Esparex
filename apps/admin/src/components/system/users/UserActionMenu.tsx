"use client";

import type { Ref } from "react";
import Link from "next/link";
import { Ban, Eye, MoreVertical, PlayCircle, Search, Shield, User as UserIcon } from "lucide-react";
import {
    isManagedUserActive,
    type ManagedUser,
    type UserActionType,
} from "@/components/system/users/userManagement";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";

interface UserActionMenuProps {
    user: ManagedUser;
    isOpen: boolean;
    menuRef: Ref<HTMLDivElement>;
    onToggle: () => void;
    onClose: () => void;
    onOpenDetails: (user: ManagedUser) => void;
    onOpenAction: (type: UserActionType, user: ManagedUser) => void;
}

export function UserActionMenu({
    user,
    isOpen,
    menuRef,
    onToggle,
    onClose,
    onOpenDetails,
    onOpenAction,
}: UserActionMenuProps) {
    return (
        <div className="relative flex justify-end">
            <button
                onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                }}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100"
                aria-label={`Open actions for ${user.name || user.mobile}`}
            >
                <MoreVertical size={20} />
            </button>

            {isOpen ? (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-100 bg-white py-1 text-sm font-medium shadow-lg"
                >
                    <Link
                        href={ADMIN_UI_ROUTES.userById(user.id)}
                        onClick={onClose}
                        className="block w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                        <span className="flex items-center gap-2">
                            <Eye size={16} />
                            View Profile
                        </span>
                    </Link>
                    <Link
                        href={ADMIN_UI_ROUTES.ads({ status: "all", sellerId: user.id })}
                        onClick={onClose}
                        className="block w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                        <span className="flex items-center gap-2">
                            <Search size={16} />
                            View Ads
                        </span>
                    </Link>
                    <button
                        onClick={() => {
                            onOpenDetails(user);
                            onClose();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                        <UserIcon size={16} />
                        Quick Details
                    </button>
                    <button
                        onClick={() => {
                            onOpenAction(user.isVerified ? "unverify" : "verify", user);
                            onClose();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                        <Shield size={16} />
                        {user.isVerified ? "Revoke Verification" : "Verify User"}
                    </button>

                    <hr className="my-1 border-slate-100" />

                    {isManagedUserActive(user.status) ? (
                        <button
                            onClick={() => {
                                onOpenAction("ban", user);
                                onClose();
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-700 hover:bg-red-50"
                        >
                            <Ban size={16} />
                            Block User
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                onOpenAction("activate", user);
                                onClose();
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-emerald-700 hover:bg-emerald-50"
                        >
                            <PlayCircle size={16} />
                            Reactivate Account
                        </button>
                    )}
                </div>
            ) : null}
        </div>
    );
}
