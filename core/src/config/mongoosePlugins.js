"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const ADMIN_OWNED_REF_MODEL_BY_PATH = {
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
const toPopulateSpecs = (args) => {
    const first = args[0];
    const third = args[2];
    const specs = [];
    const addPathSpecs = (rawPath, hasExplicitModel) => {
        if (typeof rawPath !== 'string')
            return;
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
    const parsePopulateObject = (value) => {
        if (!value || typeof value !== 'object')
            return;
        const node = value;
        if (typeof node.path === 'string') {
            addPathSpecs(node.path, Boolean(node.model));
            return;
        }
        Object.keys(value).forEach((key) => {
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
    const mongooseWithGuard = mongoose_1.default;
    if (mongooseWithGuard.__esparexPopulateGuardInstalled) {
        return;
    }
    const queryProto = mongoose_1.default.Query.prototype;
    const originalPopulate = queryProto.populate;
    queryProto.populate = function patchedPopulate(...args) {
        const modelName = this?.model?.modelName;
        const connectionModels = (this?.model?.db?.models ?? {});
        const populateSpecs = toPopulateSpecs(args);
        for (const spec of populateSpecs) {
            const expectedModel = ADMIN_OWNED_REF_MODEL_BY_PATH[spec.path];
            if (!expectedModel || spec.hasExplicitModel)
                continue;
            if (connectionModels[expectedModel])
                continue;
            throw new Error(`[PopulateGovernance] Unsafe populate("${spec.path}") on model "${modelName ?? 'unknown'}". ` +
                `Model "${expectedModel}" is not registered on this connection. Use explicit model mapping.`);
        }
        return originalPopulate.apply(this, args);
    };
    mongooseWithGuard.__esparexPopulateGuardInstalled = true;
};
installPopulateGovernanceGuard();
// Apply global mongoose plugin to track query execution time
mongoose_1.default.plugin((schema) => {
    schema.pre(/^find|count|updateOne|updateMany|deleteOne|deleteMany|findOneAndUpdate/, function () {
        this._startTime = Date.now();
    });
    schema.post(/^find|count|updateOne|updateMany|deleteOne|deleteMany|findOneAndUpdate/, function () {
        if (this._startTime) {
            const time = Date.now() - this._startTime;
            const modelName = this.model?.modelName || 'Unknown';
            const isLocationModel = modelName === 'Location';
            const warnThresholdMs = isLocationModel ? 800 : 300;
            const errorThresholdMs = isLocationModel ? 2000 : 1000;
            if (time > errorThresholdMs) {
                logger_1.default.error(`[SLOW_QUERY] ${modelName}.${this.op} took ${time}ms`, { time, method: this.op, model: modelName });
            }
            else if (time > warnThresholdMs) {
                logger_1.default.warn(`[SLOW_QUERY] ${modelName}.${this.op} took ${time}ms`, { time, method: this.op, model: modelName });
            }
        }
    });
    // Aggregations
    schema.pre('aggregate', function () {
        const ctx = this;
        ctx._startTime = Date.now();
    });
    schema.post('aggregate', function () {
        const ctx = this;
        if (ctx._startTime) {
            const time = Date.now() - ctx._startTime;
            const modelName = ctx._model?.modelName || 'Unknown';
            const isLocationModel = modelName === 'Location';
            const warnThresholdMs = isLocationModel ? 800 : 300;
            const errorThresholdMs = isLocationModel ? 2000 : 1000;
            if (time > errorThresholdMs) {
                logger_1.default.error(`[SLOW_QUERY] ${modelName}.aggregate took ${time}ms`, { time, model: modelName });
            }
            else if (time > warnThresholdMs) {
                logger_1.default.warn(`[SLOW_QUERY] ${modelName}.aggregate took ${time}ms`, { time, model: modelName });
            }
        }
    });
});
//# sourceMappingURL=mongoosePlugins.js.map