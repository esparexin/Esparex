import logger from "../utils/logger";
import { runWithDistributedJobLock } from "../utils/distributedJobLock";
import AdImage from '../models/AdImage';
import { ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { s3Client, getBucketName } from '../utils/s3';
import User from '../models/User';
import Ad from '../models/Ad';
import Business from '../models/Business';

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

            try {
                logger.info('S3 Garbage Collector Job started');

                // 1. Gather ALL referenced keys from Database
                const validKeys = new Set<string>();

                const extractKey = (url: string | undefined): string | null => {
                    if (!url) return null;
                    try {
                        const parsed = new URL(url);
                        // Strip leading slash if present
                        return parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname;
                    } catch {
                        return url;
                    }
                };

                // A. Ad Images (Public Ads, Services, Spare Parts)
                const adImagesTable = await AdImage.find().select('imageUrl').lean();
                adImagesTable.forEach(img => {
                    const key = extractKey(img.imageUrl);
                    if (key) validKeys.add(key);
                });

                const ads = await Ad.find().select('images').lean();
                ads.forEach(ad => {
                    ad.images?.forEach(url => {
                        const key = extractKey(url);
                        if (key) validKeys.add(key);
                    });
                });

                // B. User Avatars
                const users = await User.find({ avatar: { $exists: true, $ne: null } }).select('avatar').lean();
                users.forEach(u => {
                    const key = extractKey(u.avatar);
                    if (key) validKeys.add(key);
                });

                // C. Business Images & Documents
                const businesses = await Business.find().select('images documents').lean();
                businesses.forEach(b => {
                    b.images?.forEach(url => {
                        const key = extractKey(url);
                        if (key) validKeys.add(key);
                    });
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

                // 2. Scan S3 Prefixes
                const prefixes = ['ads/', 'users/', 'businesses/', 'services/'];
                let totalOrphans = 0;
                const orphanKeys: string[] = [];

                for (const prefix of prefixes) {
                    let isTruncated = true;
                    let continuationToken: string | undefined;

                    while (isTruncated) {
                        const command = new ListObjectsV2Command({
                            Bucket: bucketName,
                            Prefix: prefix,
                            ContinuationToken: continuationToken,
                        });

                        const response = await s3Client.send(command).catch(err => {
                            logger.error(`S3 List Bucket error for prefix ${prefix}:`, err);
                            return null;
                        });
                        
                        if (!response) {
                            isTruncated = false;
                            continue;
                        }

                        const contents = response.Contents || [];

                        for (const item of contents) {
                            if (item.Key && !validKeys.has(item.Key)) {
                                // Ignore directories/empty keys
                                if (item.Key.endsWith('/')) continue;
                                orphanKeys.push(item.Key);
                            }
                        }

                        isTruncated = !!response.IsTruncated;
                        continuationToken = response.NextContinuationToken;
                    }
                }

                totalOrphans = orphanKeys.length;

                // 3. Batch Delete
                if (totalOrphans > 0) {
                    logger.warn(`Found ${totalOrphans} orphan objects in S3. Proceeding with deletion...`);

                    if (process.env.DRY_RUN_S3_CLEANUP === 'true') {
                        logger.info(`[DRY RUN] Would have deleted: ${orphanKeys.slice(0, 5).join(', ')}...`);
                    } else {
                        for (let i = 0; i < orphanKeys.length; i += 1000) {
                            const batch = orphanKeys.slice(i, i + 1000);
                            await s3Client.send(new DeleteObjectsCommand({
                                Bucket: bucketName,
                                Delete: {
                                    Objects: batch.map(Key => ({ Key })),
                                    Quiet: true
                                }
                            }));
                        }
                        logger.info(`Successfully deleted ${totalOrphans} orphans.`);
                    }
                } else {
                    logger.info('No orphan objects found.');
                }

            } catch (error) {
                logger.error('S3 Garbage Collector Job failed', { error });
            }
        }
    );
};

