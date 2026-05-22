#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/user/.env') });

const TARGET_COLLECTIONS = [
  'categories',
  'brands',
  'models',
  'screen_sizes',
  'screensizes',
  'service_types',
  'servicetypes',
  'spare_parts',
  'spareparts',
  'catalog_requests',
  'users',
  'ads',
  'listings',
  'businesses',
  'auditlogs',
  'audit_logs',
  'adminauditlogs',
];

const IMPORTANT_FIELDS = [
  'name',
  'canonicalName',
  'slug',
  'status',
  'approvalStatus',
  'requestStatus',
  'categoryId',
  'categoryIds',
  'categories',
  'brandId',
  'modelId',
  'requestedBy',
  'approvedBy',
  'rejectedBy',
  'isDeleted',
  'deletedAt',
  'deletedBy',
  'createdBy',
  'updatedBy',
];

const SENSITIVE_KEY_RE = /(password|token|secret|otp|hash|salt|authorization|cookie|session|refresh|access|email|phone|mobile|address|street|pincode|postal|lat|lng|location|coordinates)/i;

const idString = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
  return String(value);
};

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const valueType = (value) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (value instanceof Date) return 'date';
  if (value instanceof mongoose.Types.ObjectId) return 'objectId';
  if (Array.isArray(value)) return 'array';
  if (Buffer.isBuffer(value)) return 'buffer';
  return typeof value;
};

const redact = (value, key = '') => {
  if (SENSITIVE_KEY_RE.test(key)) {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return `[REDACTED_ARRAY:${value.length}]`;
    if (typeof value === 'object') return '[REDACTED_OBJECT]';
    return '[REDACTED]';
  }
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 8).map((item) => redact(item, key));
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]));
  }
  return value;
};

const addFieldStats = (fieldStats, doc, prefix = '') => {
  for (const [key, value] of Object.entries(doc)) {
    const field = prefix ? `${prefix}.${key}` : key;
    if (!fieldStats[field]) {
      fieldStats[field] = { occurrences: 0, types: {}, nulls: 0, emptyStrings: 0, arraysEmpty: 0 };
    }
    const stats = fieldStats[field];
    stats.occurrences += 1;
    const type = valueType(value);
    stats.types[type] = (stats.types[type] || 0) + 1;
    if (value === null || value === undefined) stats.nulls += 1;
    if (value === '') stats.emptyStrings += 1;
    if (Array.isArray(value) && value.length === 0) stats.arraysEmpty += 1;
    if (isPlainObject(value)) addFieldStats(fieldStats, value, field);
  }
};

const normalizeText = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
};

const distinctTop = async (collection, field, limit = 25) => {
  return collection.aggregate([
    { $match: { [field]: { $exists: true } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]).toArray().catch(() => []);
};

const duplicatesFor = async (collection, field) => {
  return collection.aggregate([
    { $match: { [field]: { $type: 'string' } } },
    { $project: { raw: `$${field}`, normalized: { $toLower: { $trim: { input: `$${field}` } } } } },
    { $match: { normalized: { $ne: '' } } },
    { $group: { _id: '$normalized', count: { $sum: 1 }, ids: { $push: '$_id' }, values: { $addToSet: '$raw' } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: 100 },
    { $project: { _id: 0, value: '$_id', count: 1, values: 1, ids: { $slice: ['$ids', 20] } } },
  ]).toArray().catch(() => []);
};

const countMissing = async (collection, field) => {
  return collection.countDocuments({
    $or: [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: '' },
      { [field]: { $type: 'array', $size: 0 } },
    ],
  }).catch(() => null);
};

const getCollStats = async (db, name) => {
  try {
    return await db.command({ collStats: name });
  } catch (error) {
    return { error: error.message };
  }
};

const listIndexes = async (collection) => {
  try {
    return await collection.indexes();
  } catch (error) {
    return [{ error: error.message }];
  }
};

const serverConfiguration = async (db, uriLabel) => {
  const config = {
    database: db.databaseName,
    connectionMode: uriLabel,
    mongooseOptions: {
      serverSelectionTimeoutMS: 20000,
      readPreference: 'primary/default',
      readOnlyAudit: true,
    },
  };
  try {
    const hello = await db.admin().command({ hello: 1 });
    config.topology = {
      isWritablePrimary: hello.isWritablePrimary,
      setName: hello.setName,
      hosts: hello.hosts,
      msg: hello.msg,
      maxWireVersion: hello.maxWireVersion,
    };
  } catch (error) {
    config.topologyError = error.message;
  }
  try {
    const serverStatus = await db.admin().serverStatus();
    config.storageEngine = serverStatus.storageEngine;
    config.connections = serverStatus.connections;
    config.opcounters = serverStatus.opcounters;
    config.slowQuery = {
      globalLock: serverStatus.globalLock,
      metricsQueryExecutor: serverStatus.metrics && serverStatus.metrics.queryExecutor,
    };
  } catch (error) {
    config.serverStatusError = error.message;
  }
  try {
    config.dbStats = await db.stats();
  } catch (error) {
    config.dbStatsError = error.message;
  }
  return config;
};

const scanCollection = async (db, name) => {
  const collection = db.collection(name);
  const count = await collection.estimatedDocumentCount();
  const exactCount = await collection.countDocuments();
  const indexes = await listIndexes(collection);
  const stats = await getCollStats(db, name);
  const fieldStats = {};
  const samples = [];
  const commonValues = {};

  const cursor = collection.find({}, { batchSize: 500 });
  for await (const doc of cursor) {
    addFieldStats(fieldStats, doc);
    if (samples.length < 3) samples.push(redact(doc));
  }

  for (const field of ['status', 'approvalStatus', 'requestStatus', 'type', 'categoryType', 'requestType', 'isDeleted']) {
    commonValues[field] = await distinctTop(collection, field);
  }

  const missingImportantFields = {};
  for (const field of IMPORTANT_FIELDS) {
    missingImportantFields[field] = await countMissing(collection, field);
  }

  const duplicateFields = {};
  for (const field of ['name', 'canonicalName', 'slug']) {
    duplicateFields[field] = await duplicatesFor(collection, field);
  }

  const fields = Object.fromEntries(
    Object.entries(fieldStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([field, value]) => [
        field,
        {
          ...value,
          missingInScannedDocs: exactCount - value.occurrences,
          optionalByObservation: value.occurrences < exactCount,
        },
      ])
  );

  return {
    name,
    count,
    exactCount,
    storageSize: stats.storageSize ?? null,
    size: stats.size ?? null,
    avgObjSize: stats.avgObjSize ?? null,
    totalIndexSize: stats.totalIndexSize ?? null,
    indexCount: indexes.length,
    indexes,
    statsError: stats.error,
    fields,
    commonValues,
    missingImportantFields,
    duplicates: duplicateFields,
    samples,
  };
};

const loadIdSet = async (db, collectionName) => {
  const exists = (await db.listCollections({ name: collectionName }).toArray()).length > 0;
  if (!exists) return new Set();
  const docs = await db.collection(collectionName).find({}, { projection: { _id: 1 } }).toArray();
  return new Set(docs.map((doc) => idString(doc._id)));
};

const collectionExists = async (db, name) => (await db.listCollections({ name }).toArray()).length > 0;

const firstExisting = async (db, names) => {
  for (const name of names) {
    if (await collectionExists(db, name)) return name;
  }
  return null;
};

const invalidRefs = async (collection, field, validIds, { array = false } = {}) => {
  const docs = await collection.find({ [field]: { $exists: true, $ne: null } }, { projection: { _id: 1, name: 1, [field]: 1 } }).toArray();
  const invalid = [];
  for (const doc of docs) {
    const values = array ? (Array.isArray(doc[field]) ? doc[field] : []) : [doc[field]];
    const bad = values.map(idString).filter((value) => value && !validIds.has(value));
    if (bad.length) invalid.push({ _id: idString(doc._id), name: doc.name, field, invalidIds: bad });
  }
  return invalid.slice(0, 200);
};

const relationshipAudit = async (db) => {
  const categoriesName = await firstExisting(db, ['categories']);
  const brandsName = await firstExisting(db, ['brands']);
  const modelsName = await firstExisting(db, ['models']);
  const sparePartsName = await firstExisting(db, ['spareparts', 'spare_parts']);
  const screenSizesName = await firstExisting(db, ['screensizes', 'screen_sizes']);
  const serviceTypesName = await firstExisting(db, ['servicetypes', 'service_types']);
  const catalogRequestsName = await firstExisting(db, ['catalog_requests']);
  const usersName = await firstExisting(db, ['users']);

  const categoryIds = categoriesName ? await loadIdSet(db, categoriesName) : new Set();
  const brandIds = brandsName ? await loadIdSet(db, brandsName) : new Set();
  const modelIds = modelsName ? await loadIdSet(db, modelsName) : new Set();
  const userIds = usersName ? await loadIdSet(db, usersName) : new Set();

  const findings = {};
  if (brandsName) {
    const c = db.collection(brandsName);
    findings.brands_categoryId = await invalidRefs(c, 'categoryId', categoryIds);
    findings.brands_categoryIds = await invalidRefs(c, 'categoryIds', categoryIds, { array: true });
  }
  if (modelsName) {
    const c = db.collection(modelsName);
    findings.models_brandId = await invalidRefs(c, 'brandId', brandIds);
    findings.models_categoryId = await invalidRefs(c, 'categoryId', categoryIds);
    findings.models_categoryIds = await invalidRefs(c, 'categoryIds', categoryIds, { array: true });
  }
  if (sparePartsName) {
    const c = db.collection(sparePartsName);
    findings.spareParts_brandId = await invalidRefs(c, 'brandId', brandIds);
    findings.spareParts_modelId = await invalidRefs(c, 'modelId', modelIds);
    findings.spareParts_categoryId = await invalidRefs(c, 'categoryId', categoryIds);
    findings.spareParts_categoryIds = await invalidRefs(c, 'categoryIds', categoryIds, { array: true });
    findings.spareParts_categories = await invalidRefs(c, 'categories', categoryIds, { array: true });
  }
  if (screenSizesName) {
    const c = db.collection(screenSizesName);
    findings.screenSizes_categoryId = await invalidRefs(c, 'categoryId', categoryIds);
    findings.screenSizes_brandId = await invalidRefs(c, 'brandId', brandIds);
  }
  if (serviceTypesName) {
    const c = db.collection(serviceTypesName);
    findings.serviceTypes_categoryId = await invalidRefs(c, 'categoryId', categoryIds);
    findings.serviceTypes_categoryIds = await invalidRefs(c, 'categoryIds', categoryIds, { array: true });
  }
  if (catalogRequestsName) {
    const c = db.collection(catalogRequestsName);
    findings.catalogRequests_categoryId = await invalidRefs(c, 'categoryId', categoryIds);
    findings.catalogRequests_brandId = await invalidRefs(c, 'brandId', brandIds);
    findings.catalogRequests_modelId = await invalidRefs(c, 'modelId', modelIds);
    findings.catalogRequests_requestedBy = await invalidRefs(c, 'requestedBy', userIds);
  }

  return {
    canonicalCollections: { categoriesName, brandsName, modelsName, sparePartsName, screenSizesName, serviceTypesName, catalogRequestsName, usersName },
    invalidReferences: findings,
  };
};

const hierarchyAudit = async (db, names) => {
  const result = {};
  if (names.categoriesName) {
    const c = db.collection(names.categoriesName);
    result.categories = {
      total: await c.countDocuments(),
      hasScreenSizesTrue: await c.countDocuments({ hasScreenSizes: true }),
      byStatus: await distinctTop(c, 'status', 50),
      byType: await distinctTop(c, 'type', 50),
      byCategoryType: await distinctTop(c, 'categoryType', 50),
    };
  }
  if (names.brandsName) {
    result.brandsPerCategory = await db.collection(names.brandsName).aggregate([
      { $project: { categoryIds: { $cond: [{ $isArray: '$categoryIds' }, '$categoryIds', { $cond: ['$categoryId', ['$categoryId'], []] }] } } },
      { $unwind: { path: '$categoryIds', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$categoryIds', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]).toArray();
  }
  if (names.modelsName) {
    result.modelsPerBrand = await db.collection(names.modelsName).aggregate([
      { $group: { _id: '$brandId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]).toArray();
  }
  if (names.screenSizesName) {
    result.screenSizesPerCategory = await db.collection(names.screenSizesName).aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]).toArray();
  }
  if (names.serviceTypesName) {
    result.serviceTypesPerCategory = await db.collection(names.serviceTypesName).aggregate([
      { $project: { categoryIds: { $cond: [{ $isArray: '$categoryIds' }, '$categoryIds', { $cond: ['$categoryId', ['$categoryId'], []] }] } } },
      { $unwind: { path: '$categoryIds', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$categoryIds', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]).toArray();
  }
  if (names.sparePartsName) {
    result.sparePartsPerCategory = await db.collection(names.sparePartsName).aggregate([
      { $project: { categoryIds: { $cond: [{ $isArray: '$categories' }, '$categories', { $cond: ['$categoryId', ['$categoryId'], []] }] } } },
      { $unwind: { path: '$categoryIds', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$categoryIds', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]).toArray();
  }
  if (names.catalogRequestsName) {
    const c = db.collection(names.catalogRequestsName);
    result.catalogRequests = {
      byStatus: await distinctTop(c, 'status', 50),
      byApprovalStatus: await distinctTop(c, 'approvalStatus', 50),
      byRequestStatus: await distinctTop(c, 'requestStatus', 50),
      byRequestType: await distinctTop(c, 'requestType', 50),
    };
  }
  return redact(result);
};

const canonicalConsistency = async (db, collectionNames) => {
  const result = {};
  for (const name of collectionNames) {
    const collection = db.collection(name);
    const docs = await collection.find(
      { $or: [{ name: { $exists: true } }, { slug: { $exists: true } }, { canonicalName: { $exists: true } }] },
      { projection: { _id: 1, name: 1, slug: 1, canonicalName: 1 } }
    ).toArray();
    const issues = [];
    for (const doc of docs) {
      const nameNorm = normalizeText(doc.name);
      const slugNorm = normalizeText(doc.slug);
      const canonicalNorm = normalizeText(doc.canonicalName);
      const expectedSlug = nameNorm ? nameNorm.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null;
      const docIssues = [];
      if (nameNorm && canonicalNorm && nameNorm !== canonicalNorm) docIssues.push('name_canonicalName_mismatch');
      if (nameNorm && slugNorm && expectedSlug && slugNorm !== expectedSlug) docIssues.push('slug_not_name_derived');
      if (docIssues.length) issues.push({ _id: idString(doc._id), name: doc.name, slug: doc.slug, canonicalName: doc.canonicalName, issues: docIssues });
    }
    result[name] = issues.slice(0, 200);
  }
  return result;
};

const softDeleteAudit = async (db, collectionNames) => {
  const result = {};
  for (const name of collectionNames) {
    const collection = db.collection(name);
    result[name] = {
      deleted: await collection.countDocuments({ isDeleted: true }),
      deletedMissingDeletedAt: await collection.countDocuments({ isDeleted: true, $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }),
      deletedMissingDeletedBy: await collection.countDocuments({ isDeleted: true, $or: [{ deletedBy: { $exists: false } }, { deletedBy: null }] }),
      notDeletedWithDeletedAt: await collection.countDocuments({ isDeleted: { $ne: true }, deletedAt: { $exists: true, $ne: null } }),
    };
  }
  return result;
};

const legacyFieldAudit = async (collectionReports) => {
  const result = {};
  const driftPairs = [
    ['categoryId', 'categoryIds'],
    ['categoryId', 'categories'],
    ['status', 'approvalStatus'],
    ['status', 'requestStatus'],
    ['isActive', 'status'],
  ];
  for (const report of collectionReports) {
    const fields = Object.keys(report.fields);
    const presentPairs = driftPairs.filter(([a, b]) => fields.includes(a) && fields.includes(b));
    const unusualStatusValues = [
      ...(report.commonValues.status || []),
      ...(report.commonValues.approvalStatus || []),
      ...(report.commonValues.requestStatus || []),
    ].filter((entry) => entry._id !== null && !['active', 'inactive', 'pending', 'approved', 'rejected', 'deleted', 'live', 'draft', 'suspended', 'expired'].includes(String(entry._id)));
    result[report.name] = { presentDriftPairs: presentPairs, unusualStatusValues };
  }
  return result;
};

const runForUri = async (uri, label) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, maxPoolSize: 10 });
  const db = mongoose.connection.db;
  const allCollections = await db.listCollections().toArray();
  const collectionNames = allCollections.map((c) => c.name).sort();
  const selectedNames = [...new Set([...TARGET_COLLECTIONS.filter((name) => collectionNames.includes(name)), ...collectionNames.filter((name) => /category|brand|model|screen|service|spare|catalog|user|ad|listing|business|audit/i.test(name))])].sort();
  const configuration = await serverConfiguration(db, label);
  const collectionReports = [];
  for (const name of selectedNames) {
    collectionReports.push(await scanCollection(db, name));
  }
  const relationships = await relationshipAudit(db);
  const hierarchy = await hierarchyAudit(db, relationships.canonicalCollections);
  const canonical = await canonicalConsistency(db, selectedNames);
  const softDelete = await softDeleteAudit(db, selectedNames);
  const legacyFields = await legacyFieldAudit(collectionReports);
  await mongoose.disconnect();

  return {
    label,
    scannedAt: new Date().toISOString(),
    database: configuration.database,
    allCollections: collectionNames,
    auditedCollections: selectedNames,
    configuration,
    collections: collectionReports,
    relationships,
    hierarchy,
    canonicalConsistency: canonical,
    softDelete,
    legacyFields,
  };
};

const main = async () => {
  const uris = [
    ['user', process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_user'],
    ['admin', process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_admin'],
  ];
  const uniqueUris = [];
  for (const [label, uri] of uris) {
    if (!uniqueUris.some(([, existing]) => existing === uri)) uniqueUris.push([label, uri]);
  }
  const reports = [];
  for (const [label, uri] of uniqueUris) {
    reports.push(await runForUri(uri, label));
  }
  const output = {
    generatedAt: new Date().toISOString(),
    source: 'scripts/audit-mongodb-inventory.js',
    reports,
  };
  const outPath = process.env.AUDIT_OUTPUT || path.resolve(process.cwd(), 'mongodb-inventory-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify({
    generatedAt: output.generatedAt,
    output: outPath,
    databases: reports.map((report) => ({
      label: report.label,
      database: report.database,
      allCollections: report.allCollections.length,
      auditedCollections: report.auditedCollections.length,
    })),
  }, null, 2));
};

main().catch(async (error) => {
  console.error('[audit-mongodb-inventory] failed:', error);
  try {
    await mongoose.disconnect();
  } catch {
    // no-op
  }
  process.exit(1);
});
