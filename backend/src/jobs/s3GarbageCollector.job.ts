import logger from "../utils/logger";
import { runWithDistributedJobLock } from "../utils/distributedJobLock";
import AdImage from '../models/AdImage';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { s3Client, getBucketName } from '../utils/s3';
import User from '../models/User';
import Ad from '../models/Ad';
import Business from '../models/Business';

/**
 * How long after upload a key is treated as "safe" regardless of DB reference.
 * Protects objects that were just uploaded via pre-signed URL but the ad hasn't
 * been saved to the DB yet (e.g. user still filling in the form).
 */
const GRACE_PERIOD_HOURS = 2;

/**
 * S3 prefixes to scan. Each should match a folder that the application writes to.
 *   ads/       - Ad images (pre-signed + legacy proxy uploads)
 *   staging/   - Temporary landing zone for pre-signed uploads before ad creation
 *   users/     - User avatars
 *   avatars/   - Alternative avatar prefix
 *   businesses/ - Business logos & documents
 *   business/  - Alternative business prefix
 *   service/   - Service listing images
 *   services/  - Alternative services prefix
 */
const SCAN_PREFIXES = [
    'ads/',
    'staging/',
    'users/',
    'avatars/',
    'businesses/',
    'business/',
    'service/',
    'services/',
];

const extractKey = (url: string | undefined): string | null => {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        // Strip leading slash — S3 keys never start with /
        return parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname;
    } catch {
        return url;
    }
};

export const runS3GarbageCollectorJob = async () => {
    await runWithDistributedJobLock(
        's3_garbage_collector_job',
        { ttlMs: 30 * 60 * 1000, failOpen: false },
        async () => {
            const bucketName = getBucketName();
            if (!bucketName) {
                logger.warn('S3 Garbage Collector Job skipped: S3_BUCKET_NAME not configured');
                return;
            }

            const isDryRun = process.env.DRY_RUN_S3_CLEANUP === 'true';
            logger.info('S3 Garbage Collector Job started', { isDryRun, gracePeriodHours: GRACE_PERIOD_HOURS });

            try {
                // ── Step 1: Collect all referenced S3 keys from MongoDB ────────────────
                const validKeys = new Set<string>();

                // A. AdImage table (dedicated image records)
                const adImagesTable = await AdImage.find().select('imageUrl').lean();
                adImagesTable.forEach(img => {
                    const key = extractKey(img.imageUrl);
                    if (key) validKeys.add(key);
                });

                // B. Ad embedded images (ads, services, spare parts — all share the Ad model)
                const ads = await Ad.find().select('images').lean();
                ads.forEach(ad => {
                    ad.images?.forEach(url => {
                        const key = extractKey(url);
                        if (key) validKeys.add(key);
                    });
                });

                // C. User avatars
                const users = await User.find({ avatar: { $exists: true, $ne: null } }).select('avatar').lean();
                users.forEach(u => {
                    const key = extractKey(u.avatar);
                    if (key) validKeys.add(key);
                });

                // D. Business images & documents
                const businesses = await Business.find().select('images documents logo').lean();
                businesses.forEach(b => {
                    // Logo
                    const logoKey = extractKey((b as any).logo);
                    if (logoKey) validKeys.add(logoKey);

                    // Image array
                    b.images?.forEach(url => {
                        const key = extractKey(url);
                        if (key) validKeys.add(key);
                    });

                    // Document fields
                    if (b.documents) {
                        const docs = b.documents as any;
                        const docFields = ['idProof', 'businessProof', 'certificates'];
                        docFields.forEach(field => {
                            if (Array.isArray(docs[field])) {
                                docs[field].forEach((url: string) => {
                                    const key = extractKey(url);
                                    if (key) validKeys.add(key);
                                });
                            }
                        });
                    }
                });

                logger.info(`Gathered ${validKeys.size} valid referenced keys from DB.`);

                // ── Step 2: Scan S3 and find orphan keys ────────────────────────────────
                const graceCutoff = new Date(Date.now() - GRACE_PERIOD_HOURS * 60 * 60 * 1000);
                const orphanKeys: string[] = [];
                let totalScanned = 0;

                for (const prefix of SCAN_PREFIXES) {
                    let isTruncated = true;
                    let continuationToken: string | undefined;

                    while (isTruncated) {
                        const command = new ListObjectsV2Command({
                            Bucket: bucketName,
                            Prefix: prefix,
                            ContinuationToken: continuationToken,
                        });

                        const response = await s3Client.send(command).catch(err => {
                            logger.error(`S3 List Bucket error for prefix "${prefix}":`, err);
                            return null;
                        });

                        if (!response) {
                            isTruncated = false;
                            continue;
                        }

                        const contents = response.Contents || [];
                        totalScanned += contents.length;

                        for (const item of contents) {
                            if (!item.Key || item.Key.endsWith('/')) continue;

                            // Grace period: skip objects uploaded within the last 2 hours
                            if (item.LastModified && item.LastModified > graceCutoff) continue;

                            if (!validKeys.has(item.Key)) {
                                orphanKeys.push(item.Key);
                            }
                        }

                        isTruncated = !!response.IsTruncated;
                        continuationToken = response.NextContinuationToken;
                    }
                }

                logger.info(`S3 scan complete`, {
                    totalScanned,
                    totalOrphans: orphanKeys.length,
                    validKeys: validKeys.size,
                });

                // ── Step 3: Delete orphans ───────────────────────────────────────────────
                if (orphanKeys.length === 0) {
                    logger.info('No orphan objects found in S3. Bucket is clean.');
                    return;
                }

                if (isDryRun) {
                    logger.info(`[DRY RUN] Would delete ${orphanKeys.length} orphan objects.`, {
                        preview: orphanKeys.slice(0, 5),
                    });
                    return;
                }

                logger.warn(`Deleting ${orphanKeys.length} orphan S3 objects...`);
                let deletedCount = 0;

                // S3 DeleteObjects accepts at most 1000 keys per call
                for (let i = 0; i < orphanKeys.length; i += 1000) {
                    const batch = orphanKeys.slice(i, i + 1000);
                    const deleteResult = await s3Client.send(new DeleteObjectsCommand({
                        Bucket: bucketName,
                        Delete: {
                            Objects: batch.map(Key => ({ Key })),
                            Quiet: false,  // Return errors if any
                        },
                    })).catch(err => {
                        logger.error('S3 batch delete error', { batch: batch.slice(0, 3), err });
                        return null;
                    });

                    if (deleteResult?.Errors?.length) {
                        logger.warn('Some S3 objects could not be deleted', {
                            errors: deleteResult.Errors.slice(0, 5),
                        });
                    }

                    deletedCount += deleteResult?.Deleted?.length ?? 0;
                }

                logger.info(`S3 Garbage Collector Job complete`, {
                    deletedCount,
                    totalOrphans: orphanKeys.length,
                });

            } catch (error) {
                logger.error('S3 Garbage Collector Job failed unexpectedly', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
    );
};
