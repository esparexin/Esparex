import { OpsFlags } from './types';

export interface ParsedOpsArgs {
  commandName: string | null;
  passthrough: string[];
  flags: OpsFlags;
}

export const parseOpsArgs = (argv: string[]): ParsedOpsArgs => {
  const flags: OpsFlags = {
    apply: false,
    dryRun: true,
    verbose: false,
    yes: false,
  };

  let commandName: string | null = null;
  const passthrough: string[] = [];

  for (const token of argv) {
    if (token === '--apply') {
      flags.apply = true;
      flags.dryRun = false;
      continue;
    }

    if (token === '--dry-run') {
      flags.dryRun = true;
      flags.apply = false;
      continue;
    }

    if (token === '--verbose') {
      flags.verbose = true;
      continue;
    }

    if (token === '--yes') {
      flags.yes = true;
      continue;
    }

    if (!commandName && !token.startsWith('--')) {
      commandName = token;
      continue;
    }

    passthrough.push(token);
  }

  return {
    commandName,
    passthrough,
    flags,
  };
};

