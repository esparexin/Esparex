"use client";

import { GenericSettingsSection, type SettingsFieldSchema } from "./GenericSettingsSection";
import type { SectionProps } from "./types";

const FIELDS: SettingsFieldSchema[] = [
  {
    type: "toggle",
    label: "Razorpay",
    description: "Disables new user checkout creation when turned off.",
    path: "payment.razorpay.enabled",
    default: false,
  },
  {
    type: "text",
    label: "Razorpay Key ID",
    path: "payment.razorpay.keyId",
    default: "",
  },
  {
    type: "password",
    label: "Razorpay Key Secret",
    path: "payment.razorpay.keySecret",
    default: "",
    placeholder: "Leave blank to keep current secret",
    preserveMasked: true,
  },
];

export function PaymentSettings(props: SectionProps) {
  return (
    <GenericSettingsSection
      {...props}
      title="Payments"
      description="Live marketplace checkout configuration for the active Razorpay gateway."
      configPath="integrations"
      successMessage="Payment settings updated"
      fields={FIELDS}
    />
  );
}
