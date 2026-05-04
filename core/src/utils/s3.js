"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeStoredImageUrls = exports.s3Client = void 0;
exports.getBucketName = getBucketName;
exports.getMissingS3UploadConfigKeys = getMissingS3UploadConfigKeys;
exports.isS3UploadConfigured = isS3UploadConfigured;
exports.uploadToS3 = uploadToS3;
exports.generatePresignedUploadUrl = generatePresignedUploadUrl;
exports.isValidS3PublicImageUrl = isValidS3PublicImageUrl;
exports.isValidPersistedImageUrl = isValidPersistedImageUrl;
exports.isPlaceholderImageUrl = isPlaceholderImageUrl;
exports.sanitizePersistedImageUrls = sanitizePersistedImageUrls;
exports.getSignedFileUrl = getSignedFileUrl;
exports.extractS3KeyFromUrl = extractS3KeyFromUrl;
exports.deleteFromS3ByKey = deleteFromS3ByKey;
exports.deleteFromS3Url = deleteFromS3Url;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_1 = __importDefault(require("./logger"));
const image_domain_registry_json_1 = __importDefault(require("@esparex/shared/constants/image-domain-registry.json"));
const env_1 = require("@core/config/env");
const ALLOWED_S3_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'video/mp4',
    'application/pdf',
]);
const normalizeMimeType = (contentType) => contentType.split(';')[0]?.trim().toLowerCase() || '';
const S3_PUBLIC_HOST_REGEX = new RegExp(image_domain_registry_json_1.default.s3PublicHostPattern, 'i');
const S3_PATH_STYLE_HOST_REGEX = new RegExp(image_domain_registry_json_1.default.s3PathStyleHostPattern, 'i');
const IMAGE_PLACEHOLDER_URL = image_domain_registry_json_1.default.placeholderImageUrl;
const PLACEHOLDER_HOSTS = new Set(['placehold.co']);
// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION UNIFICATION
// ─────────────────────────────────────────────────────────────────────────────
const getAwsRegion = () => (env_1.env.AWS_REGION || 'ap-south-1').trim();
const getS3BaseUrl = (bucket) => {
    const cloudfrontUrl = env_1.env.AWS_CLOUDFRONT_URL;
    if (cloudfrontUrl) {
        return cloudfrontUrl.trim().replace(/\/$/, '');
    }
    return `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com`;
};
exports.s3Client = new client_s3_1.S3Client({
    region: getAwsRegion(),
    credentials: {
        accessKeyId: env_1.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: env_1.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
function getBucketName() {
    return (env_1.env.S3_BUCKET_NAME || env_1.env.AWS_S3_BUCKET || '').trim();
}
function getMissingS3UploadConfigKeys() {
    const requiredConfig = {
        AWS_ACCESS_KEY_ID: (env_1.env.AWS_ACCESS_KEY_ID || '').trim(),
        AWS_SECRET_ACCESS_KEY: (env_1.env.AWS_SECRET_ACCESS_KEY || '').trim(),
        AWS_REGION: (env_1.env.AWS_REGION || '').trim(),
        S3_BUCKET_NAME: getBucketName(),
    };
    return Object.entries(requiredConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key);
}
function isS3UploadConfigured() {
    return getMissingS3UploadConfigKeys().length === 0;
}
// ─────────────────────────────────────────────────────────────────────────────
// CORE UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
async function uploadToS3(fileBuffer, fileName, contentType = 'image/jpeg') {
    const activeBucket = getBucketName();
    if (!activeBucket) {
        throw new Error('S3_BUCKET_NAME environment variable is not defined');
    }
    const normalizedContentType = normalizeMimeType(contentType);
    if (!ALLOWED_S3_MIME_TYPES.has(normalizedContentType)) {
        throw new Error(`Unsupported file type for S3 upload: ${normalizedContentType || 'unknown'}`);
    }
    const command = new client_s3_1.PutObjectCommand({
        Bucket: activeBucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: normalizedContentType,
        // No ACL header — public read is granted via bucket policy, not per-object ACL.
        // Using ACL: 'public-read' conflicts with AWS Block Public Access defaults on
        // buckets created after April 2023 and causes silent 403s.
        CacheControl: 'max-age=31536000, public', // Long cache for immutable uploads
    });
    try {
        await exports.s3Client.send(command);
        const url = `${getS3BaseUrl(activeBucket).replace(/\/$/, '')}/${fileName}`;
        if (!isValidS3PublicImageUrl(url)) {
            throw new Error(`Generated S3 URL does not match expected public domain pattern: ${url}`);
        }
        return url;
    }
    catch (error) {
        logger_1.default.error('Error uploading to S3:', error);
        throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Generate a pre-signed S3 PUT URL so the browser can upload directly to S3
 * without routing file bytes through the Node.js server.
 *
 * @param key         - Full S3 object key (e.g. "ads/2024/abc123.webp")
 * @param contentType - MIME type of the file to be uploaded
 * @param expiresIn   - Seconds until the URL expires (default: 300 s / 5 min)
 */
async function generatePresignedUploadUrl(key, contentType, expiresIn = 300) {
    const bucket = getBucketName();
    if (!bucket)
        throw new Error('S3_BUCKET_NAME environment variable is not defined');
    const normalizedContentType = normalizeMimeType(contentType);
    if (!ALLOWED_S3_MIME_TYPES.has(normalizedContentType)) {
        throw new Error(`Unsupported file type for presigned upload: ${normalizedContentType || 'unknown'}`);
    }
    const command = new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: normalizedContentType,
        // No ACL header — public read granted via bucket policy (see AWS Console).
        CacheControl: 'max-age=31536000, public',
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn });
    const publicUrl = `${getS3BaseUrl(bucket).replace(/\/$/, '')}/${key}`;
    logger_1.default.info('Generated presigned upload URL', { key, expiresIn });
    return { uploadUrl, publicUrl, key };
}
const isHttpsUrl = (value) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
};
function isValidS3PublicImageUrl(url) {
    if (!isHttpsUrl(url))
        return false;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
        if (!pathname)
            return false;
        const cloudfrontStr = env_1.env.AWS_CLOUDFRONT_URL;
        if (cloudfrontStr) {
            try {
                const cdnHost = new URL(cloudfrontStr).hostname.toLowerCase();
                if (host === cdnHost || host.endsWith('.cloudfront.net') || host.endsWith('.esparex.com')) {
                    return true;
                }
            }
            catch { }
        }
        if (S3_PUBLIC_HOST_REGEX.test(host)) {
            return true;
        }
        if (!S3_PATH_STYLE_HOST_REGEX.test(host)) {
            return false;
        }
        const activeBucket = getBucketName();
        if (!activeBucket)
            return true;
        return pathname.startsWith(`${activeBucket}/`);
    }
    catch {
        return false;
    }
}
function isValidPersistedImageUrl(url) {
    if (!url || typeof url !== 'string')
        return false;
    const trimmed = url.trim();
    if (!trimmed)
        return false;
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:'))
        return false;
    if (trimmed.startsWith(image_domain_registry_json_1.default.placeholderImageUrl)) {
        return true;
    }
    // Unify frontend/backend whitelists by allowing explicitly defined remote patterns
    try {
        const parsed = new URL(trimmed);
        const host = parsed.hostname.toLowerCase();
        const isWhitelistedRemotePattern = image_domain_registry_json_1.default.nextRemotePatterns.some((pattern) => {
            const patternHost = pattern.hostname.toLowerCase();
            if (patternHost === host)
                return true;
            if (patternHost.startsWith('**.')) {
                return host.endsWith(patternHost.slice(3)) || host === patternHost.slice(3);
            }
            return false;
        });
        if (isWhitelistedRemotePattern) {
            return true;
        }
    }
    catch {
        // Ignore parsing errors and fallback to strictly checked S3 regexes below
    }
    return isValidS3PublicImageUrl(trimmed);
}
function isPlaceholderImageUrl(url) {
    if (!url || typeof url !== 'string')
        return false;
    try {
        const parsed = new URL(url.trim());
        return PLACEHOLDER_HOSTS.has(parsed.hostname.toLowerCase());
    }
    catch {
        return false;
    }
}
const normalizeSanitizeOptions = (options) => {
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
function sanitizePersistedImageUrls(urls, options = true) {
    const { fallbackToPlaceholder, allowPlaceholder } = normalizeSanitizeOptions(options);
    const sanitized = urls
        .filter((url) => typeof url === 'string')
        .map((url) => url.trim())
        .filter((url) => {
        if (!allowPlaceholder && isPlaceholderImageUrl(url)) {
            logger_1.default.warn('Filtered placeholder image URL from persistence payload', { url });
            return false;
        }
        const allowed = isValidPersistedImageUrl(url);
        if (!allowed) {
            logger_1.default.warn('Filtered invalid image URL from persistence payload', { url });
        }
        return allowed;
    });
    if (sanitized.length > 0)
        return sanitized;
    return fallbackToPlaceholder ? [IMAGE_PLACEHOLDER_URL] : [];
}
const sanitizeStoredImageUrls = (urls) => {
    // We relax placeholder filtering here. 
    // Even if S3 is configured, we allow placeholders (e.g. from tests or legacy data) 
    // to prevent stripping the images array entirely if no real S3 images are found.
    return sanitizePersistedImageUrls(urls, {
        fallbackToPlaceholder: true,
        allowPlaceholder: true,
    });
};
exports.sanitizeStoredImageUrls = sanitizeStoredImageUrls;
async function getSignedFileUrl(key, expiresInSeconds = 3600) {
    const activeBucket = getBucketName();
    if (!activeBucket)
        return "";
    const command = new client_s3_1.GetObjectCommand({
        Bucket: activeBucket,
        Key: key
    });
    try {
        return await (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn: expiresInSeconds });
    }
    catch (error) {
        logger_1.default.error("Error generating signed URL:", error);
        return "";
    }
}
function extractS3KeyFromUrl(url) {
    if (!url || typeof url !== 'string')
        return null;
    const activeBucket = getBucketName();
    if (!activeBucket)
        return null;
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const normalizedPath = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
        if (!normalizedPath)
            return null;
        const cloudfrontStr = env_1.env.AWS_CLOUDFRONT_URL;
        if (cloudfrontStr) {
            try {
                const cdnHost = new URL(cloudfrontStr).hostname.toLowerCase();
                if (host === cdnHost || host.endsWith('.cloudfront.net') || host.endsWith('.esparex.com')) {
                    return normalizedPath;
                }
            }
            catch { }
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
    }
    catch {
        return null;
    }
}
async function deleteFromS3ByKey(key) {
    if (!key)
        return false;
    const activeBucket = getBucketName();
    if (!activeBucket) {
        throw new Error('S3_BUCKET_NAME environment variable is not defined');
    }
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: activeBucket,
            Key: key
        });
        await exports.s3Client.send(command);
        return true;
    }
    catch (error) {
        logger_1.default.error('Error deleting from S3:', error);
        return false;
    }
}
async function deleteFromS3Url(url) {
    const key = extractS3KeyFromUrl(url);
    if (!key)
        return false;
    return deleteFromS3ByKey(key);
}
//# sourceMappingURL=s3.js.map