"use strict";
/**
 * ESPAREX — Chat System Enums (SSOT)
 * Shared between backend, frontend, and apps/admin.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_REPORT_REASON_VALUES = exports.CHAT_REPORT_REASON = exports.CHAT_REPORT_STATUS_VALUES = exports.CHAT_REPORT_STATUS = exports.MSG_STATUS_VALUES = exports.MSG_STATUS = exports.CHAT_STATUS_VALUES = exports.CHAT_STATUS = void 0;
/* -------------------------------------------------------------------------- */
/* Conversation Status                                                         */
/* -------------------------------------------------------------------------- */
exports.CHAT_STATUS = {
    ACTIVE: 'active',
    BLOCKED: 'blocked',
    CLOSED: 'closed', // ad sold / expired / admin forced close
};
exports.CHAT_STATUS_VALUES = Object.values(exports.CHAT_STATUS);
/* -------------------------------------------------------------------------- */
/* Message Status                                                              */
/* -------------------------------------------------------------------------- */
exports.MSG_STATUS = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
    DELETED: 'deleted',
};
exports.MSG_STATUS_VALUES = Object.values(exports.MSG_STATUS);
/* -------------------------------------------------------------------------- */
/* Chat Report Status                                                          */
/* -------------------------------------------------------------------------- */
exports.CHAT_REPORT_STATUS = {
    OPEN: 'open',
    UNDER_REVIEW: 'under_review',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed',
};
exports.CHAT_REPORT_STATUS_VALUES = Object.values(exports.CHAT_REPORT_STATUS);
/* -------------------------------------------------------------------------- */
/* Chat Report Reason                                                          */
/* -------------------------------------------------------------------------- */
exports.CHAT_REPORT_REASON = {
    SPAM: 'SPAM',
    SCAM: 'SCAM',
    ABUSE: 'ABUSE',
    FAKE: 'FAKE',
    OTHER: 'OTHER',
};
exports.CHAT_REPORT_REASON_VALUES = Object.values(exports.CHAT_REPORT_REASON);
//# sourceMappingURL=chatStatus.js.map