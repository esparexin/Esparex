"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpsCommand = exports.opsCommands = void 0;
const geoRepair_command_1 = require("./geoRepair.command");
const locationCoverageAudit_command_1 = require("./locationCoverageAudit.command");
const locationStatusBackfill_command_1 = require("./locationStatusBackfill.command");
const orphanReportRemediate_command_1 = require("./orphanReportRemediate.command");
const reportUnifyBackfill_command_1 = require("./reportUnifyBackfill.command");
const catalogPromotionE2eTest_command_1 = require("./catalogPromotionE2eTest.command");
const adminBoundaryIngest_command_1 = require("./adminBoundaryIngest.command");
const addMissingStates_command_1 = require("./addMissingStates.command");
const catalogCategorizationAudit_command_1 = require("./catalogCategorizationAudit.command");
const pruneSoftDeleted_command_1 = require("./pruneSoftDeleted.command");
exports.opsCommands = [
    geoRepair_command_1.geoRepairCommand,
    locationCoverageAudit_command_1.locationCoverageAuditCommand,
    locationStatusBackfill_command_1.locationStatusBackfillCommand,
    reportUnifyBackfill_command_1.reportUnifyBackfillCommand,
    orphanReportRemediate_command_1.orphanReportRemediateCommand,
    catalogPromotionE2eTest_command_1.catalogPromotionE2eTestCommand,
    adminBoundaryIngest_command_1.adminBoundaryIngestCommand,
    addMissingStates_command_1.addMissingStatesCommand,
    catalogCategorizationAudit_command_1.catalogCategorizationAuditCommand,
    pruneSoftDeleted_command_1.pruneSoftDeletedCommand,
];
const getOpsCommand = (commandName) => exports.opsCommands.find((command) => command.name === commandName);
exports.getOpsCommand = getOpsCommand;
//# sourceMappingURL=index.js.map