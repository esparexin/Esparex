import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from './logger';
import imageDomainRegistry from '@shared/constants/image-domain-registry.json';

const ALLOWED_S3_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'application/pdf',
]);

const normalizeMimeType = (contentType: string): string =>
    contentType.split(';')[0]?.trim().toLowerCase() || '';

const S3_PUBLIC_HOST_REGEX = new RegExp(imageDomainRegistry.s3PublicHostPattern, 'i');
const S3_PATH_STYLE_HOST_REGEX = new RegExp(imageDomainRegistry.s3PathStyleHostPattern, 'i');
const IMAGE_PLACEHOLDER_URL = imageDomainRegistry.placeholderImageUrl;
const PLACEHOLDER_HOSTS = new Set(['placehold.co']);

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION UNIFICATION
// ─────────────────────────────────────────────────────────────────────────────
const getAwsRegion = (): string => (process.env.AWS_REGION || 'ap-south-1').trim();
const getS3BaseUrl = (bucket: string): string => {
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL;
    if (cloudfrontUrl) {
        return cloudfrontUrl.trim().replace(/\/$/, '');
    }
    return `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com`;
};

export const s3Client = new S3Client({
    region: getAwsRegion(),
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export function getBucketName(): string {
    return (process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || '').trim();
}

export function getMissingS3UploadConfigKeys(): string[] {
    const requiredConfig = {
        AWS_ACCESS_KEY_ID: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
        AWS_SECRET_ACCESS_KEY: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
        AWS_REGION: (process.env.AWS_REGION || '').trim(),
        S3_BUCKET_NAME: getBucketName(),
    };

    return Object.entries(requiredConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key);
}

export function isS3UploadConfigured(): boolean {
    return getMissingS3UploadConfigKeys().length === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export async function uploadToS3(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'image/jpeg'
): Promise<string> {
    const activeBucket = getBucketName();

    if (!activeBucket) {
        throw new Error('S3_BUCKET_NAME environment variable is not defined');
    }

    const normalizedContentType = normalizeMimeType(contentType);
    if (!ALLOWED_S3_MIME_TYPES.has(normalizedContentType)) {
        throw new Error(`Unsupported file type for S3 upload: ${normalizedContentType || 'unknown'}`);
    }

    const command = new PutObjectCommand({
        Bucket: activeBucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: normalizedContentType,
        ACL: 'public-read', // Ensure public visibility for direct S3 URLs
        CacheControl: 'max-age=31536000, public', // CloudFront long-cache for immutable uploads
    });

    try {
        await s3Client.send(command);
        const url = `${getS3BaseUrl(activeBucket).replace(/\/$/, '')}/${fileName}`;

        if (!isValidS3PublicImageUrl(url)) {
            throw new Error(`Generated S3 URL does not match expected public domain pattern: ${url}`);
        }
        return url;
    } catch (error) {
        logger.error('Error uploading to S3:', error);
        throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-SIGNED UPLOAD URL GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export interface PresignedUploadResult {
    /** Time-limited PUT URL — send file bytes here directly from the browser */
    uploadUrl: string;
    /** Canonical public / CloudFront URL to store in the DB after upload */
    publicUrl: string;
    /** S3 object key */
    key: string;
}

/**
 * Generate a pre-signed S3 PUT URL so the browser can upload directly to S3
 * without routing file bytes through the Node.js server.
 *
 * @param key         - Full S3 object key (e.g. "ads/2024/abc123.webp")
 * @param contentType - MIME type of the file to be uploaded
 * @param expiresIn   - Seconds until the URL expires (default: 300 s / 5 min)
 */
export async function generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 300
): Promise<PresignedUploadResult> {
    const bucket = getBucketName();
    if (!bucket) throw new Error('S3_BUCKET_NAME environment variable is not defined');

    const normalizedContentType = normalizeMimeType(contentType);
    if (!ALLOWED_S3_MIME_TYPES.has(normalizedContentType)) {
        throw new Error(`Unsupported file type for presigned upload: ${normalizedContentType || 'unknown'}`);
    }

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: normalizedContentType,
        ACL: 'public-read',
        CacheControl: 'max-age=31536000, public',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    const publicUrl = `${getS3BaseUrl(bucket).replace(/\/$/, '')}/${key}`;

    logger.info('Generated presigned upload URL', { key, expiresIn });

    return { uploadUrl, publicUrl, key };
}

const isHttpsUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

export function isValidS3PublicImageUrl(url: string): boolean {
    if (!isHttpsUrl(url)) return false;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
        if (!pathname) return false;

        const cloudfrontStr = process.env.AWS_CLOUDFRONT_URL;
        if (cloudfrontStr) {
            try {
                const cdnHost = new URL(cloudfrontStr).hostname.toLowerCase();
                if (host === cdnHost || host.endsWith('.cloudfront.net') || host.endsWith('.esparex.com')) {
                    return true;
                }
            } catch { }
        }

        if (S3_PUBLIC_HOST_REGEX.test(host)) {
            return true;
        }

        if (!S3_PATH_STYLE_HOST_REGEX.test(host)) {
            return false;
        }

        const activeBucket = getBucketName();
        if (!activeBucket) return true;
        return pathname.startsWith(`${activeBucket}/`);
    } catch {
        return false;
    }
}

export function isValidPersistedImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return false;

    if (trimmed.startsWith(imageDomainRegistry.placeholderImageUrl)) {
        return true;
    }

    // Unify frontend/backend whitelists by allowing explicitly defined remote patterns
    try {
        const parsed = new URL(trimmed);
        const host = parsed.hostname.toLowerCase();

        const isWhitelistedRemotePattern = imageDomainRegistry.nextRemotePatterns.some(pattern => {
            const patternHost = pattern.hostname.toLowerCase();
            if (patternHost === host) return true;
            if (patternHost.startsWith('**.')) {
                return host.endsWith(patternHost.slice(3)) || host === patternHost.slice(3);
            }
            return false;
        });

        if (isWhitelistedRemotePattern) {
            return true;
        }
    } catch {
        // Ignore parsing errors and fallback to strictly checked S3 regexes below
    }

    return isValidS3PublicImageUrl(trimmed);
}

export function isPlaceholderImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    try {
        const parsed = new URL(url.trim());
        return PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase());
    } catch {
        return false;
    }
}

type SanitizePersistedImageOptions = {
    fallbackToPlaceholder?: boolean;
    allowPlaceholder?: boolean;
};

const normalizeSanitizeOptions = (
    options: boolean | SanitizePersistedImageOptions | undefined
): Required<SanitizePersistedImageOptions> => {
    if (typeof options === 'boolean') {
        return {
            fallbackToPlaceholder: options,
            allowPlaceholder: true,
        };
    }

    return {
        fallbackToPlaceholder: options?.fallbackToPlaceholder ?? true,
        allowPlaceholder: options?.allowPlaceholder ?? true,
    };
};

export function sanitizePersistedImageUrls(
    urls: string[],
    options: boolean | SanitizePersistedImageOptions = true
): string[] {
    const { fallbackToPlaceholder, allowPlaceholder } = normalizeSanitizeOptions(options);
    const sanitized = urls
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter((url) => {
            if (!allowPlaceholder && isPlaceholderImageUrl(url)) {
                logger.warn('Filtered placeholder image URL from persistence payload', { url });
                return false;
            }
            const allowed = isValidPersistedImageUrl(url);
            if (!allowed) {
                logger.warn('Filtered invalid image URL from persistence payload', { url });
            }
            return allowed;
        });

    if (sanitized.length > 0) return sanitized;
    return fallbackToPlaceholder ? [IMAGE_PLACEHOLDER_URL] : [];
}

export const sanitizeStoredImageUrls = (urls: string[]): string[] => {
    // We relax placeholder filtering here. 
    // Even if S3 is configured, we allow placeholders (e.g. from tests or legacy data) 
    // to prevent stripping the images array entirely if no real S3 images are found.
    return sanitizePersistedImageUrls(urls, {
        fallbackToPlaceholder: true,
        allowPlaceholder: true,
    });
};

export async function getSignedFileUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const activeBucket = getBucketName();
    if (!activeBucket) return "";

    const command = new GetObjectCommand({
        Bucket: activeBucket,
        Key: key
    });

    try {
        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
        logger.error("Error generating signed URL:", error);
        return "";
    }
}

function extractS3KeyFromUrl(url: string): string | null {
    if (!url || typeof url !== 'string') return null;

    const activeBucket = getBucketName();
    if (!activeBucket) return null;

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const normalizedPath = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
        if (!normalizedPath) return null;

        const cloudfrontStr = process.env.AWS_CLOUDFRONT_URL;
        if (cloudfrontStr) {
            try {
                const cdnHost = new URL(cloudfrontStr).hostname.toLowerCase();
                if (host === cdnHost || host.endsWith('.cloudfront.net') || host.endsWith('.esparex.com')) {
                    return normalizedPath;
                }
            } catch { }
        }

        const bucketLower = activeBucket.toLowerCase();

        // Virtual-hosted style: bucket.s3.region.amazonaws.com/key
        if (host.startsWith(`${bucketLower}.s3.`) || host === `${bucketLower}.s3.amazonaws.com`) {
            return normalizedPath;
        }

        // Path-style: s3.region.amazonaws.com/bucket/key
        if ((host.startsWith('s3.') || host === 's3.amazonaws.com') && normalizedPath.startsWith(`${activeBucket}/`)) {
            return normalizedPath.slice(activeBucket.length + 1);
        }

        return null;
    } catch {
        return null;
    }
}

export async function deleteFromS3ByKey(key: string): Promise<boolean> {
    if (!key) return false;

    const activeBucket = getBucketName();
    if (!activeBucket) {
        throw new Error('S3_BUCKET_NAME environment variable is not defined');
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: activeBucket,
            Key: key
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        logger.error('Error deleting from S3:', error);
        return false;
    }
}

export async function deleteFromS3Url(url: string): Promise<boolean> {
    const key = extractS3KeyFromUrl(url);
    if (!key) return false;
    return deleteFromS3ByKey(key);
}
