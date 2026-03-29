import {
    API_V1_BASE_PATH,
    DEFAULT_LOCAL_API_ORIGIN,
} from "../routes";

export type ServerFetchOptions = RequestInit & {
    next?: {
        revalidate?: number;
        tags?: string[];
    };
};

interface FetchUserApiJsonOptions {
    returnNullOnHttpError?: boolean;
}

const USER_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

export const buildUserApiUrl = (endpoint: string): string => {
    const base = USER_API_BASE_URL.endsWith("/") ? USER_API_BASE_URL : `${USER_API_BASE_URL}/`;
    return new URL(endpoint.replace(/^\//, ""), base).toString();
};

export const fetchUserApiJson = async (
    endpoint: string,
    fetchOptions?: ServerFetchOptions,
    options?: FetchUserApiJsonOptions
): Promise<unknown> => {
    const response = await fetch(buildUserApiUrl(endpoint), {
        method: "GET",
        headers: {
            Accept: "application/json",
            ...((fetchOptions?.headers as Record<string, string> | undefined) ?? {}),
        },
        ...fetchOptions,
    });

    if (!response.ok) {
        if (options?.returnNullOnHttpError) {
            return null;
        }
        const error = new Error(`Failed to load ${endpoint}: ${response.status}`) as Error & {
            status?: number;
            endpoint?: string;
        };
        error.status = response.status;
        error.endpoint = endpoint;
        throw error;
    }

    return response.json().catch(() => null);
};
