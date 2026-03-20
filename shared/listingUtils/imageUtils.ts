import imageDomainRegistry from '../constants/image-domain-registry.json';

export const DEFAULT_IMAGE_PLACEHOLDER = imageDomainRegistry.placeholderImageUrl;

const nextRemotePatterns = Array.isArray(imageDomainRegistry.nextRemotePatterns)
    ? imageDomainRegistry.nextRemotePatterns
    : [];

const allowedHostPatterns = nextRemotePatterns
    .map((pattern: any) => pattern?.hostname)
    .filter((hostname): hostname is string => typeof hostname === 'string' && hostname.length > 0);

const s3PublicHostRegex = new RegExp(imageDomainRegistry.s3PublicHostPattern, 'i');
const s3PathStyleHostRegex = new RegExp(imageDomainRegistry.s3PathStyleHostPattern, 'i');

const wildcardPatternToRegex = (pattern: string): RegExp => {
    let escaped = '';
    for (let i = 0; i < pattern.length; i += 1) {
        const char = pattern[i] ?? '';
        const next = pattern[i + 1] ?? '';
        if (char === '*' && next === '*') {
            escaped += '.*';
            i += 1;
            continue;
        }
        if (char === '*') {
            escaped += '[^.]+';
            continue;
        }
        if (/[.+?^${}()|[\]\\]/.test(char)) {
            escaped += `\\${char}`;
            continue;
        }
        escaped += char;
    }
    return new RegExp(`^${escaped}$`, 'i');
};

const allowedHostRegexes = allowedHostPatterns.map(wildcardPatternToRegex);

const isLocalHttpHost = (hostname: string): boolean =>
    hostname === 'localhost' || hostname === '127.0.0.1';

const isAllowedRemoteHost = (hostname: string): boolean =>
    allowedHostRegexes.some((regex) => regex.test(hostname));

const isValidS3Host = (hostname: string): boolean =>
    s3PublicHostRegex.test(hostname) || s3PathStyleHostRegex.test(hostname);

/**
 * Normalizes an image URL candidate.
 * If a custom origin is provided, it prefixed the relative upload paths.
 */
export const normalizeImageUrlCandidate = (value: unknown, origin: string = ''): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    
    if (trimmed.startsWith('/uploads/')) {
        return origin ? `${origin}${trimmed}` : trimmed;
    }
    return trimmed;
};

/**
 * Checks if a URL is renderable by the platform's image optimization engine.
 */
export const isRenderableImageUrl = (value: unknown, origin: string = ''): value is string => {
    const trimmed = normalizeImageUrlCandidate(value, origin);
    if (!trimmed) return false;

    // Relative upload paths are invalid for next/image and must be absolute.
    if (trimmed.startsWith('/uploads/')) return false;
    if (trimmed.startsWith('/')) return true;
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return true;

    try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'http:') {
            return isLocalHttpHost(parsed.hostname);
        }
        if (parsed.protocol !== 'https:') {
            return false;
        }

        const hostname = parsed.hostname.toLowerCase();
        if (!isAllowedRemoteHost(hostname)) {
            return false;
        }

        if (hostname.includes('amazonaws.com')) {
            return isValidS3Host(hostname);
        }

        return true;
    } catch {
        return false;
    }
};

/**
 * Ensures a valid image source, defaulting to the placeholder image.
 */
export const toSafeImageSrc = (value: unknown, origin: string = '', fallback: string = DEFAULT_IMAGE_PLACEHOLDER): string => {
    const normalized = normalizeImageUrlCandidate(value, origin);
    return isRenderableImageUrl(normalized, origin) ? normalized : fallback;
};

/**
 * Maps a list of image candidates into a safe array of renderable URLs.
 */
export const toSafeImageArray = (values: unknown, origin: string = ''): string[] => {
    if (!Array.isArray(values)) return [DEFAULT_IMAGE_PLACEHOLDER];
    const normalized = values
        .map((value) => {
            const candidate = normalizeImageUrlCandidate(value, origin);
            return isRenderableImageUrl(candidate, origin) ? candidate : '';
        })
        .filter((value) => value.length > 0);
    return normalized.length > 0 ? normalized : [DEFAULT_IMAGE_PLACEHOLDER];
};
