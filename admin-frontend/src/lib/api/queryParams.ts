export type QueryParamValue = string | number | boolean | null | undefined;

export const buildQueryString = (
    filters?: Record<string, QueryParamValue>,
    options?: {
        skipEmptyString?: boolean;
    }
) => {
    const params = new URLSearchParams();

    Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        if (typeof value === "string") {
            if (options?.skipEmptyString !== false && value.length === 0) {
                return;
            }
            params.set(key, value);
            return;
        }

        if (typeof value === "boolean") {
            params.set(key, value ? "true" : "false");
            return;
        }

        params.set(key, String(value));
    });

    return params.toString();
};
