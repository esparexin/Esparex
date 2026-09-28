"use client";

import { useCallback, useEffect, useState } from "react";
import {
    type EmailTemplateCustomization,
    type EmailTemplateDTO,
    type EmailTemplateKey,
    type EmailTemplatePreviewDTO,
    type UpdateEmailTemplatePayload,
} from "@esparex/contracts";
import {
    getEmailTemplatePreview,
    listEmailTemplates,
    resetEmailTemplate,
    sendTestEmailTemplate,
    updateEmailTemplate,
} from "@/lib/api/emailTemplates";
import { showAdminPopup } from "@/lib/popup/popupEvents";

export function useAdminEmailTemplates() {
    const [templates, setTemplates] = useState<EmailTemplateDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reportLoadError = useCallback((err: unknown, silent: boolean) => {
        const message = err instanceof Error ? err.message : "Failed to load email templates";
        setError(message);
        if (!silent) showAdminPopup({ type: "error", title: "Templates Error", message });
    }, []);

    const loadTemplates = useCallback(async (isSilent = false) => {
        if (isSilent) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const data = await listEmailTemplates();
            setTemplates(data);
        } catch (err) {
            reportLoadError(err, isSilent);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [reportLoadError]);

    useEffect(() => {
        let isMounted = true;
        void listEmailTemplates()
            .then((data) => { if (isMounted) setTemplates(data); })
            .catch((err) => { if (isMounted) reportLoadError(err, false); })
            .finally(() => { if (isMounted) setLoading(false); });
        return () => { isMounted = false; };
    }, [reportLoadError]);

    const handleUpdateTemplate = useCallback(
        async (key: EmailTemplateKey, payload: UpdateEmailTemplatePayload): Promise<boolean> => {
            try {
                const updated = await updateEmailTemplate(key, payload);
                setTemplates((prev) => prev.map((t) => (t.key === key ? updated : t)));
                showAdminPopup({
                    type: "success",
                    title: "Template Updated",
                    message: `Email template "${updated.name}" has been updated successfully.`,
                });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to update email template";
                showAdminPopup({ type: "error", title: "Update Failed", message });
                return false;
            }
        },
        []
    );

    const handleResetTemplate = useCallback(async (key: EmailTemplateKey): Promise<boolean> => {
        try {
            const reset = await resetEmailTemplate(key);
            setTemplates((prev) => prev.map((t) => (t.key === key ? reset : t)));
            showAdminPopup({
                type: "success",
                title: "Template Reset",
                message: `Email template "${reset.name}" has been restored to system defaults.`,
            });
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to reset email template";
            showAdminPopup({ type: "error", title: "Reset Failed", message });
            return false;
        }
    }, []);

    const handleGetPreview = useCallback(
        async (
            key: EmailTemplateKey,
            customization?: Partial<EmailTemplateCustomization>
        ): Promise<EmailTemplatePreviewDTO | null> => {
            try {
                return await getEmailTemplatePreview(key, customization);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to generate preview";
                showAdminPopup({ type: "error", title: "Preview Error", message });
                return null;
            }
        },
        []
    );

    const handleSendTest = useCallback(
        async (
            key: EmailTemplateKey,
            recipientEmail: string,
            customization?: Partial<EmailTemplateCustomization>
        ): Promise<boolean> => {
            try {
                const result = await sendTestEmailTemplate(key, recipientEmail, customization);
                showAdminPopup({
                    type: "success",
                    title: "Test Dispatched",
                    message: `Test email dispatched to ${result.recipient}`,
                });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to send test email";
                showAdminPopup({ type: "error", title: "Send Failed", message });
                return false;
            }
        },
        []
    );

    return {
        templates, loading, refreshing, error,
        loadTemplates,
        updateTemplate: handleUpdateTemplate,
        resetTemplate: handleResetTemplate,
        getPreview: handleGetPreview,
        sendTestEmail: handleSendTest,
    };
}
