"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.governSchema = governSchema;
exports.runStartupIndexAudit = runStartupIndexAudit;
exports.resetIndexGovernanceForTests = resetIndexGovernanceForTests;
const logger_1 = __importDefault(require("@core/utils/logger"));
const registeredIndexes = [];
/**
 * Validates the naming convention for an index
 */
function validateNaming(collection, name) {
    if (name === '_id_')
        return true;
    // Standard: idx_<collection>_<fields>
    // Allow ad_ for specific legacy but valid ads indexes
    const isValid = name.startsWith(`idx_${collection.toLowerCase()}_`) || name.startsWith('ad_');
    if (!isValid) {
        logger_1.default.warn(`[Index Governance] Naming Violation: Index "${name}" in collection "${collection}" does not follow the standard idx_<collection>_<fields> prefix.`);
    }
    return isValid;
}
/**
 * Checks for duplicate key patterns across the registry
 */
function checkDuplicates(newIdx) {
    const collision = registeredIndexes.find(idx => idx.scope === newIdx.scope &&
        idx.collection === newIdx.collection &&
        JSON.stringify(idx.keys) === JSON.stringify(newIdx.keys));
    if (collision) {
        logger_1.default.error(`[Index Governance] Duplicate Index Collision: "${newIdx.name}" and "${collision.name}" in scope "${newIdx.scope}" collection "${newIdx.collection}" share the same key pattern.`);
    }
}
/**
 * Hook into Mongoose schema to register indexes for governance
 */
function governSchema(schema, { scope, collectionName, }) {
    const indexes = schema.indexes();
    for (const [keys, options] of indexes) {
        const name = options?.name;
        if (!name) {
            logger_1.default.error(`[Index Governance] Unnamed Index Error: Collection "${collectionName}" has an index without an explicit name. This is forbidden.`);
            continue;
        }
        const definition = { scope, collection: collectionName, name, keys, options };
        validateNaming(collectionName, name);
        checkDuplicates(definition);
        registeredIndexes.push(definition);
    }
}
/**
 * Startup Health Check
 */
function runStartupIndexAudit() {
    logger_1.default.info(`[Index Governance] Startup audit complete. Monitored ${registeredIndexes.length} indices across registered schemas.`);
}
function resetIndexGovernanceForTests() {
    registeredIndexes.length = 0;
}
//# sourceMappingURL=indexGovernance.js.map