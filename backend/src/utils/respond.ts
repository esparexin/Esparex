import { serializeDoc } from './serialize';

/**
 * Enforces explicit type checking for API response payloads 
 * and automatically normalizes Mongo _id to id.
 * @param payload The data to be sent in the response
 * @returns The payload, verified to match type T and normalized
 */
export function respond<T>(payload: T): T {
    return serializeDoc(payload);
}
