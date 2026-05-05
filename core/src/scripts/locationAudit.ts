import mongoose from 'mongoose';
import Location from '../models/Location';
import logger from '../utils/logger';
import { buildLocationSlug } from '../utils/locationPrimitives';
import fs from 'fs';
import path from 'path';

/**
 * PRODUCTION LOCATION AUDIT SCRIPT
 * Checks for:
 * 1. GeoJSON Integrity (Point closure not applicable to Point, but structure is)
 * 2. Hierarchy Consistency (parentId matches path[last-1])
 * 3. Path Integrity (path[last] matches self)
 * 4. Slug Consistency (Canonical vs Current)
 * 5. Orphan Detection (Missing parentId for area/city level)
 */

interface LocationIssue {
    id: string;
    name: string;
    level: string;
    problems: string[];
}

interface LocationDoc {
    _id: mongoose.Types.ObjectId;
    name: string;
    level: string;
    country: string;
    state?: string;
    city?: string;
    parentId?: mongoose.Types.ObjectId;
    path?: mongoose.Types.ObjectId[];
    coordinates?: {
        type: string;
        coordinates: number[];
    };
    slug?: string;
}

async function runAudit() {
    try {
        logger.info('🔍 Starting Location Data Integrity Audit...');

        const locations = await Location.find().lean() as unknown as LocationDoc[];
        logger.info(`📋 Total locations to audit: ${locations.length}`);

        const locationMap = new Map<string, LocationDoc>(locations.map(loc => [loc._id.toString(), loc]));
        const issues: LocationIssue[] = [];

        for (const loc of locations) {
            const problems: string[] = [];

            // 1. GeoJSON Structure
            if (!loc.coordinates || loc.coordinates.type !== 'Point' || !Array.isArray(loc.coordinates.coordinates)) {
                problems.push('Invalid GeoJSON Point structure');
            }

            // 2. Hierarchy Check
            if (loc.level !== 'country' && !loc.parentId) {
                problems.push(`Missing Parent: ${loc.level} level usually requires a parent`);
            }

            if (loc.parentId && !locationMap.has(loc.parentId.toString())) {
                problems.push(`Broken Parent Link: parentId ${String(loc.parentId)} not found in DB`);
            }

            // 3. Path Integrity
            const pathArray = loc.path || [];
            if (pathArray.length === 0) {
                problems.push('Path array is empty');
            } else {
                const lastElement = pathArray[pathArray.length - 1];
                const selfInPath = lastElement ? lastElement.toString() : '';
                if (selfInPath !== loc._id.toString()) {
                    problems.push('Path mismatch: self ID is not the last element');
                }
            }

            // 4. Slug Validation
            let stateName = '';
            if (loc.level !== 'state' && loc.level !== 'country') {
                for (const pid of loc.path || []) {
                    const p = locationMap.get(pid.toString());
                    if (p && p.level === 'state') {
                        stateName = p.name;
                        break;
                    }
                }
            }
            
            const canonicalSlug = buildLocationSlug(loc.name, stateName, loc.country);
            if (loc.slug !== canonicalSlug) {
                problems.push(`Slug Mismatch: current "${loc.slug}" vs canonical "${canonicalSlug}"`);
            }

            if (problems.length > 0) {
                issues.push({
                    id: loc._id.toString(),
                    name: loc.name,
                    level: loc.level,
                    problems
                });
            }
        }

        if (issues.length === 0) {
            logger.info('✅ No data integrity issues found.');
            return;
        }

        logger.warn(`⚠️ Found ${issues.length} locations with issues.`);
        
        // Export report
        const reportPath = path.join(process.cwd(), 'location_audit_report.csv');
        const csvContent = issues.map(i => `"${i.id}","${i.name}","${i.level}","${i.problems.join('; ')}"`).join('\n');
        fs.writeFileSync(reportPath, `ID,Name,Level,Problems\n${csvContent}`);
        logger.info(`📄 Full audit report exported to: ${reportPath}`);

        const isApply = process.argv.includes('--apply');
        const isSmartReparent = process.argv.includes('--smart-reparent');

        const states = await Location.find({ level: 'state' }).lean();
        const stateMap = new Map(states.map(s => [s.name.toLowerCase(), s._id.toString()]));

        if (isSmartReparent && isApply) {
            logger.info('🧠 --smart-reparent + --apply detected. Starting intelligent hierarchy repair...');
            const bulkOps: unknown[] = [];
            let reparentedCount = 0;

            for (const issue of issues) {
                if (!issue.problems.some((p: string) => p.includes('Parent') || p.includes('Hierarchy'))) continue;

                const locRaw = locationMap.get(issue.id);
                if (!locRaw) continue;

                const updates: Partial<LocationDoc> = {};
                
                // 1. Level Correction (area -> city)
                if (locRaw.level === 'area' && locRaw.name === locRaw.city) {
                    updates.level = 'city';
                }

                // 2. State-based Reparenting
                if (!locRaw.parentId && locRaw.state) {
                    const stateId = stateMap.get(locRaw.state.toLowerCase());
                    if (stateId) {
                        const stateNode = locationMap.get(stateId);
                        if (stateNode) {
                            updates.parentId = new mongoose.Types.ObjectId(stateId);
                            updates.path = [...(stateNode.path || []), new mongoose.Types.ObjectId(issue.id)];
                            
                            // Rebuild slug with new hierarchy
                            updates.slug = buildLocationSlug(locRaw.name, stateNode.name, locRaw.country);
                            reparentedCount++;
                        }
                    }
                }

                if (Object.keys(updates).length > 0) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: locRaw._id },
                            update: { $set: updates }
                        }
                    });
                }
            }

            if (bulkOps.length > 0) {
                logger.info(`📤 Executing ${bulkOps.length} smart-reparent updates (bypassing hooks)...`);
                const batchSize = 1000;
                for (let i = 0; i < bulkOps.length; i += batchSize) {
                    const batch = bulkOps.slice(i, i + batchSize);
                    await Location.collection.bulkWrite(batch as any[]);
                    logger.info(`📈 Progress: ${Math.min(i + batchSize, bulkOps.length)} / ${bulkOps.length}`);
                }
                logger.info(`✅ Smart Reparenting complete. Fixed ${reparentedCount} orphans.`);
            }
        }

        if (isApply) {
            logger.info('🚀 --apply flag detected. Starting general remediation via bulkWrite...');
            const bulkOps: unknown[] = [];

            for (const issue of issues) {
                const locRaw = locationMap.get(issue.id);
                if (!locRaw) continue;

                const updates: Partial<LocationDoc> = {};

                // Fix path if mismatch
                if (issue.problems.some((p: string) => p.includes('Path mismatch') || p.includes('Path array is empty'))) {
                    updates.path = [locRaw._id];
                }

                // Fix slug if mismatch
                if (issue.problems.some((p: string) => p.includes('Slug Mismatch'))) {
                    let stateName = '';
                    const pathForSlug = updates.path || locRaw.path || [];
                    if (locRaw.level !== 'state' && locRaw.level !== 'country') {
                        for (const pid of pathForSlug) {
                            const p = locationMap.get(pid.toString());
                            if (p && p.level === 'state') {
                                stateName = p.name;
                                break;
                            }
                        }
                    }
                    updates.slug = buildLocationSlug(locRaw.name, stateName, locRaw.country);
                }

                if (Object.keys(updates).length > 0) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: locRaw._id },
                            update: { $set: updates }
                        }
                    });
                }
            }

            if (bulkOps.length > 0) {
                logger.info(`📤 Executing ${bulkOps.length} updates in batches (bypassing hooks)...`);
                const batchSize = 1000;
                for (let i = 0; i < bulkOps.length; i += batchSize) {
                    const batch = bulkOps.slice(i, i + batchSize);
                    await Location.collection.bulkWrite(batch as any[]);
                    logger.info(`📈 Progress: ${Math.min(i + batchSize, bulkOps.length)} / ${bulkOps.length}`);
                }
                logger.info('✅ Remediation complete.');
            } else {
                logger.info('ℹ️ No auto-remediable issues found.');
            }
        } else {
            logger.info('💡 Run with --apply to automatically fix Path and Slug issues.');
            logger.info('💡 Run with --smart-reparent --apply to automatically fix Orphan Hierarchy issues.');
        }

    } catch (error) {
        logger.error('❌ Audit failed:', error);
        process.exit(1);
    }
}

import { connectDB } from '../config/db';

// Execute audit
void (async () => {
    try {
        await connectDB();
        await runAudit();
        logger.info('🏁 Audit process finished.');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Global Audit Failure:', error);
        process.exit(1);
    }
})();
