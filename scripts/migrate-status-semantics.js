#!/usr/bin/env node

/**
 * Database Status & State Vocabulary Migration Script
 * Single Source of Truth (SSOT) Refactoring Script for Esparex Monorepo
 * 
 * Usage:
 *   node scripts/migrate-status-semantics.js --dry-run
 *   node scripts/migrate-status-semantics.js --apply
 */

const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname, '../backend/api/.env') });

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
const mongoUri = process.env.ADMIN_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/esparex_admin';

const CATALOG_COLLECTIONS = ['categories', 'brands', 'models', 'screensizes', 'servicetypes', 'spareparts'];

async function collectionExists(db, name) {
    const list = await db.listCollections({ name }).toArray();
    return list.length > 0;
}

async function migrateUsers(db) {
    if (!(await collectionExists(db, 'users'))) return { matched: 0, modified: 0 };
    const collection = db.collection('users');
    const filter = { status: 'live' };
    const matched = await collection.countDocuments(filter);

    if (!isDryRun && matched > 0) {
        const res = await collection.updateMany(filter, { $set: { status: 'active' } });
        return { matched, modified: res.modifiedCount };
    }
    return { matched, modified: 0 };
}

async function migrateBusinesses(db) {
    if (!(await collectionExists(db, 'businesses'))) return { matched: 0, modified: 0 };
    const collection = db.collection('businesses');
    const filter = { status: { $in: ['live', 'approved'] } };
    const matched = await collection.countDocuments(filter);

    if (!isDryRun && matched > 0) {
        const res = await collection.updateMany(filter, { $set: { status: 'active' } });
        return { matched, modified: res.modifiedCount };
    }
    return { matched, modified: 0 };
}

async function migrateCatalogEntities(db) {
    const results = {};
    for (const name of CATALOG_COLLECTIONS) {
        if (!(await collectionExists(db, name))) continue;
        const collection = db.collection(name);
        
        // Find entities where isActive is missing/false while status is 'live' or 'active'
        const filterMissingActive = {
            $or: [
                { isActive: { $exists: false } },
                { isActive: null }
            ]
        };
        const matchedActive = await collection.countDocuments(filterMissingActive);

        if (!isDryRun && matchedActive > 0) {
            const res = await collection.updateMany(filterMissingActive, { $set: { isActive: true } });
            results[name] = { matched: matchedActive, modified: res.modifiedCount };
        } else {
            results[name] = { matched: matchedActive, modified: 0 };
        }
    }
    return results;
}

async function verifyLegacyRecords(db) {
    const verification = {};
    if (await collectionExists(db, 'users')) {
        verification.legacyUsers = await db.collection('users').countDocuments({ status: 'live' });
    }
    if (await collectionExists(db, 'businesses')) {
        verification.legacyBusinesses = await db.collection('businesses').countDocuments({ status: { $in: ['live', 'approved'] } });
    }
    return verification;
}

async function main() {
    console.log(`[migrate-status-semantics] Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'APPLY (Mutating DB)'}`);
    console.log(`[migrate-status-semantics] Target MongoDB: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    const db = mongoose.connection.db;

    console.log('\n--- Migrating Users Collection ---');
    const userRes = await migrateUsers(db);
    console.log(`Users with legacy status='live': Matched=${userRes.matched}, Modified=${userRes.modified}`);

    console.log('\n--- Migrating Businesses Collection ---');
    const bizRes = await migrateBusinesses(db);
    console.log(`Businesses with legacy status=('live'|'approved'): Matched=${bizRes.matched}, Modified=${bizRes.modified}`);

    console.log('\n--- Migrating Catalog Collections ---');
    const catRes = await migrateCatalogEntities(db);
    for (const [col, stats] of Object.entries(catRes)) {
        console.log(`Collection '${col}': MatchedMissingActive=${stats.matched}, Modified=${stats.modified}`);
    }

    console.log('\n--- Post-Migration Verification ---');
    const verification = await verifyLegacyRecords(db);
    console.log('Legacy Records Remaining:', JSON.stringify(verification, null, 2));

    await mongoose.disconnect();
    console.log('\n[migrate-status-semantics] Execution Finished Successfully.');
}

main().catch(async (err) => {
    console.error('[migrate-status-semantics] Failed:', err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
});
