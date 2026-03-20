"use client";

import { useEffect, useState } from "react";
import { Field, SaveButton, SettingsSection } from "./shared";
import type { SectionProps } from "./types";

export function FraudSettings({ config, saving, onSave }: SectionProps) {
  const [scamDetection, setScamDetection] = useState(75);
  const [spamDetection, setSpamDetection] = useState(70);
  const [counterfeits, setCounterfeits] = useState(85);

  useEffect(() => {
    const thresholds = config?.ai?.moderation?.thresholds;
    setScamDetection(Number(thresholds?.scamDetection ?? 75));
    setSpamDetection(Number(thresholds?.spamDetection ?? 70));
    setCounterfeits(Number(thresholds?.counterfeits ?? 85));
  }, [config]);

  return (
    <SettingsSection
      title="Fraud Detection"
      description="Risk signal thresholds used by AI moderation."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                ai: {
                  moderation: {
                    thresholds: {
                      scamDetection,
                      spamDetection,
                      counterfeits
                    }
                  }
                }
              },
              "Fraud detection settings updated"
            )
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Scam Detection">
          <input
            type="number"
            min={1}
            max={100}
            value={scamDetection}
            onChange={(e) => setScamDetection(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Spam Detection">
          <input
            type="number"
            min={1}
            max={100}
            value={spamDetection}
            onChange={(e) => setSpamDetection(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Counterfeits">
          <input
            type="number"
            min={1}
            max={100}
            value={counterfeits}
            onChange={(e) => setCounterfeits(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </Field>
      </div>
    </SettingsSection>
  );
}

