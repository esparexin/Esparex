#!/usr/bin/env node
'use strict';

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/api/.env') });

const argv = process.argv.slice(2);
const getArg = (name, fallback = undefined) => {
  const prefix = `${name}=`;
  const found = argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

const sinceArg = getArg('--since');
const reportName = getArg('--report', 'runtime_behavioral_parity_report');
const since = sinceArg ? new Date(sinceArg) : null;
const uri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI;

if (!uri) {
  console.error('[catalog-shadow-diff-audit] missing MongoDB URI.');
  process.exit(1);
}

function classify(doc) {
  const userCount = Number(doc.userCount || 0);
  const adminCount = Number(doc.adminCount || 0);
  if (userCount !== adminCount) return 'critical';
  if (doc.mismatchSummary && String(doc.mismatchSummary).includes('hash-mismatch')) return 'normalization-only';
  return 'non-critical';
}

function classifyDiffType(doc) {
  const userCount = Number(doc.userCount || 0);
  const adminCount = Number(doc.adminCount || 0);
  if (userCount !== adminCount) return 'count-mismatch';
  if (doc.mismatchSummary && String(doc.mismatchSummary).includes('hash-mismatch')) return 'payload-hash-mismatch';
  return 'unknown-mismatch';
}

function inferRootCause(doc) {
  const query = doc.query || {};
  const queryText = JSON.stringify(query);
  if (/isActive|isDeleted|status|approvalStatus/.test(queryText)) return 'status-or-visibility-filter';
  if (/categoryId|categoryIds|brandId|modelId/.test(queryText)) return 'scoped-reference-filter';
  if (doc.requestPath && /page=|limit=|sort=/.test(String(doc.requestPath))) return 'pagination-or-sorting';
  if (Number(doc.userCount || 0) !== Number(doc.adminCount || 0)) return 'admin-user-cardinality-drift';
  return 'projection-or-normalization-drift';
}

function reportRow(row) {
  return {
    endpoint: `${row.requestMethod || 'GET'} ${row.requestPath || ''}`.trim(),
    query: row.query || {},
    userPayloadHash: row.userPayloadHash || row.userDbPayloadHash || null,
    adminPayloadHash: row.adminPayloadHash || row.adminDbPayloadHash || null,
    diffType: classifyDiffType(row),
    rootCause: row.rootCause || inferRootCause(row),
    fixApplied: row.fixApplied || false,
    timestamp: row.createdAt || row.updatedAt || null,
  };
}

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, maxPoolSize: 5 });
  const db = mongoose.connection.db;
  const query = since ? { createdAt: { $gte: since } } : {};
  const rows = await db.collection('catalog_shadow_read_diff_log')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const summary = rows.reduce((acc, row) => {
    const severity = classify(row);
    acc.total += 1;
    acc.bySeverity[severity] = (acc.bySeverity[severity] || 0) + 1;
    acc.byModel[row.modelName || 'unknown'] = (acc.byModel[row.modelName || 'unknown'] || 0) + 1;
    return acc;
  }, { total: 0, bySeverity: {}, byModel: {} });

  console.log(JSON.stringify({
    reportName,
    since: since ? since.toISOString() : null,
    db: db.databaseName,
    summary,
    runtime_behavioral_parity_report: rows.map(reportRow),
    samples: rows.slice(0, 20).map((row) => ({
      id: String(row._id),
      createdAt: row.createdAt,
      modelName: row.modelName,
      requestPath: row.requestPath,
      requestMethod: row.requestMethod,
      query: row.query,
      userCount: row.userCount,
      adminCount: row.adminCount,
      mismatchSummary: row.mismatchSummary,
      classification: classify(row),
    })),
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('[catalog-shadow-diff-audit] failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
