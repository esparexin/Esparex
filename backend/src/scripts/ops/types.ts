export type BlastRadius = 'low' | 'medium' | 'high' | 'critical';

export interface OpsFlags {
  apply: boolean;
  dryRun: boolean;
  verbose: boolean;
  yes: boolean;
}

export interface OpsExecutionContext {
  commandName: string;
  args: string[];
  flags: OpsFlags;
  runId: string;
  startedAt: string;
  emit: (event: string, payload?: Record<string, unknown>) => void;
}

export interface OpsCommandResult {
  summary: Record<string, unknown>;
  warnings?: string[];
  rollbackGuidance?: string[];
}

export interface OpsCommand {
  name: string;
  description: string;
  blastRadius: BlastRadius;
  run: (context: OpsExecutionContext) => Promise<OpsCommandResult>;
}

