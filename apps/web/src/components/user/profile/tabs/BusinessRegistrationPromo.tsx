"use client";

import { Button } from "@esparex/ui";
import { Building2, CheckCircle2 } from "@/icons/IconRegistry";

interface BusinessRegistrationPromoProps {
  onRegister: () => void;
}

export function BusinessRegistrationPromo({ onRegister }: BusinessRegistrationPromoProps) {
  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Register your business</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Create a verified business profile to list services and spare parts.
          </p>
        </div>
      </div>

      {/* Highlights List */}
      <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 pt-1">
        <li className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>Get a verified public business profile customers can trust.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>Post services and manage business listings from one workspace.</span>
        </li>
        <li className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>Use your real address and review documents once, then keep the profile updated.</span>
        </li>
      </ul>

      {/* CTA Button */}
      <Button
        onClick={onRegister}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-[0.98] mt-2"
      >
        Start business registration
      </Button>
    </div>
  );
}
