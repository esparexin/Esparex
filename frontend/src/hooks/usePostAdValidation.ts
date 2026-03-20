import { useState, useCallback } from "react";

export function usePostAdValidation() {
    const [error, setError] = useState<Error | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const clearErrors = useCallback(() => {
        setError(null);
        setFormError(null);
    }, []);

    const setErrorMessage = useCallback((message: string | null) => {
        setFormError(message);
    }, []);

    return {
        error,
        setError,
        formError,
        setFormError: setErrorMessage,
        clearErrors,
    };
}
