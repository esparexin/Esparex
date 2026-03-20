"use client";

import { useEffect, useState } from "react";
import { SaveButton, SettingsSection, Toggle } from "./shared";
import type { SectionProps } from "./types";

export function PaymentSettings({ config, saving, onSave }: SectionProps) {
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    setRazorpayEnabled(Boolean(config?.integrations?.payment?.razorpay?.enabled ?? false));
    setStripeEnabled(Boolean(config?.integrations?.payment?.stripe?.enabled ?? false));
  }, [config]);

  return (
    <SettingsSection
      title="Payments"
      description="Enable or disable supported payment gateways."
      actions={
        <SaveButton
          saving={saving}
          onClick={() =>
            void onSave(
              {
                integrations: {
                  payment: {
                    razorpay: { enabled: razorpayEnabled },
                    stripe: { enabled: stripeEnabled }
                  }
                }
              },
              "Payment settings updated"
            )
          }
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <span className="text-sm font-medium text-slate-900">Razorpay</span>
          <Toggle checked={razorpayEnabled} onChange={setRazorpayEnabled} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
          <span className="text-sm font-medium text-slate-900">Stripe</span>
          <Toggle checked={stripeEnabled} onChange={setStripeEnabled} />
        </div>
      </div>
    </SettingsSection>
  );
}

