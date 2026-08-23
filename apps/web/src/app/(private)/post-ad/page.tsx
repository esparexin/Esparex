import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@esparex/ui";
import PostAdPageClient from "@/components/user/post-ad/PostAdPageClient";

import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";
import { buildLoginUrl } from "@/lib/authHelpers";

type PostingBalancePayload = {
    totalRemaining?: number;
    freeRemaining?: number;
    paidCredits?: number;
};

type PostingBalanceResponse = {
    success?: boolean;
    data?: PostingBalancePayload;
    error?: string;
};

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`
).replace(/\/$/, "");

const loginRedirectUrl = buildLoginUrl("/post-ad");

async function fetchPostingBalance(cookieHeader: string): Promise<{ balance: PostingBalancePayload | null; status: number }> {
    try {
        // SSR exception documented in docs/api-ssr-fetch-exceptions.md
        const response = await fetch(`${API_BASE}/${API_ROUTES.USER.USERS_POSTING_BALANCE}`, {
            method: "GET",
            headers: {
                Cookie: cookieHeader,
                Accept: "application/json"
            },
            cache: "no-store"
        });

        if (response.status === 401) {
            return { balance: null, status: 401 };
        }

        if (!response.ok) {
            return { balance: null, status: response.status };
        }

        const payload = (await response.json()) as PostingBalanceResponse;
        return { balance: payload.data || null, status: response.status };
    } catch {
        return { balance: null, status: 503 };
    }
}

export default async function PostAdPage() {
    const bypassQuotaCheck = process.env.BYPASS_POST_AD_QUOTA_CHECK === "true";
    if (bypassQuotaCheck) {
        return <PostAdPageClient />;
    }

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const { balance, status } = await fetchPostingBalance(cookieHeader);

    if (status === 401) {
        redirect(loginRedirectUrl);
    }

    const totalRemaining = balance?.totalRemaining ?? 0;

    if (!balance || totalRemaining <= 0) {
        return (
            <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center px-4 py-12">
                <Card className="max-w-md w-full bg-white rounded-2xl border border-amber-200/80 shadow-sm p-6 sm:p-8 space-y-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            No Ad Posting Slots Remaining
                        </h1>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            You have used all your available free ad posting slots for this month. Buy an Ad Pack to post more ads, or wait for your monthly free slots to reset.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Link
                            href="/account/plans"
                            className="w-full inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-sm h-11 px-4 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        >
                            Buy Ad Pack
                        </Link>
                        <Link
                            href="/"
                            className="w-full inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-semibold text-sm h-11 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                        >
                            Back to Home
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return <PostAdPageClient />;
}

