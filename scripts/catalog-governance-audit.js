#!/usr/bin/env node

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/user/.env') });

const mode = process.argv[2] || 'all';
const adminUri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_admin';

const CATALOG_COLLECTIONS = ['categories', 'brands', 'models', 'screensizes', 'servicetypes', 'spareparts'];
const COLLECTION_RULES = {
    categories: { canonical: ['name', 'canonicalName', 'slug', 'status'], refs: [] },
    brands: { canonical: ['name', 'canonicalName', 'slug', 'status', 'categoryIds'], refs: [{ field: 'categoryIds', collection: 'categories', array: true }] },
    models: {
        canonical: ['name', 'canonicalName', 'slug', 'status', 'brandId', 'categoryIds'],
        refs: [
            { field: 'brandId', collection: 'brands' },
            { field: 'categoryIds', collection: 'categories', array: true },
        ],
    },
    screensizes: { canonical: ['name', 'canonicalName', 'slug', 'status', 'categoryId'], refs: [{ field: 'categoryId', collection: 'categories' }] },
    servicetypes: { canonical: ['name', 'canonicalName', 'slug', 'status', 'categoryIds'], refs: [{ field: 'categoryIds', collection: 'categories', array: true }] },
    spareparts: {
        canonical: ['name', 'canonicalName', 'slug', 'status', 'categoryIds'],
        refs: [
            { field: 'categoryIds', collection: 'categories', array: true },
            { field: 'brandId', collection: 'brands', optional: true },
            { field: 'modelId', collection: 'models', optional: true },
        ],
    },
};

const ALLOWED_CATALOG_STATUS = new Set(['live', 'inactive', 'deleted']);
const PRODUCTION_READ_FILTER = {
    quarantined: { $ne: true },
    orphanQuarantined: { $ne: true },
    isDeleted: { $ne: true },
};
const POLLUTION_PATTERNS = [
    /<script[\s>]/i,
    /<\/?[a-z][\s\S]*>/i,
    /error type/i,
    /error message/i,
    /build output/i,
    /next\.js version/i,
    /stack trace/i,
    /console error/i,
    /at\s+[\w$.<>]+\s*\([^)]*:\d+:\d+\)/i,
    /webpack|turbopack|vite/i,
];

const idString = (value) => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value.toString();
    if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
    return String(value);
};

const normalize = (value) => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized || null;
};

const hasPollution = (value) => typeof value === 'string' && POLLUTION_PATTERNS.some((pattern) => pattern.test(value));

async function collectionExists(db, name) {
    return (await db.listCollections({ name }).toArray()).length > 0;
}

async function activeCollections(db) {
    const result = [];
    for (const name of CATALOG_COLLECTIONS) {
        if (await collectionExists(db, name)) result.push(name);
    }
    return result;
}

async function auditDuplicates(db, collections) {
    const findings = {};
    for (const name of collections) {
        const collection = db.collection(name);
        findings[name] = {};
        const docs = await collection.find(PRODUCTION_READ_FILTER, {
            projection: {
                _id: 1,
                name: 1,
                canonicalName: 1,
                slug: 1,
                categoryIds: 1,
                categoryId: 1,
                brandId: 1,
                modelId: 1,
            },
        }).toArray();
        for (const field of ['name', 'canonicalName', 'slug']) {
            const groups = new Map();
            for (const doc of docs) {
                const normalized = normalize(doc[field]);
                if (!normalized) continue;
                const scope = duplicateScope(name, doc);
                const key = `${normalized}|${scope}`;
                const group = groups.get(key) || { value: normalized, scope, count: 0, values: new Set(), ids: [] };
                group.count += 1;
                group.values.add(doc[field]);
                group.ids.push(doc._id);
                groups.set(key, group);
            }
            findings[name][field] = Array.from(groups.values())
                .filter((group) => group.count > 1)
                .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
                .slice(0, 100)
                .map((group) => ({
                    value: group.value,
                    scope: group.scope,
                    count: group.count,
                    values: Array.from(group.values),
                    ids: group.ids.slice(0, 25),
                }));
        }
    }
    return findings;
}

function duplicateScope(collectionName, doc) {
    if (collectionName === 'models') return `brand:${idString(doc.brandId) || 'none'}`;
    if (collectionName === 'brands' || collectionName === 'servicetypes' || collectionName === 'spareparts') {
        const ids = Array.isArray(doc.categoryIds) ? doc.categoryIds.map(idString).filter(Boolean).sort() : [];
        return `categories:${ids.join(',') || 'none'}`;
    }
    if (collectionName === 'screensizes') {
        return `category:${idString(doc.categoryId) || 'none'}:brand:${idString(doc.brandId) || 'none'}`;
    }
    return 'global';
}

async function idSet(db, collectionName) {
    if (!(await collectionExists(db, collectionName))) return new Set();
    const docs = await db.collection(collectionName).find(PRODUCTION_READ_FILTER, { projection: { _id: 1 } }).toArray();
    return new Set(docs.map((doc) => idString(doc._id)));
}

async function auditOrphans(db, collections) {
    const validIds = {};
    for (const collection of CATALOG_COLLECTIONS) {
        validIds[collection] = await idSet(db, collection);
    }

    const findings = {};
    for (const name of collections) {
        const rules = COLLECTION_RULES[name]?.refs || [];
        const collection = db.collection(name);
        findings[name] = [];
        for (const rule of rules) {
            const docs = await collection.find({ ...PRODUCTION_READ_FILTER, [rule.field]: { $exists: true, $ne: null } }, { projection: { _id: 1, name: 1, [rule.field]: 1 } }).toArray();
            for (const doc of docs) {
                const values = rule.array ? (Array.isArray(doc[rule.field]) ? doc[rule.field] : []) : [doc[rule.field]];
                const invalidIds = values.map(idString).filter((value) => value && !validIds[rule.collection].has(value));
                if (invalidIds.length) {
                    findings[name].push({ _id: idString(doc._id), name: doc.name, field: rule.field, target: rule.collection, invalidIds });
                }
            }
        }
        findings[name] = findings[name].slice(0, 200);
    }
    return findings;
}

async function auditCanonical(db, collections) {
    const findings = {};
    for (const name of collections) {
        const collection = db.collection(name);
        const rules = COLLECTION_RULES[name]?.canonical || [];
        const docs = await collection.find(PRODUCTION_READ_FILTER, { projection: Object.fromEntries(['_id', ...rules].map((field) => [field, 1])) }).toArray();
        findings[name] = [];
        for (const doc of docs) {
            const issues = [];
            for (const field of rules) {
                const value = doc[field];
                if (Array.isArray(value)) {
                    if (value.length === 0) issues.push(`${field}:empty`);
                } else if (value === undefined || value === null || value === '') {
                    issues.push(`${field}:missing`);
                }
            }
            if (doc.name && doc.canonicalName && normalize(doc.name) !== normalize(doc.canonicalName)) {
                issues.push('name:canonicalName:mismatch');
            }
            if (issues.length) findings[name].push({ _id: idString(doc._id), name: doc.name, issues });
        }
        findings[name] = findings[name].slice(0, 200);
    }
    return findings;
}

async function auditStatus(db, collections) {
    const findings = {};
    for (const name of collections) {
        const collection = db.collection(name);
        const groups = await collection.aggregate([
            { $match: PRODUCTION_READ_FILTER },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]).toArray();
        const invalid = groups.filter((group) => !ALLOWED_CATALOG_STATUS.has(String(group._id)));
        findings[name] = { distribution: groups, invalid };
    }
    if (await collectionExists(db, 'catalog_requests')) {
        const groups = await db.collection('catalog_requests').aggregate([
            { $group: { _id: '$requestStatus', legacyStatus: { $addToSet: '$status' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]).toArray();
        findings.catalog_requests = {
            distribution: groups,
            invalid: groups.filter((group) => !['pending', 'approved', 'rejected'].includes(String(group._id))),
        };
    }
    return findings;
}

async function auditPollution(db, collections) {
    const fields = ['name', 'displayName', 'canonicalName', 'slug', 'description', 'rejectionReason'];
    const findings = {};
    for (const name of collections) {
        const collection = db.collection(name);
        const docs = await collection.find(PRODUCTION_READ_FILTER, { projection: Object.fromEntries(['_id', ...fields].map((field) => [field, 1])) }).toArray();
        findings[name] = [];
        for (const doc of docs) {
            const pollutedFields = fields.filter((field) => hasPollution(doc[field]));
            if (pollutedFields.length) {
                findings[name].push({ _id: idString(doc._id), name: doc.name, pollutedFields });
            }
        }
        findings[name] = findings[name].slice(0, 200);
    }
    return findings;
}

function flattenCount(result) {
    let count = 0;
    for (const value of Object.values(result)) {
        if (Array.isArray(value)) count += value.length;
        else if (value && typeof value === 'object') {
            if (Array.isArray(value.invalid)) {
                count += value.invalid.length;
                continue;
            }
            for (const nested of Object.values(value)) {
                if (nested && typeof nested === 'object' && Array.isArray(nested.invalid)) count += nested.invalid.length;
                else if (Array.isArray(nested)) count += nested.length;
            }
        }
    }
    return count;
}

async function main() {
    await mongoose.connect(adminUri, { serverSelectionTimeoutMS: 20000, maxPoolSize: 10 });
    const db = mongoose.connection.db;
    const collections = await activeCollections(db);
    const audits = {};

    if (mode === 'duplicates' || mode === 'all') audits.duplicates = await auditDuplicates(db, collections);
    if (mode === 'orphans' || mode === 'all') audits.orphans = await auditOrphans(db, collections);
    if (mode === 'canonical' || mode === 'all') audits.canonical = await auditCanonical(db, collections);
    if (mode === 'status' || mode === 'all') audits.status = await auditStatus(db, collections);
    if (mode === 'pollution' || mode === 'all') audits.pollution = await auditPollution(db, collections);

    const summary = Object.fromEntries(Object.entries(audits).map(([key, value]) => [key, flattenCount(value)]));
    const report = {
        generatedAt: new Date().toISOString(),
        database: db.databaseName,
        mode,
        collections,
        summary,
        audits,
    };
    console.log(JSON.stringify(report, null, 2));
    await mongoose.disconnect();

    const totalFindings = Object.values(summary).reduce((sum, value) => sum + value, 0);
    process.exitCode = totalFindings > 0 ? 1 : 0;
}

main().catch(async (error) => {
    console.error('[catalog-governance-audit] failed:', error instanceof Error ? error.message : error);
    try {
        await mongoose.disconnect();
    } catch {
        // no-op
    }
    process.exit(1);
});
