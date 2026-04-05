import { OpsCommand } from '../types';
import { geoRepairCommand } from './geoRepair.command';
import { locationCoverageAuditCommand } from './locationCoverageAudit.command';
import { locationStatusBackfillCommand } from './locationStatusBackfill.command';
import { orphanReportRemediateCommand } from './orphanReportRemediate.command';
import { reportUnifyBackfillCommand } from './reportUnifyBackfill.command';

export const opsCommands: OpsCommand[] = [
  geoRepairCommand,
  locationCoverageAuditCommand,
  locationStatusBackfillCommand,
  reportUnifyBackfillCommand,
  orphanReportRemediateCommand,
];

export const getOpsCommand = (commandName: string): OpsCommand | undefined =>
  opsCommands.find((command) => command.name === commandName);
