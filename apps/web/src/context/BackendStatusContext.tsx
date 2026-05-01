"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_ROUTES } from "@/lib/api/routes";
import { resolveRuntimeApiBaseUrl } from "@/lib/api/runtimeApiBase";

type BackendStatus = {
    isBackendUp: boolean;
    checked: boolean;
    apiBaseUrl: string;
};

const BackendStatusContext = createContext<BackendStatus>({
    isBackendUp: true,
    checked: false,
    apiBaseUrl: "",
});

const HEALTH_CHECK_INTERVAL_MS = 2 * 60 * 1000; // re-check every 2 minutes

export function BackendStatusProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isBackendUp, setIsBackendUp] = useState(true);
    const [checked, setChecked] = useState(false);
    const [apiBaseUrl, setApiBaseUrl] = useState("");

    useEffect(() => {
        const apiBase = resolveRuntimeApiBaseUrl();
        setApiBaseUrl(apiBase);

        const check = () => {
            fetch(`${apiBase}/${API_ROUTES.USER.HEALTH}`, { method: "GET" })
                .then(() => setIsBackendUp(true))
                .catch(() => setIsBackendUp(false))
                .finally(() => setChecked(true));
        };

        check();
        const interval = setInterval(check, HEALTH_CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    const value = useMemo(
        () => ({ isBackendUp, checked, apiBaseUrl }),
        [apiBaseUrl, checked, isBackendUp]
    );

    return (
        <BackendStatusContext.Provider value={value}>
            {children}
        </BackendStatusContext.Provider>
    );
}

export function useBackendStatus() {
    return useContext(BackendStatusContext);
}
