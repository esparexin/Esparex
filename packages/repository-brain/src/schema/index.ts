import { z } from "zod";

export const IdentitySchema = z.object({
  name: z.string(),
  workspaceType: z.string(),
  packageManager: z.string(),
  defaultBranch: z.string(),
  version: z.string()
});
export type RepositoryIdentity = z.infer<typeof IdentitySchema>;

export const TechnologySchema = z.object({
  node: z.string(),
  typescript: z.string(),
  react: z.string(),
  next: z.string(),
  express: z.string(),
  mongodb: z.string(),
  mongoose: z.string(),
  redis: z.string(),
  bullmq: z.string(),
  jest: z.string(),
  playwright: z.string()
});
export type TechnologyStack = z.infer<typeof TechnologySchema>;

export const WorkspaceMetadataSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(["Presentation", "Transport", "Domain", "Shared", "Governance", "Tooling", "Historical", "Documentation"]),
  version: z.string()
});
export type WorkspaceMetadata = z.infer<typeof WorkspaceMetadataSchema>;

export const StructureSchema = z.object({
  workspaces: z.array(WorkspaceMetadataSchema)
});
export type WorkspaceStructure = z.infer<typeof StructureSchema>;

export const ArchitectureSchema = z.object({
  MetadataSchema: z.string(),
  "Brain-ID": z.string(),
  layers: z.array(z.string()),
  flow: z.string(),
  ownership: z.record(z.string())
});
export type ArchitectureConventions = z.infer<typeof ArchitectureSchema>;

export const PolicyItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string()
});
export const PolicyBoundarySchema = z.object({
  allowed: z.array(z.string()),
  forbidden: z.array(z.string())
});
export const PolicySchema = z.object({
  MetadataSchema: z.string(),
  "Brain-ID": z.string(),
  policies: z.array(PolicyItemSchema),
  boundaries: z.record(PolicyBoundarySchema)
});
export type DeclarativePolicies = z.infer<typeof PolicySchema>;

export const VocabularySchema = z.object({
  MetadataSchema: z.string(),
  "Brain-ID": z.string(),
  terms: z.record(z.string())
});
export type RepositoryVocabulary = z.infer<typeof VocabularySchema>;

export const ManifestItemSchema = z.object({
  id: z.string(),
  path: z.string(),
  type: z.enum(["Static", "Dynamic"])
});
export const ManifestSchema = z.object({
  MetadataSchema: z.string(),
  files: z.array(ManifestItemSchema)
});
export type BrainManifest = z.infer<typeof ManifestSchema>;

// RepositoryContext — raw discovery data surfaced through the snapshot
// This is the only field where consumers may read repository location/structure.
export const RepositoryContextSchema = z.object({
  root: z.string(),
  branch: z.string(),
  commit: z.string(),
  files: z.array(z.string()),
  workspaces: z.array(z.string())
});
export type RepositoryContext = z.infer<typeof RepositoryContextSchema>;

// Snapshot metadata — audit/hash fields only, not repository structure
export const SnapshotMetadataSchema = z.object({
  schemaVersion: z.string(),
  brainVersion: z.string(),
  scannerVersion: z.string(),
  repositoryName: z.string(),
  inventoryHash: z.string(),
  configurationHash: z.string(),
  snapshotHash: z.string(),
  generatedAt: z.string()
});
export type SnapshotMetadata = z.infer<typeof SnapshotMetadataSchema>;

/** Thrown by SnapshotValidator when the Brain cannot produce a valid snapshot. */
export class SnapshotValidationError extends Error {
  constructor(public readonly violations: string[]) {
    super(`BrainSnapshot validation failed:\n  - ${violations.join("\n  - ")}`);
    this.name = "SnapshotValidationError";
  }
}

export const BrainSnapshotSchema = z.object({
  metadata: SnapshotMetadataSchema,
  /** Raw repository discovery context. Consumers read paths from here — never from AnalyzerContext. */
  repository: RepositoryContextSchema,
  identity: IdentitySchema,
  technology: TechnologySchema,
  workspace: z.array(WorkspaceMetadataSchema),
  architecture: ArchitectureSchema,
  policies: PolicySchema,
  vocabulary: VocabularySchema,
  codingStandards: z.any()
});
export type BrainSnapshot = z.infer<typeof BrainSnapshotSchema>;
