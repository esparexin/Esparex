import { useState, useCallback } from "react";

export function usePostAdValidation() {
    const [loadError, setLoadError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const clearErrors = useCallback(() => {
        setLoadError(null);
        setFormError(null);
    }, []);

    const setErrorMessage = useCallback((message: string | null) => {
        setFormError(message);
    }, []);

    const setLoadErrorMessage = useCallback((message: string | null) => {
        setLoadError(message);
    }, []);

    return {
        loadError,
        setLoadError: setLoadErrorMessage,
        formError,
        setFormError: setErrorMessage,
        clearErrors,
    };
}
