"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndexAuditTargets = getIndexAuditTargets;
function getIndexAuditTargets(candidates) {
    const seenConnectionIds = new Set();
    const targets = [];
    for (const candidate of candidates) {
        if (seenConnectionIds.has(candidate.connection.id)) {
            continue;
        }
        seenConnectionIds.add(candidate.connection.id);
        targets.push({
            scope: candidate.scope,
            connection: candidate.connection,
        });
    }
    return targets;
}
//# sourceMappingURL=indexAuditTargets.js.map