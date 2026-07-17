import { useState, useCallback } from "react";

export function usePostAdValidation() {
    const [loadError, setLoadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const clearErrors = useCallback(() => {
        setLoadError(null);
        setFormError(null);
    }, []);

    return {
        loadError,
        setLoadError,
        formError,
        setFormError,
        clearErrors,
    };
}
