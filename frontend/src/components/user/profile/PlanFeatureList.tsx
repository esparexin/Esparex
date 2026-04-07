import { CheckCircle2 } from "lucide-react";

import { cn } from "@/components/ui/utils";

interface PlanFeatureListProps {
  features: string[];
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function PlanFeatureList({
  features,
  className,
  itemClassName,
  iconClassName,
  textClassName,
}: PlanFeatureListProps) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {features.map((feature, index) => (
        <li key={index} className={cn("flex items-start gap-2 text-xs", itemClassName)}>
          <CheckCircle2
            className={cn("mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-link", iconClassName)}
          />
          <span className={cn("text-slate-600", textClassName)}>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
