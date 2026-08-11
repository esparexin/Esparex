"use client";

import Link from "next/link";
import { ExternalLink, Tag } from "@esparex/ui";
import type { SectionProps } from "./types";

export function DisplayAdsSettings(_props: SectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
          <Tag size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Google Ads & Monetization Center</h3>
          <p className="text-xs text-slate-500">
            AdSense placements, slot IDs, target viewports, responsive rules, and fallback strategies are centrally managed in the Google Ads Management Console.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-800">Dynamic Single Source of Truth (SSOT)</p>
          <p className="text-tiny text-slate-500">
            Manage live ad units, priority sorting, status toggles, and viewports without developer redeployment.
          </p>
        </div>
        <Link
          href="/google-ads"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition-all shrink-0"
        >
          Open Google Ads Console <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
