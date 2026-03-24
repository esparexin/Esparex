import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import PostAdPageClient from "@/components/user/post-ad/PostAdPageClient";
import {
    API_ROUTES,
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "@/lib/api/routes";

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

const loginRedirectUrl = "/login?callbackUrl=%2Fpost-ad";

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
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const { balance, status } = await fetchPostingBalance(cookieHeader);

    if (status === 401) {
        redirect(loginRedirectUrl);
    }

    const bypassQuotaCheck = process.env.BYPASS_POST_AD_QUOTA_CHECK === "true";
    const totalRemaining = balance?.totalRemaining ?? 0;
    if (!bypassQuotaCheck && (!balance || totalRemaining <= 0)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center px-4">
                <div className="max-w-lg w-full rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-4">
                    <div>
                        <h1 className="text-xl font-semibold text-amber-900">Unable to post a new ad</h1>
                        <p className="mt-2 text-sm text-amber-800">
                            You have no ad posting slots remaining. Buy an Ad Pack to post more ads, or wait for your monthly free slots to reset.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <a
                            href="/account/plans"
                            className="flex-1 inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm h-11 px-4 transition-colors"
                        >
                            Buy Ad Pack
                        </a>
                        <a
                            href="/"
                            className="flex-1 inline-flex items-center justify-center rounded-xl bg-white border border-amber-300 text-amber-800 font-semibold text-sm h-11 px-4 hover:bg-amber-50 transition-colors"
                        >
                            Back to Home
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return <PostAdPageClient />;
}
