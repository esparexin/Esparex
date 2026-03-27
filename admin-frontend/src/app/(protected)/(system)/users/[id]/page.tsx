"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_UI_ROUTES } from "@/lib/adminUiRoutes";
import type { User } from "@/types/user";
import { ArrowLeft, Mail, Phone, Shield, User as UserIcon } from "lucide-react";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default function UserDetailsPage({ params }: Props) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<User | null>(null);

    const { id: userId } = React.use(params);

    const normalizeUser = (raw: Record<string, unknown>): User => ({
        id: String(raw.id || raw._id || ""),
        name: String(raw.name || ""),
        email: String(raw.email || ""),
        mobile: (typeof raw.mobile === "string" ? raw.mobile : "") as string,
        role: (raw.role as User["role"]) || "user",
        status: (raw.status as User["status"]) || "active",
        isVerified: Boolean(raw.isVerified),
        isPhoneVerified: Boolean(raw.isPhoneVerified),
        isEmailVerified: Boolean(raw.isEmailVerified),
        businessStatus: (typeof raw.businessStatus === "string" ? raw.businessStatus : undefined) as any,
        totalAdsPosted: typeof raw.totalAdsPosted === "number" ? raw.totalAdsPosted : undefined,
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
        updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date(0).toISOString(),
    } as any);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await adminFetch<unknown>(ADMIN_ROUTES.USER_BY_ID(userId));
                const parsed = parseAdminResponse<never, Record<string, unknown>>(response);
                const payload = parsed.data || null;
                const resolvedUser = payload ? normalizeUser(payload) : null;

                if (cancelled) return;
                setUser(resolvedUser);
                if (!resolvedUser) {
                    setError("User not found");
                }
            } catch (fetchError) {
                if (cancelled) return;
                setError(fetchError instanceof Error ? fetchError.message : "Failed to load user details");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    return (
        <div className="space-y-6">
            <Link
                href={ADMIN_UI_ROUTES.users()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
                <ArrowLeft size={14} /> Back to Users
            </Link>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                {loading && <p className="text-sm text-slate-500">Loading user details...</p>}
                {error && !loading && <p className="text-sm text-red-600">{error}</p>}

                {!loading && !error && user && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                <UserIcon size={20} />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-slate-900">{user.name}</h1>
                                <p className="text-sm text-slate-500">User ID: {user.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-lg border border-slate-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                                <p className="mt-2 flex items-center gap-2 text-sm text-slate-700"><Mail size={14} /> {user.email}</p>
                                <p className="mt-1 flex items-center gap-2 text-sm text-slate-700"><Phone size={14} /> {user.mobile || "N/A"}</p>
                            </div>

                            <div className="rounded-lg border border-slate-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account</p>
                                <p className="mt-2 flex items-center gap-2 text-sm text-slate-700"><Shield size={14} /> Role: {user.role}</p>
                                <p className="mt-1 text-sm text-slate-700">Status: {user.status}</p>
                                <p className="mt-1 text-sm text-slate-700">Verified: {user.isVerified ? "Yes" : "No"}</p>
                                <p className="mt-1 text-sm text-slate-700">Created: {new Date(user.createdAt as string).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick Access</p>
                            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                <Link href={ADMIN_UI_ROUTES.ads({ status: "all", sellerId: user.id })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    View User Ads
                                </Link>
                                <Link href={ADMIN_UI_ROUTES.reports({ status: "open" })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    View Reports Queue
                                </Link>
                                <Link href={ADMIN_UI_ROUTES.finance({ search: user.id })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    View User Payments
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
