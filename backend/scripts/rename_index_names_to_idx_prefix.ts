import 'dotenv/config';
import type { Collection } from 'mongoose';
import type { IndexSpecification } from 'mongodb';
import { connectDB, getAdminConnection, getUserConnection } from '../src/config/db';
import '../src/models/registry';

type RenamePlan = {
    dbLabel: 'user' | 'admin';
    collectionName: string;
    oldName: string;
    newName: string;
    keys: Record<string, unknown>;
    createOptions: Record<string, unknown>;
    collection: Collection;
};

const SUPPORTED_CREATE_OPTIONS = [
    'unique',
    'sparse',
    'expireAfterSeconds',
    'partialFilterExpression',
    'collation',
    'weights',
    'default_language',
    'language_override',
    'wildcardProjection',
    'hidden',
] as const;

const isIndexKeyEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

const buildCreateOptionsFromExisting = (indexSpec: Record<string, unknown>): Record<string, unknown> => {
    const options: Record<string, unknown> = {};
    for (const optionKey of SUPPORTED_CREATE_OPTIONS) {
        if (Object.prototype.hasOwnProperty.call(indexSpec, optionKey)) {
            options[optionKey] = indexSpec[optionKey];
        }
    }
    return options;
};

const collectPlansFromConnection = async (
    dbLabel: 'user' | 'admin',
    models: Record<string, { schema: { indexes: () => Array<[Record<string, unknown>, Record<string, unknown>]> }; collection: Collection }>
): Promise<RenamePlan[]> => {
    const plans: RenamePlan[] = [];

    for (const model of Object.values(models)) {
        const collection = model.collection;
        const collectionName = collection.collectionName;
        const existingIndexes = await collection.indexes();
        const existingByName = new Map(existingIndexes.map((index) => [index.name, index]));

        for (const [keys, options] of model.schema.indexes()) {
            const newName = typeof options?.name === 'string' ? options.name : undefined;
            if (!newName || !newName.startsWith('idx_')) continue;

            const oldName = newName.slice(4);
            if (!oldName || oldName === '_id_') continue;

            const oldSpec = existingByName.get(oldName);
            if (!oldSpec) continue;
            if (existingByName.has(newName)) continue;

            if (!isIndexKeyEqual(oldSpec.key, keys)) {
                console.warn(
                    `[rename-index] Skip ${dbLabel}.${collectionName}: "${oldName}" key does not match schema keys for "${newName}".`
                );
                continue;
            }

            plans.push({
                dbLabel,
                collectionName,
                oldName,
                newName,
                keys,
                createOptions: buildCreateOptionsFromExisting(oldSpec as unknown as Record<string, unknown>),
                collection,
            });
        }
    }

    return plans;
};

const applyPlan = async (plan: RenamePlan) => {
    await plan.collection.dropIndex(plan.oldName);
    await plan.collection.createIndex(plan.keys as unknown as IndexSpecification, { ...plan.createOptions, name: plan.newName });
};

const closeConnections = async () => {
    await Promise.allSettled([
        getUserConnection().close(),
        getAdminConnection().close(),
    ]);
};

const main = async () => {
    const applyMode = process.argv.includes('--apply');

    await connectDB();

    const userConn = getUserConnection();
    const adminConn = getAdminConnection();

    const [userPlans, adminPlans] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collectPlansFromConnection('user', userConn.models as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collectPlansFromConnection('admin', adminConn.models as any),
    ]);

    const plans = [...userPlans, ...adminPlans];

    if (plans.length === 0) {
        console.log('No legacy index names found for idx_ prefix migration.');
        await closeConnections();
        process.exit(0);
    }

    console.log(`Found ${plans.length} index rename operation(s):`);
    for (const plan of plans) {
        console.log(
            `- [${plan.dbLabel}] ${plan.collectionName}: ${plan.oldName} -> ${plan.newName}`
        );
    }

    if (!applyMode) {
        console.log('\nDry run only. Re-run with --apply to execute.');
        await closeConnections();
        process.exit(0);
    }

    for (const plan of plans) {
        console.log(`Applying: [${plan.dbLabel}] ${plan.collectionName} ${plan.oldName} -> ${plan.newName}`);
        await applyPlan(plan);
    }

    console.log(`Applied ${plans.length} index rename operation(s) successfully.`);
    await closeConnections();
    process.exit(0);
};

main().catch(async (error) => {
    console.error('Index prefix migration failed:', error instanceof Error ? error.message : String(error));
    await closeConnections();
    process.exit(1);
});
