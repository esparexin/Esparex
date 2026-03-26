import { 
    DEFAULT_IMAGE_PLACEHOLDER,
    isLocalHttpHost, 
    isAllowedRemoteHost, 
    isValidS3Host 
} from '@shared/listingUtils/imageUtils';

export { DEFAULT_IMAGE_PLACEHOLDER };

const resolveApiOrigin = (): string => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (typeof apiUrl === 'string' && apiUrl.trim().length > 0) {
        try {
            return new URL(apiUrl).origin;
        } catch {
            // Ignore malformed env and fall through.
        }
    }

    if (typeof window !== 'undefined') {
        const { protocol, hostname, origin } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:5001`;
        }
        return origin;
    }

    return '';
};

const normalizePotentialUploadPath = (value: string): string => {
    if (!value.startsWith('/uploads/')) return value;
    const origin = resolveApiOrigin();
    return origin ? `${origin}${value}` : value;
};

const normalizeImageUrlCandidate = (value: unknown): string => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return normalizePotentialUploadPath(trimmed);
};

export const isRenderableImageUrl = (value: unknown): value is string => {
    const trimmed = normalizeImageUrlCandidate(value);
    if (!trimmed) return false;

    // Relative upload paths are invalid for next/image and must be absolute.
    if (trimmed.startsWith('/uploads/')) return false;
    if (trimmed.startsWith('/')) return true;
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return false;

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

export const toSafeImageSrc = (value: unknown, fallback: string = DEFAULT_IMAGE_PLACEHOLDER): string =>
    (() => {
        const normalized = normalizeImageUrlCandidate(value);
        return isRenderableImageUrl(normalized) ? normalized : fallback;
    })();

export const toSafeImageArray = (values: unknown): string[] => {
    if (!Array.isArray(values)) return [DEFAULT_IMAGE_PLACEHOLDER];
    const normalized = values
        .map((value) => {
            const candidate = normalizeImageUrlCandidate(value);
            return isRenderableImageUrl(candidate) ? candidate : '';
        })
        .filter((value) => value.length > 0);
    return normalized.length > 0 ? normalized : [DEFAULT_IMAGE_PLACEHOLDER];
};
