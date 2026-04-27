"use strict";
/**
 * Status Query Mapper
 * Enterprise utility for building legacy-aware MongoDB status queries.
 * Standardizes mapping of canonical 'live', 'pending' statuses to multiple DB-level string values.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusMatchCriteria = getStatusMatchCriteria;
exports.getLiveStatusCriteria = getLiveStatusCriteria;
/**
 * Returns a MongoDB query object or literal for a requested status.
 * e.g. mapping 'live' to { $in: ['live', 'approved', 'active'] }
 */
function getStatusMatchCriteria(requestedStatus) {
    const statuses = Array.isArray(requestedStatus) ? requestedStatus : [requestedStatus];
    const expanded = [];
    statuses.forEach(s => {
        const lower = s.trim().toLowerCase();
        if (lower === 'live' || lower === 'approved' || lower === 'active' || lower === 'published') {
            expanded.push('live', 'approved', 'active', 'published');
        }
        else if (lower === 'pending' || lower === 'held_for_review') {
            expanded.push('pending', 'held_for_review', 'suspended');
        }
        else {
            expanded.push(lower);
        }
    });
    const unique = Array.from(new Set(expanded));
    return unique.length === 1 ? unique[0] : { $in: unique };
}
/**
 * Convenience helper for building the 'live' only public visibility filter.
 */
function getLiveStatusCriteria() {
    return getStatusMatchCriteria('live');
}
//# sourceMappingURL=statusQueryMapper.js.map