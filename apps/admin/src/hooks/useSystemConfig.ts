import { useState, useCallback } from "react";
import { getSystemConfig, updateSystemConfig } from "@/lib/api/systemConfig";
import { useToast } from "@/context/ToastContext";
import type { SystemConfig, SystemConfigPatch } from "@/types/systemConfig";

export function useSystemConfig() {
    const { showToast } = useToast();
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
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleSaveSection = async (patch: SystemConfigPatch, successMessage: string) => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const updated = await updateSystemConfig(patch);
            setConfig(updated);
            setSuccess(successMessage);
            showToast(successMessage, "success");
            return { success: true };
        } catch (saveError) {
            const msg = saveError instanceof Error ? saveError.message : "Failed to update settings";
            setError(msg);
            showToast(msg, "error");
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
