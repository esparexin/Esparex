import React, { useState } from 'react';
import { DynamicPlanCard } from '../cards/DynamicPlanCard';
import type { ProfilePlan } from '../types';

export type PlanCard = Omit<ProfilePlan, 'type'> & { type: string };

const DEFAULT_CATEGORIES: string[] = ['More Ads', 'Spotlight', 'Top Ad', 'Alert Slots'];

export interface BuyPlansSectionProps {
  dynamicPlans: PlanCard[];
  currentPlan: string;
  onSelectPlan: (plan: PlanCard) => void;
}

export const BuyPlansSection: React.FC<BuyPlansSectionProps> = ({
  dynamicPlans,
  currentPlan,
  onSelectPlan,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('More Ads');

  const availableCategories = Array.from(
    new Set([
      ...dynamicPlans.map((p) => p.type).filter(Boolean),
      ...DEFAULT_CATEGORIES,
    ])
  );

  const currentCategory = availableCategories.includes(selectedCategory)
    ? selectedCategory
    : availableCategories[0] || 'More Ads';

  const filteredPlans = dynamicPlans.filter((plan) => plan.type === currentCategory);

  return (
    <div id="panel-buy-plans" role="tabpanel" aria-labelledby="tab-buy-plans" className="flex flex-col gap-3 sm:gap-4">
      {/* Free-Flowing Category Filter Pills Bar */}
      <div className="overflow-x-auto scrollbar-hide py-1 -mx-1 px-1">
        <div
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-max sm:w-auto"
          role="tablist"
          aria-label="Plan Categories"
        >
          {availableCategories.map((catType) => {
            const count = dynamicPlans.filter((p) => p.type === catType).length;
            const isSelected = currentCategory === catType;

            return (
              <button
                key={catType}
                id={`cat-tab-${catType.replace(/\s+/g, '-').toLowerCase()}`}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(catType)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-caption font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card text-foreground-secondary hover:text-foreground hover:bg-muted border border-border shadow-2xs'
                }`}
              >
                <span>{catType}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-tiny font-semibold ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-foreground-secondary'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Standardized Compact Package Cards Grid */}
      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <DynamicPlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentPlan === plan.id}
              onSelect={onSelectPlan}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-8 border border-border text-center space-y-2 shadow-xs">
          <h4 className="text-body-lg font-semibold text-foreground">No Packages Available</h4>
          <p className="text-caption text-foreground-subtle">
            There are currently no active packages in the {currentCategory} category.
          </p>
        </div>
      )}
    </div>
  );
};
