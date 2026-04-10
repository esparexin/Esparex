/**
 * mapErrorToMessage
 *
 * Extracts a safe, user-facing message from an unknown error value.
 * Checks common API response shapes before falling back to the
 * provided default message.
 *
 * Priority:
 *   1. error.userMessage          (custom API error field)
 *   2. error.response.data.error  (backend JSON envelope)
 *   3. error.response.data.message
 *   4. error.message              (standard Error)
 *   5. fallback                   (caller-supplied default)
 */
export function mapErrorToMessage(error: unknown, fallback: string): string {
    if (!error) return fallback;

    if (typeof error === 'string' && error.trim()) return error.trim();

    if (typeof error !== 'object') return fallback;

    const e = error as Record<string, unknown>;

    // API error — userMessage field
    if (typeof e.userMessage === 'string' && e.userMessage.trim()) {
        return e.userMessage.trim();
    }

    // Axios/fetch response envelope
    const responseData = (
        e.response && typeof e.response === 'object'
            ? (e.response as Record<string, unknown>).data
            : undefined
    ) as Record<string, unknown> | undefined;

    if (responseData) {
        if (typeof responseData.error === 'string' && responseData.error.trim()) {
            return responseData.error.trim();
        }
        if (typeof responseData.message === 'string' && responseData.message.trim()) {
            return responseData.message.trim();
        }
    }

    // Standard Error.message — suppress generic transport noise
    if (typeof e.message === 'string' && e.message.trim()) {
        const msg = e.message.trim();
        const isTransportNoise =
            /^request failed with status code \d+$/i.test(msg) ||
            /^network error$/i.test(msg) ||
            /^timeout of \d+ms exceeded$/i.test(msg);
        if (!isTransportNoise) return msg;
    }

    return fallback;
}
