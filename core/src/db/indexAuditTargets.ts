import type { Model } from "mongoose";

export interface IndexAuditConnection {
    id: number;
    models: Record<string, Model<unknown>>;
}

export interface IndexAuditTarget {
    scope: string;
    connection: IndexAuditConnection;
}

export function getIndexAuditTargets(
    candidates: Array<{ scope: string; connection: IndexAuditConnection }>
): IndexAuditTarget[] {
    const seenConnectionIds = new Set<number>();
    const targets: IndexAuditTarget[] = [];

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
