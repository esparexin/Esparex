import { OpsCommand } from '../types';
import { geoRepairCommand } from './geoRepair.command';
import { locationCoverageAuditCommand } from './locationCoverageAudit.command';
import { locationStatusBackfillCommand } from './locationStatusBackfill.command';
import { orphanReportRemediateCommand } from './orphanReportRemediate.command';
import { reportUnifyBackfillCommand } from './reportUnifyBackfill.command';
import { catalogPromotionE2eTestCommand } from './catalogPromotionE2eTest.command';
import { adminBoundaryIngestCommand } from './adminBoundaryIngest.command';
import { addMissingStatesCommand } from './addMissingStates.command';
import { catalogCategorizationAuditCommand } from './catalogCategorizationAudit.command';

import { pruneSoftDeletedCommand } from './pruneSoftDeleted.command';

export const opsCommands: OpsCommand[] = [
  geoRepairCommand,
  locationCoverageAuditCommand,
  locationStatusBackfillCommand,
  reportUnifyBackfillCommand,
  orphanReportRemediateCommand,
  catalogPromotionE2eTestCommand,
  adminBoundaryIngestCommand,
  addMissingStatesCommand,
  catalogCategorizationAuditCommand,
  pruneSoftDeletedCommand,
];

export const getOpsCommand = (commandName: string): OpsCommand | undefined =>
  opsCommands.find((command) => command.name === commandName);
