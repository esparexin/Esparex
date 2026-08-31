import {
    DEFAULT_IMAGE_PLACEHOLDER,
    isRenderableImageUrl as sharedIsRenderableImageUrl,
    toSafeImageSrc as sharedToSafeImageSrc,
} from "@esparex/shared";
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

export const isRenderableImageUrl = (value: unknown): value is string => {
    if (typeof value === 'string' && (value.startsWith('blob:') || value.startsWith('data:'))) {
        return false;
    }
    return sharedIsRenderableImageUrl(value, resolveApiOrigin());
};

export const toSafeImageSrc = (value: unknown, fallback: string = DEFAULT_IMAGE_PLACEHOLDER): string => {
    const origin = resolveApiOrigin();
    if (typeof value === 'string' && (value.startsWith('blob:') || value.startsWith('data:'))) {
        return fallback;
    }
    return sharedToSafeImageSrc(value, origin, fallback);
};

export const toSafeImageArray = (values: unknown): string[] => {
    if (!Array.isArray(values)) return [DEFAULT_IMAGE_PLACEHOLDER];
    const origin = resolveApiOrigin();
    const normalized = values
        .filter((val): val is string => typeof val === 'string' && !val.startsWith('blob:') && !val.startsWith('data:'))
        .map((value) => (sharedIsRenderableImageUrl(value, origin) ? (value.startsWith('/uploads/') ? `${origin}${value}` : value) : ''))
        .filter((value) => value.length > 0);
    return normalized.length > 0 ? normalized : [DEFAULT_IMAGE_PLACEHOLDER];
};
