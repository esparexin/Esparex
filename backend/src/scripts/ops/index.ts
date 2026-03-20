#!/usr/bin/env ts-node

import { parseOpsArgs } from './context';
import { getOpsCommand, opsCommands } from './commands';
import { createOpsEmitter, writeRunArtifact } from './logger';
import { OpsExecutionContext } from './types';

const randomSuffix = (): string => Math.random().toString(36).slice(2, 8);
const runId = `${Date.now()}-${randomSuffix()}`;

const main = async (): Promise<void> => {
  const parsed = parseOpsArgs(process.argv.slice(2));
  const emitter = createOpsEmitter(runId);
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();

  if (!parsed.commandName) {
    emitter('ops.usage', {
      commands: opsCommands.map((command) => ({
        name: command.name,
        blastRadius: command.blastRadius,
        description: command.description,
      })),
    });
    process.exitCode = 1;
    return;
  }

  const command = getOpsCommand(parsed.commandName);
  if (!command) {
    emitter('ops.error', {
      error: `Unknown command: ${parsed.commandName}`,
      availableCommands: opsCommands.map((item) => item.name),
    });
    process.exitCode = 1;
    return;
  }

  if (parsed.flags.apply && (command.blastRadius === 'high' || command.blastRadius === 'critical') && !parsed.flags.yes) {
    emitter('ops.error', {
      error: 'High/critical blast radius commands require --yes with --apply',
      command: command.name,
      blastRadius: command.blastRadius,
    });
    process.exitCode = 1;
    return;
  }

  emitter('ops.start', {
    command: command.name,
    blastRadius: command.blastRadius,
    flags: parsed.flags,
    args: parsed.passthrough,
  });

  const context: OpsExecutionContext = {
    commandName: command.name,
    args: parsed.passthrough,
    flags: parsed.flags,
    runId,
    startedAt,
    emit: emitter,
  };

  try {
    const result = await command.run(context);
    const finishedAtDate = new Date();
    const finishedAt = finishedAtDate.toISOString();
    const durationMs = finishedAtDate.getTime() - startedAtDate.getTime();

    const artifactPath = writeRunArtifact({
      runId,
      command: command.name,
      blastRadius: command.blastRadius,
      flags: parsed.flags,
      startedAt,
      finishedAt,
      durationMs,
      status: 'success',
      summary: result.summary,
      warnings: result.warnings,
      rollbackGuidance: result.rollbackGuidance,
    });

    emitter('ops.success', {
      command: command.name,
      durationMs,
      artifactPath,
      summary: result.summary,
      warnings: result.warnings ?? [],
    });
  } catch (error) {
    const finishedAtDate = new Date();
    const finishedAt = finishedAtDate.toISOString();
    const durationMs = finishedAtDate.getTime() - startedAtDate.getTime();
    const errorMessage = error instanceof Error ? error.message : String(error);

    const artifactPath = writeRunArtifact({
      runId,
      command: command.name,
      blastRadius: command.blastRadius,
      flags: parsed.flags,
      startedAt,
      finishedAt,
      durationMs,
      status: 'failed',
      error: errorMessage,
    });

    emitter('ops.failure', {
      command: command.name,
      durationMs,
      artifactPath,
      error: errorMessage,
    });
    process.exitCode = 1;
  }
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});

