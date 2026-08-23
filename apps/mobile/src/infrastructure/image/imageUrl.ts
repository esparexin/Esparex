import { API_V1_BASE_PATH } from '@esparex/shared';

const resolveApiOrigin = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (typeof apiUrl === 'string' && apiUrl.trim().length > 0) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      // Fall through on malformed env URL
    }
  }
  return 'https://api.esparex.in';
};

/**
 * Normalizes relative upload paths (e.g. `/uploads/...`) to absolute URLs using active API origin.
 * Mobile images must be served over HTTPS unless specific cleartext exceptions are made.
 * Production images are expected to be at {origin}/api/v1/uploads/...
 */
export const normalizeImageUrl = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('/uploads/')) {
    const origin = resolveApiOrigin();
    // Ensure versioned path is included for mobile image resolution
    return `${origin}${API_V1_BASE_PATH}${trimmed}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's a local development URL using http, it might be blocked on Android by default
    // but we return it as is and let the OS/Config handle it.
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    const origin = resolveApiOrigin();
    return `${origin}${trimmed}`;
  }

  return trimmed;
};
