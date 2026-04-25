import fs from 'fs';
import path from 'path';

export interface OpsRunArtifact {
  runId: string;
  command: string;
  blastRadius: string;
  flags: unknown;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'success' | 'failed';
  summary?: Record<string, unknown>;
  warnings?: string[];
  rollbackGuidance?: string[];
  error?: string;
}

const ensureLogsDir = (): string => {
  const logsDir = path.resolve(process.cwd(), 'logs', 'ops');
  fs.mkdirSync(logsDir, { recursive: true });
  return logsDir;
};

export const writeRunArtifact = (artifact: OpsRunArtifact): string => {
  const logsDir = ensureLogsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(logsDir, `${artifact.command}-${timestamp}-${artifact.runId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2), 'utf8');
  return filePath;
};

export const createOpsEmitter = (runId: string) => {
  return (event: string, payload: Record<string, unknown> = {}): void => {
    const row = {
      ts: new Date().toISOString(),
      runId,
      event,
      ...payload,
    };
    process.stdout.write(`${JSON.stringify(row)}\n`);
  };
};
