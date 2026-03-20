/**
 * ESPAREX — Chat System Enums (SSOT)
 * Shared between backend, frontend, and admin-frontend.
 */

/* -------------------------------------------------------------------------- */
/* Conversation Status                                                         */
/* -------------------------------------------------------------------------- */

export const CHAT_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  CLOSED: 'closed',       // ad sold / expired / admin forced close
} as const;

export type ChatStatusValue = (typeof CHAT_STATUS)[keyof typeof CHAT_STATUS];
export const CHAT_STATUS_VALUES = Object.values(CHAT_STATUS) as [ChatStatusValue, ...ChatStatusValue[]];

/* -------------------------------------------------------------------------- */
/* Message Status                                                              */
/* -------------------------------------------------------------------------- */

export const MSG_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  DELETED: 'deleted',
} as const;

export type MsgStatusValue = (typeof MSG_STATUS)[keyof typeof MSG_STATUS];
export const MSG_STATUS_VALUES = Object.values(MSG_STATUS) as [MsgStatusValue, ...MsgStatusValue[]];

/* -------------------------------------------------------------------------- */
/* Chat Report Status                                                          */
/* -------------------------------------------------------------------------- */

export const CHAT_REPORT_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
} as const;

export type ChatReportStatusValue = (typeof CHAT_REPORT_STATUS)[keyof typeof CHAT_REPORT_STATUS];
export const CHAT_REPORT_STATUS_VALUES = Object.values(CHAT_REPORT_STATUS) as [ChatReportStatusValue, ...ChatReportStatusValue[]];

/* -------------------------------------------------------------------------- */
/* Chat Report Reason                                                          */
/* -------------------------------------------------------------------------- */

export const CHAT_REPORT_REASON = {
  SPAM: 'SPAM',
  SCAM: 'SCAM',
  ABUSE: 'ABUSE',
  FAKE: 'FAKE',
  OTHER: 'OTHER',
} as const;

export type ChatReportReasonValue = (typeof CHAT_REPORT_REASON)[keyof typeof CHAT_REPORT_REASON];
export const CHAT_REPORT_REASON_VALUES = Object.values(CHAT_REPORT_REASON) as [ChatReportReasonValue, ...ChatReportReasonValue[]];
