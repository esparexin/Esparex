"use client";

import { usePostAdFlow } from "../../context";
import { cn } from "@/components/ui/utils";
import { Check } from "@/icons/IconRegistry";

const STEPS = [
  { id: 1, label: "Information" },
  { id: 2, label: "Details & Photos" },
];

export function StepProgressBar() {
  const { currentStep, isEditMode } = usePostAdFlow();

  if (isEditMode) return null;

  const progressPercent = currentStep === 1 ? 50 : 100;

  return (
    <div className="w-full space-y-2 mb-2">
      {/* Progress Track */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step Pills */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        {STEPS.map((step) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-1.5 transition-colors",
                isCurrent && "text-blue-700 font-bold",
                isComplete && "text-slate-900 font-semibold"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-tiny font-bold transition-all",
                  isComplete && "bg-emerald-600 text-white",
                  isCurrent && "bg-blue-600 text-white ring-2 ring-blue-100",
                  !isComplete && !isCurrent && "bg-slate-100 text-slate-400"
                )}
              >
                {isComplete ? <Check className="w-3 h-3 stroke-[3]" /> : step.id}
              </span>
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
