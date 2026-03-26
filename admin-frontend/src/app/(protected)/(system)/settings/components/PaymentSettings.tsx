"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Razorpay",
    description: "Enable Razorpay gateway for marketplace payments.",
    path: "payment.razorpay.enabled",
    default: false,
  },
  {
    type: "toggle",
    label: "Stripe",
    description: "Enable Stripe gateway for marketplace payments.",
    path: "payment.stripe.enabled",
    default: false,
  },
];

export function PaymentSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Payments"
      description="Enable or disable supported payment gateways."
      configPath="integrations"
      successMessage="Payment settings updated"
      fields={FIELDS}
    />
  );
}

