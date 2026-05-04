"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { formatAppDate, formatShortRelativeTime } from "@/lib/formatters";

interface RelativeTimeTextProps {
    value: string | Date;
    variant?: "long" | "short";
    fallback?: string;
    updateIntervalMs?: number;
}

export function RelativeTimeText({
    value,
    variant = "long",
    fallback,
    updateIntervalMs = 60000,
}: RelativeTimeTextProps) {
    const parsedValue = useMemo(
        () => (typeof value === "string" ? new Date(value) : value),
        [value]
    );
    const fallbackLabel = useMemo(
        () => fallback ?? formatAppDate(parsedValue),
        [fallback, parsedValue]
    );
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const intervalId = window.setInterval(() => setTick(t => t + 1), updateIntervalMs);
        return () => window.clearInterval(intervalId);
    }, [updateIntervalMs]);

    const label = useMemo(() => {
        if (Number.isNaN(parsedValue.getTime())) return fallbackLabel;
        return variant === "short"
            ? formatShortRelativeTime(parsedValue)
            : formatDistanceToNow(parsedValue, { addSuffix: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fallbackLabel, parsedValue, tick, variant]);

    return <>{label}</>;
}
