import type { AnyBulkWriteOperation, ClientSession } from 'mongoose';

export type WithId = { _id: unknown };
export type ModelHierarchyDoc = {
    _id: unknown;
    name?: string;
    displayName?: string;
    canonicalName?: string;
    slug?: string;
    brandId?: unknown;
    parentModelId?: unknown;
    variantOfModelId?: unknown;
    hierarchyPath?: string[];
    treeDepth?: number;
    categoryIds?: unknown[];
    isActive?: boolean;
    approvalStatus?: unknown;
    updatedAt?: Date;
};

export interface HierarchyIssue {
    collection: string;
    docId: string;
    issue: string;
    severity?: 'warning' | 'error';
    repairSuggestion?: string;
}

export interface HierarchyReport {
    scannedAt: Date;
    brands:     { total: number; orphaned: number };
    models:     {
        total: number;
        orphaned: number;
        cycles: number;
        duplicateLineages: number;
        invalidPaths: number;
        maxDepth: number;
    };
    variants:   { total: number; orphaned: number };
    spareParts: { total: number; orphaned: number; staleCategories: number };
    screenSizes:{ total: number; orphaned: number };
    analytics: {
        totalDescendants: number;
        totalVariants: number;
        orphanCount: number;
        invalidLineageCount: number;
        maxModelDepth: number;
        depthDistribution: Record<string, number>;
    };
    issues: HierarchyIssue[];
}

export interface RepairSummary {
    brandsRepaired:       number;
    brandsOrphaned:       number;
    sparePartsRepaired:   number;
    sparePartsOrphaned:   number;
    screenSizesDeactivated: number;
}

export interface ModelHierarchyMutationPayload {
    name?: unknown;
    displayName?: unknown;
    canonicalName?: unknown;
    slug?: unknown;
    brandId?: unknown;
    parentModelId?: unknown;
    variantOfModelId?: unknown;
    hierarchyPath?: unknown;
    treeDepth?: unknown;
    isParentModel?: unknown;
}

export interface ModelDeletionImpact {
    listings: number;
    spareParts: number;
    variants: number;
    childModels: number;
    descendantModels: number;
    activeHierarchyRoots: number;
    totalBlocked: number;
}

export interface ModelHierarchyTransactionResult {
    item: unknown;
    metrics: {
        durationMs: number;
        cascadeUpdateCount: number;
        descendantScanCount: number;
        rollback: boolean;
    };
}

export interface HierarchyTelemetrySnapshot {
    modelHierarchyMutations: number;
    modelHierarchyRollbacks: number;
    descendantCascadeUpdates: number;
    descendantCascadeScans: number;
    lastMutationDurationMs: number;
    lastRollbackAt?: Date;
}

export interface ModelHierarchyRepairPlan {
    dryRun: boolean;
    scanned: number;
    staleNodes: number;
    maxDepthViolations: number;
    updates: Array<{
        modelId: string;
        currentHierarchyPath: string[];
        nextHierarchyPath: string[];
        currentTreeDepth: number;
        nextTreeDepth: number;
    }>;
    applied: number;
}

export interface ModelHierarchyMutationPayloadInput {
    name?: unknown;
    displayName?: unknown;
    canonicalName?: unknown;
    slug?: unknown;
    brandId?: unknown;
    parentModelId?: unknown;
    variantOfModelId?: unknown;
    hierarchyPath?: unknown;
    treeDepth?: unknown;
    isParentModel?: unknown;
}
