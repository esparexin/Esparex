"use client";

import Link from "next/link";
import { ExternalLink, Tag } from "@esparex/ui";
import type { SectionProps } from "./types";

export function DisplayAdsSettings(_props: SectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
          <Tag size={20} />
        </div>
        <div>
          <h3 className="text-body-lg font-bold text-foreground">Google Ads & Monetization Center</h3>
          <p className="text-caption text-foreground-subtle">
            AdSense placements, slot IDs, target viewports, responsive rules, and fallback strategies are centrally managed in the Google Ads Management Console.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-caption font-bold text-foreground">Dynamic Single Source of Truth (SSOT)</p>
          <p className="text-tiny text-foreground-subtle">
            Manage live ad units, priority sorting, status toggles, and viewports without developer redeployment.
          </p>
        </div>
        <Link
          href="/google-ads"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-caption font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all shrink-0"
        >
          Open Google Ads Console <ExternalLink size={14} />
        </Link>
      </div>
    </div>
  );
}
