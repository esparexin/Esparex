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
    const [label, setLabel] = useState(fallbackLabel);

    useEffect(() => {
        if (Number.isNaN(parsedValue.getTime())) {
            setLabel(fallbackLabel);
            return;
        }

        const updateLabel = () => {
            setLabel(
                variant === "short"
                    ? formatShortRelativeTime(parsedValue)
                    : formatDistanceToNow(parsedValue, { addSuffix: true })
            );
        };

        updateLabel();
        const intervalId = window.setInterval(updateLabel, updateIntervalMs);
        return () => window.clearInterval(intervalId);
    }, [fallbackLabel, parsedValue, updateIntervalMs, variant]);

    return <>{label}</>;
}
