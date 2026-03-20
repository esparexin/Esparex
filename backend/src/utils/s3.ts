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
    return (process.env.S3_BUCKET_NAME || '').trim();
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
        ContentDisposition: 'inline',
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

    return isValidS3PublicImageUrl(trimmed);
}

export function sanitizePersistedImageUrls(urls: string[], fallbackToPlaceholder: boolean = true): string[] {
    const sanitized = urls
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter((url) => {
            const allowed = isValidPersistedImageUrl(url);
            if (!allowed) {
                logger.warn('Filtered invalid image URL from persistence payload', { url });
            }
            return allowed;
        });

    if (sanitized.length > 0) return sanitized;
    return fallbackToPlaceholder ? [IMAGE_PLACEHOLDER_URL] : [];
}

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
