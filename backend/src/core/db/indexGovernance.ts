
import mongoose from 'mongoose';
import logger from '../../utils/logger';

/**
 * ESPAREX INDEX GOVERNANCE ENGINE
 * 
 * Enforces:
 * 1. Naming Conventions (idx_<collection>_<fields>)
 * 2. Duplicate Detection (preventing key pattern overlap)
 * 3. Property-level Flag Prohibition (static audit complement)
 */

interface IndexDefinition {
  scope: string;
  collection: string;
  name: string;
  keys: any;
  options?: any;
}

const registeredIndexes: IndexDefinition[] = [];

/**
 * Validates the naming convention for an index
 */
function validateNaming(collection: string, name: string): boolean {
  if (name === '_id_') return true;
  // Standard: idx_<collection>_<fields>
  // Allow ad_ for specific legacy but valid ads indexes
  const isValid = name.startsWith(`idx_${collection.toLowerCase()}_`) || name.startsWith('ad_');
  
  if (!isValid) {
    logger.warn(`[Index Governance] Naming Violation: Index "${name}" in collection "${collection}" does not follow the standard idx_<collection>_<fields> prefix.`);
  }
  return isValid;
}

/**
 * Checks for duplicate key patterns across the registry
 */
function checkDuplicates(newIdx: IndexDefinition) {
  const collision = registeredIndexes.find(idx => 
    idx.scope === newIdx.scope &&
    idx.collection === newIdx.collection && 
    JSON.stringify(idx.keys) === JSON.stringify(newIdx.keys)
  );

  if (collision) {
    logger.error(
      `[Index Governance] Duplicate Index Collision: "${newIdx.name}" and "${collision.name}" in scope "${newIdx.scope}" collection "${newIdx.collection}" share the same key pattern.`
    );
  }
}

/**
 * Hook into Mongoose schema to register indexes for governance
 */
export function governSchema(
  schema: mongoose.Schema,
  {
    scope,
    collectionName,
  }: {
    scope: string;
    collectionName: string;
  }
) {
  // @ts-ignore — schema.indexes() is a valid Mongoose Schema method but is not
  // declared in the @types/mongoose public interface. Safe to call here.
  const indexes = schema.indexes();
  
  for (const [keys, options] of indexes) {
    const name = (options as any).name;
    if (!name) {
      logger.error(`[Index Governance] Unnamed Index Error: Collection "${collectionName}" has an index without an explicit name. This is forbidden.`);
      continue;
    }

    const definition: IndexDefinition = { scope, collection: collectionName, name, keys, options };
    validateNaming(collectionName, name);
    checkDuplicates(definition);
    registeredIndexes.push(definition);
  }
}

/**
 * Startup Health Check
 */
export function runStartupIndexAudit() {
  logger.info(`[Index Governance] Startup audit complete. Monitored ${registeredIndexes.length} indices across registered schemas.`);
}

export function resetIndexGovernanceForTests() {
  registeredIndexes.length = 0;
}
