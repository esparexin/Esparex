import { useState, useCallback } from "react";
import { getSystemConfig, updateSystemConfig } from "@/lib/api/systemConfig";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import type { SystemConfig, SystemConfigPatch } from "@/types/systemConfig";

export function useSystemConfig() {
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadConfig = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getSystemConfig();
            setConfig(data);
        } catch (loadError) {
            const msg = loadError instanceof Error ? loadError.message : "Failed to load system configuration";
            setError(msg);
            showAdminPopup({ type: "error", title: "Error", message: msg });
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSaveSection = async (patch: SystemConfigPatch, successMessage: string) => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const updated = await updateSystemConfig(patch);
            setConfig(updated);
            setSuccess(successMessage);
            showAdminPopup({ type: "success", title: "Success", message: successMessage });
            return { success: true };
        } catch (saveError) {
            const msg = saveError instanceof Error ? saveError.message : "Failed to update settings";
            setError(msg);
            showAdminPopup({ type: "error", title: "Error", message: msg });
            return { success: false, error: msg };
        } finally {
            setSaving(false);
        }
    };

    return {
        config,
        loading,
        saving,
        error,
        success,
        setError,
        setSuccess,
        loadConfig,
        handleSaveSection
    };
}
