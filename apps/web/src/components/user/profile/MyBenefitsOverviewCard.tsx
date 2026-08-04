import { useUserBenefits } from '@/hooks/useUserBenefits';

export function MyBenefitsOverviewCard() {
    const { benefits, isLoading } = useUserBenefits();

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 animate-pulse space-y-3">
                <div className="h-4 w-40 bg-slate-100 rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="h-12 bg-slate-100 rounded-xl" />
                    <div className="h-12 bg-slate-100 rounded-xl" />
                    <div className="h-12 bg-slate-100 rounded-xl" />
                    <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
            </div>
        );
    }

    const freeSlots = benefits?.balances.freeMonthlySlots.remaining ?? 0;
    const freeTotal = benefits?.balances.freeMonthlySlots.total ?? 5;
    const paidCredits = benefits?.balances.purchasedAdCredits.remaining ?? 0;
    const spotlightCredits = benefits?.balances.spotlightCredits.remaining ?? 0;
    const topAdCredits = benefits?.balances.topAdCredits.remaining ?? 0;
    const userTier = benefits?.userTier ?? 'FREE_SELLER';

    return (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-slate-50/80 p-4 sm:p-5 shadow-xs text-slate-900 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs">
                        💼
                    </span>
                    <div>
                        <h3 className="text-sm font-bold tracking-tight text-slate-900">
                            My Benefits Overview
                        </h3>
                        <p className="text-tiny text-slate-500">
                            Active tier: <span className="font-semibold text-blue-700">{userTier}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-tiny font-bold text-emerald-800">
                        Active Wallet
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="rounded-xl border border-slate-200/80 bg-white/90 p-2.5 text-center">
                    <p className="text-tiny font-medium text-slate-500">Free Monthly Slots</p>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight mt-0.5">
                        {freeSlots} <span className="text-xs text-slate-400 font-normal">/ {freeTotal}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Resets 1st of Month</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white/90 p-2.5 text-center">
                    <p className="text-tiny font-medium text-slate-500">Purchased Ad Credits</p>
                    <p className="text-base sm:text-lg font-extrabold text-blue-600 tracking-tight mt-0.5">
                        {paidCredits}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Never Expires</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white/90 p-2.5 text-center">
                    <p className="text-tiny font-medium text-slate-500">Spotlight Boosts</p>
                    <p className="text-base sm:text-lg font-extrabold text-amber-600 tracking-tight mt-0.5">
                        {spotlightCredits}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Top Search Visibility</p>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-white/90 p-2.5 text-center">
                    <p className="text-tiny font-medium text-slate-500">Top Ad Pushes</p>
                    <p className="text-base sm:text-lg font-extrabold text-purple-600 tracking-tight mt-0.5">
                        {topAdCredits}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Instant Bump</p>
                </div>
            </div>
        </div>
    );
}

export default MyBenefitsOverviewCard;
