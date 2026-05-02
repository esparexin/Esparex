import type { SystemConfigPatch } from "@/types/systemConfig";
import type { SystemConfig } from "@/types/systemConfig";

export type SettingsSaveHandler = (patch: SystemConfigPatch, successMessage: string) => Promise<{ success: boolean; error?: string } | void>;

export type SectionProps = {
  config: SystemConfig | null;
  saving: boolean;
  onSave: SettingsSaveHandler;
};
