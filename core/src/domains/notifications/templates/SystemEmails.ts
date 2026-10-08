// --- SystemEmails (P3 extract-before-split from EmailLayout) ---
// Ops/system alert emails. Single owner per group.
import { escapeHtml, renderEmailLayout } from './EmailLayoutBase';

/**
 * Reliability / Ops System Alert Email
 * Used for internal ops-facing alerts (system health, DLQ spikes, circuit breakers).
 * Metadata JSON must be pre-escaped before passing to this function.
 */
export function renderReliabilityAlertEmail(params: {
    title: string;
    severity: string;
    type: string;
    service: string;
    module: string;
    summary: string;
    timestamp: string;
    metadataJson: string;
}): string {
    const severityColor = params.severity === 'critical'
        ? '#dc2626'
        : params.severity === 'high'
            ? '#ea580c'
            : '#ca8a04';

    const contentHtml = `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 0 0 16px 0;">
            <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${escapeHtml(severityColor)};
                text-transform: uppercase;">
                ${escapeHtml(params.severity)} ALERT
            </p>
        </div>
        <p><strong>Type:</strong> ${escapeHtml(params.type)}</p>
        <p><strong>Service:</strong> ${escapeHtml(params.service)}</p>
        <p><strong>Module:</strong> ${escapeHtml(params.module)}</p>
        <p><strong>Summary:</strong> ${escapeHtml(params.summary)}</p>
        <p><strong>Timestamp:</strong> ${escapeHtml(params.timestamp)}</p>
        <h3 style="font-size: 14px; margin: 24px 0 8px 0; color: #374151;">Metadata</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:6px;overflow:auto;font-size:12px;
            line-height:1.5;color:#1f2937;">${params.metadataJson}</pre>
    `;

    return renderEmailLayout({
        title: params.title,
        preheader: `[${params.severity.toUpperCase()}] ${params.summary}`,
        contentHtml,
        footerNote: 'This is an automated ops alert from the Esparex reliability monitoring system.',
    });
}
