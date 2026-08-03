/**
 * Moderation Reason Enum — Enterprise Platform SSOT
 *
 * Extensible reasons attached to moderation decisions and audit logs.
 */
export const MODERATION_REASON = {
    EXPLICIT_NUDITY: 'explicit_nudity',
    GRAPHIC_VIOLENCE: 'graphic_violence',
    OFFENSIVE_TEXT: 'offensive_text',
    PHONE_NUMBER_IN_IMAGE: 'phone_number_in_image',
    URL_IN_IMAGE: 'url_in_image',
    QR_CODE_IN_IMAGE: 'qr_code_in_image',
    LOW_RELEVANCE: 'low_relevance',
    DUPLICATE_IMAGE: 'duplicate_image',
    SPAM_TEXT: 'spam_text',
    UNVERIFIED_DOCUMENT: 'unverified_document',
    MANUAL_OVERRIDE: 'manual_override',
    PROVIDER_TIMEOUT: 'provider_timeout',
} as const;

export type ModerationReasonValue = (typeof MODERATION_REASON)[keyof typeof MODERATION_REASON];

export const MODERATION_REASON_VALUES = Object.values(MODERATION_REASON) as [
    ModerationReasonValue,
    ...ModerationReasonValue[]
];
