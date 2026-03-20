import { OpsCommand } from '../types';
import { geoRepairCommand } from './geoRepair.command';
import { orphanReportRemediateCommand } from './orphanReportRemediate.command';
import { reportUnifyBackfillCommand } from './reportUnifyBackfill.command';

export const opsCommands: OpsCommand[] = [
  geoRepairCommand,
  reportUnifyBackfillCommand,
  orphanReportRemediateCommand,
];

export const getOpsCommand = (commandName: string): OpsCommand | undefined =>
  opsCommands.find((command) => command.name === commandName);

