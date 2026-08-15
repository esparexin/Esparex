"use client";

import { CheckCircle2, Sparkles, Zap, Package, BellRing } from "@/icons/IconRegistry";
import type { ProfilePlan } from "../types";

export type PlanCardItem = Omit<ProfilePlan, 'type'> & { type: string };

interface DynamicPlanCardProps {
  plan: PlanCardItem;
  isCurrent: boolean;
  onSelect: (plan: PlanCardItem) => void;
}

export function DynamicPlanCard({ plan, isCurrent, onSelect }: DynamicPlanCardProps) {
  const isSpotlight = plan.type === 'Spotlight';
  const isTopAd = plan.type === 'Top Ad';
  const isMoreAds = plan.type === 'More Ads';
  const isAlertSlots = plan.type === 'Alert Slots';

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between relative overflow-hidden bg-white shadow-xs ${
        isCurrent
          ? 'border-blue-600 ring-2 ring-blue-500/20'
          : isSpotlight
          ? 'border-amber-200 hover:border-amber-400 hover:shadow-md'
          : isTopAd
          ? 'border-blue-200 hover:border-blue-400 hover:shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {plan.popular && !isCurrent && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-bl-xl shadow-xs">
          Popular
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isSpotlight
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : isTopAd
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : isMoreAds
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isSpotlight && <Sparkles className="h-3 w-3 text-amber-500 fill-amber-400" />}
            {isTopAd && <Zap className="h-3 w-3 text-blue-600" />}
            {isMoreAds && <Package className="h-3 w-3 text-indigo-600" />}
            {isAlertSlots && <BellRing className="h-3 w-3 text-emerald-600" />}
            <span>{plan.type}</span>
          </span>

          {isCurrent && (
            <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          )}
        </div>

        <h4 className="text-base font-bold text-slate-900 tracking-tight">{plan.name}</h4>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900">₹{plan.price.toLocaleString()}</span>
          <span className="text-xs font-semibold text-slate-500">/ {plan.duration}</span>
        </div>

        {plan.features && plan.features.length > 0 && (
          <ul className="mt-4 space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3">
            {plan.features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{feat}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => onSelect(plan)}
        className={`w-full h-10 mt-5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          isCurrent
            ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200'
            : isSpotlight
            ? 'bg-amber-500 hover:bg-amber-600 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        disabled={isCurrent}
      >
        {isCurrent ? 'Current Plan' : 'Purchase Package'}
      </button>
    </div>
  );
}
