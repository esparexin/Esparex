import mongoose from 'mongoose';
import logger from '../utils/logger';

interface MongooseHookContext {
    model?: { 
        modelName: string;
        db?: { models?: Record<string, unknown> };
    };
    _model?: { modelName: string };
    _startTime?: number;
    op?: string;
}

const ADMIN_OWNED_REF_MODEL_BY_PATH: Record<string, 'Category' | 'Brand' | 'Model' | 'SparePart' | 'ServiceType'> = {
    categoryId: 'Category',
    categoryIds: 'Category',
    'criteria.categoryId': 'Category',
    brandId: 'Brand',
    'criteria.brandId': 'Brand',
    modelId: 'Model',
    'criteria.modelId': 'Model',
    sparePartId: 'SparePart',
    sparePartIds: 'SparePart',
    serviceTypeIds: 'ServiceType',
};

const toPopulateSpecs = (args: unknown[]): Array<{ path: string; hasExplicitModel: boolean }> => {
    const first = args[0] as unknown;
    const third = args[2] as unknown;
    const specs: Array<{ path: string; hasExplicitModel: boolean }> = [];

    const addPathSpecs = (rawPath: unknown, hasExplicitModel: boolean) => {
        if (typeof rawPath !== 'string') return;
        rawPath
            .split(/\s+/)
            .map((part) => part.trim())
            .filter(Boolean)
            .forEach((path) => specs.push({ path, hasExplicitModel }));
    };

    if (typeof first === 'string') {
        addPathSpecs(first, Boolean(third));
        return specs;
    }

    const parsePopulateObject = (value: unknown) => {
        if (!value || typeof value !== 'object') return;
        const node = value as { path?: unknown; model?: unknown };
        if (typeof node.path === 'string') {
            addPathSpecs(node.path, Boolean(node.model));
            return;
        }
        Object.keys(value as Record<string, unknown>).forEach((key) => {
            addPathSpecs(key, false);
        });
    };

    if (Array.isArray(first)) {
        first.forEach(parsePopulateObject);
        return specs;
    }

    parsePopulateObject(first);
    return specs;
};

const installPopulateGovernanceGuard = () => {
    const mongooseWithGuard = mongoose as typeof mongoose & { __esparexPopulateGuardInstalled?: boolean };
    if (mongooseWithGuard.__esparexPopulateGuardInstalled) {
        return;
    }

    const queryProto = mongoose.Query.prototype as {
        populate: (...args: unknown[]) => unknown;
    };
    const originalPopulate = queryProto.populate;

    queryProto.populate = function patchedPopulate(this: MongooseHookContext, ...args: unknown[]) {
        const modelName = this?.model?.modelName as string | undefined;
        const connectionModels = (this?.model?.db?.models ?? {}) as Record<string, unknown>;

        const populateSpecs = toPopulateSpecs(args);
        for (const spec of populateSpecs) {
            const expectedModel = ADMIN_OWNED_REF_MODEL_BY_PATH[spec.path];
            if (!expectedModel || spec.hasExplicitModel) continue;
            if (connectionModels[expectedModel]) continue;

            throw new Error(
                `[PopulateGovernance] Unsafe populate("${spec.path}") on model "${modelName ?? 'unknown'}". ` +
                `Model "${expectedModel}" is not registered on this connection. Use explicit model mapping.`
            );
        }

        return originalPopulate.apply(this, args);
    };

    mongooseWithGuard.__esparexPopulateGuardInstalled = true;
};

installPopulateGovernanceGuard();

// Apply global mongoose plugin to track query execution time
mongoose.plugin((schema) => {
    schema.pre(/^find|count|updateOne|updateMany|deleteOne|deleteMany|findOneAndUpdate/, function (this: MongooseHookContext) {
        this._startTime = Date.now();
    });

    schema.post(/^find|count|updateOne|updateMany|deleteOne|deleteMany|findOneAndUpdate/, function (this: MongooseHookContext) {
        if (this._startTime) {
            const time = Date.now() - this._startTime;
            const modelName = this.model?.modelName || 'Unknown';
            const isLocationModel = modelName === 'Location';
            const warnThresholdMs = isLocationModel ? 800 : 300;
            const errorThresholdMs = isLocationModel ? 2000 : 1000;

            if (time > errorThresholdMs) {
                logger.error(`[SLOW_QUERY] ${modelName}.${this.op} took ${time}ms`, { time, method: this.op, model: modelName });
            } else if (time > warnThresholdMs) {
                logger.warn(`[SLOW_QUERY] ${modelName}.${this.op} took ${time}ms`, { time, method: this.op, model: modelName });
            }
        }
    });

    // Aggregations
    schema.pre('aggregate', function () {
        const ctx = this as unknown as MongooseHookContext;
        ctx._startTime = Date.now();
    });

    schema.post('aggregate', function () {
        const ctx = this as unknown as MongooseHookContext;
        if (ctx._startTime) {
            const time = Date.now() - ctx._startTime;
            const modelName = ctx._model?.modelName || 'Unknown';
            const isLocationModel = modelName === 'Location';
            const warnThresholdMs = isLocationModel ? 800 : 300;
            const errorThresholdMs = isLocationModel ? 2000 : 1000;

            if (time > errorThresholdMs) {
                logger.error(`[SLOW_QUERY] ${modelName}.aggregate took ${time}ms`, { time, model: modelName });
            } else if (time > warnThresholdMs) {
                logger.warn(`[SLOW_QUERY] ${modelName}.aggregate took ${time}ms`, { time, model: modelName });
            }
        }
    });
});
