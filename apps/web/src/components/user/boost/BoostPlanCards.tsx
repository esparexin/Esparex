"use client";

import { Badge } from "../../ui/badge";
import { Zap, Sparkles, CheckCircle2 } from "@/icons/IconRegistry";
import { formatPrice } from "@/lib/formatters";
import { formatPlanName, type BoostPlan, type PromotionCategory } from "@/hooks/useBoostPlanDialog";

/* -------------------------------------------------------------------------- */
/* Wallet credit selection card                                                */
/* -------------------------------------------------------------------------- */

export function WalletCreditCard({
  activeCategory,
  availableCredits,
  selectedPlan,
  boostPlans,
  isSelected,
  onSelect,
}: {
  activeCategory: PromotionCategory;
  availableCredits: number;
  selectedPlan: BoostPlan | null;
  boostPlans: BoostPlan[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isSpotlight = activeCategory === "SPOTLIGHT";
  const creditType = isSpotlight ? "Spotlight" : "Top Ad";
  const duration = selectedPlan?.durationDays || boostPlans[0]?.durationDays || 30;

  return (
    <div
      onClick={onSelect}
      className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? isSpotlight
            ? "border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/40 shadow-xs"
            : "border-blue-400 bg-blue-50/70 ring-2 ring-blue-300/40 shadow-xs"
          : isSpotlight
          ? "border-amber-200/80 bg-amber-50/30 hover:bg-amber-50/50"
          : "border-blue-200/80 bg-blue-50/30 hover:bg-blue-50/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSelected
              ? isSpotlight
                ? "bg-amber-500 text-white"
                : "bg-blue-600 text-white"
              : isSpotlight
              ? "bg-amber-100 text-amber-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {isSpotlight ? (
            <Sparkles className="h-4.5 w-4.5" />
          ) : (
            <Zap className="h-4.5 w-4.5" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Use {creditType} Credit
            </h4>
            <span
              className={`text-tiny font-bold px-2 py-0.5 rounded-full border ${
                isSpotlight
                  ? "bg-amber-100/90 text-amber-900 border-amber-200"
                  : "bg-blue-100/90 text-blue-900 border-blue-200"
              }`}
            >
              {availableCredits} available in wallet
            </span>
          </div>
          <p className="text-tiny text-slate-600 mt-0.5 font-medium">
            Deducts 1 credit to promote this listing for {duration} days
          </p>
        </div>
      </div>
      <div className="text-right shrink-0 pl-3">
        <p
          className={`text-xs font-bold ${
            isSpotlight ? "text-amber-600" : "text-blue-600"
          }`}
        >
          1 Credit
        </p>
        <p className="text-tiny text-foreground-subtle font-medium">₹0 to pay</p>
        {isSelected && (
          <CheckCircle2
            className={`h-4 w-4 ml-auto mt-0.5 ${
              isSpotlight ? "text-amber-600" : "text-blue-600"
            }`}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Catalog plan selection card                                                 */
/* -------------------------------------------------------------------------- */

export function CatalogPlanCard({
  plan,
  activeCategory,
  isSelected,
  onSelect,
}: {
  plan: BoostPlan;
  activeCategory: PromotionCategory;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const formattedName = formatPlanName(plan.name);
  return (
    <div
      onClick={onSelect}
      className={`relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
        isSelected
          ? activeCategory === "SPOTLIGHT"
            ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-300/40 shadow-xs"
            : "border-blue-400 bg-blue-50/60 ring-2 ring-blue-300/40 shadow-xs"
          : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
            isSelected
              ? activeCategory === "SPOTLIGHT"
                ? "bg-amber-500 text-white"
                : "bg-blue-600 text-white"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {activeCategory === "SPOTLIGHT" ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-800">{formattedName}</h4>
            <Badge
              className={`text-tiny px-1.5 py-0 font-semibold border-0 ${
                activeCategory === "SPOTLIGHT"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {plan.displayBoost} Visibility
            </Badge>
          </div>
          <p className="text-tiny text-slate-500 mt-0.5">
            {activeCategory === "SPOTLIGHT" ? "Featured" : "Top Placement"} for{" "}
            {plan.durationDays} Days
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-slate-900">
          {plan.price === 0 ? "FREE" : formatPrice(plan.price)}
        </p>
        {isSelected && (
          <CheckCircle2
            className={`h-4 w-4 ml-auto mt-0.5 ${
              activeCategory === "SPOTLIGHT" ? "text-amber-500" : "text-blue-500"
            }`}
          />
        )}
      </div>
    </div>
  );
}
