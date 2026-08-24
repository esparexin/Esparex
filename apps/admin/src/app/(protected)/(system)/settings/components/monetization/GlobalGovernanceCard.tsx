"use client";

import type { MonetizationSystemState } from "@esparex/contracts";
import { Stack, Grid } from "@esparex/ui";

interface GlobalGovernanceCardProps {
  config: MonetizationSystemState;
  onChange: (updated: MonetizationSystemState) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function GlobalGovernanceCard({
  config,
  onChange,
  onSave,
  saving,
}: GlobalGovernanceCardProps) {
  return (
    <Stack gap="lg" className="rounded-2xl border border-border bg-card p-6 shadow-2xs">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-body-lg font-bold text-foreground">Global Monetization Governance</h3>
          <p className="text-caption text-foreground-subtle mt-0.5">
            Control advertising visibility, provider credentials, and live publishing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-caption font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <Grid cols={2} gap="md">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/40">
          <div>
            <span className="text-caption font-bold text-foreground block">Monetization Engine</span>
            <span className="text-tiny text-foreground-subtle">Enable backend advertising resolver &amp; campaign models</span>
          </div>
          <input
            type="checkbox"
            checked={config.featureEnabled}
            onChange={(e) => onChange({ ...config, featureEnabled: e.target.checked })}
            className="h-4 w-4 rounded text-primary focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/40">
          <div>
            <span className="text-caption font-bold text-foreground block">Publishing to Public Marketplace</span>
            <span className="text-tiny text-muted-foreground">Live serving of ads across Web and Mobile frontends</span>
          </div>
          <input
            type="checkbox"
            checked={config.publishingEnabled}
            onChange={(e) => onChange({ ...config, publishingEnabled: e.target.checked })}
            className="h-4 w-4 rounded text-primary focus:ring-primary"
          />
        </div>
      </Grid>

      <Stack gap="md" className="border-t border-border pt-4">
        <h4 className="text-caption font-bold uppercase tracking-wider text-muted-foreground">Google AdSense Integration</h4>
        <Grid cols={2} gap="md">
          <div>
            <label className="block text-caption font-semibold text-foreground mb-1">Publisher ID</label>
            <input
              type="text"
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              value={config.providers?.googleAdsense?.publisherId || ""}
              onChange={(e) =>
                onChange({
                  ...config,
                  providers: {
                    ...config.providers,
                    googleAdsense: {
                      publisherId: e.target.value,
                      autoAdsEnabled: config.providers?.googleAdsense?.autoAdsEnabled || false,
                    },
                  },
                })
              }
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-caption text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40 mt-5">
            <div>
              <span className="text-caption font-bold text-foreground block">Google Auto-Ads</span>
              <span className="text-tiny text-foreground-subtle">Allow Google to place automated responsive units</span>
            </div>
            <input
              type="checkbox"
              checked={config.providers?.googleAdsense?.autoAdsEnabled || false}
              onChange={(e) =>
                onChange({
                  ...config,
                  providers: {
                    ...config.providers,
                    googleAdsense: {
                      publisherId: config.providers?.googleAdsense?.publisherId || "",
                      autoAdsEnabled: e.target.checked,
                    },
                  },
                })
              }
              className="h-4 w-4 rounded text-primary focus:ring-primary"
            />
          </div>
        </Grid>
      </Stack>
    </Stack>
  );
}
