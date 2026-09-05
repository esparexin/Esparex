"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X, Shield, Sparkles, RotateCcw } from "@esparex/ui";
import { CANONICAL_PERMISSION_GROUPS, PERMISSION_PRESETS } from "./permissionGroups";

interface AdminPermissionScopeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export function AdminPermissionScopeSelector({
    value,
    onChange,
    error,
}: AdminPermissionScopeSelectorProps) {
    const [customScope, setCustomScope] = useState("");

    const selectedScopes = useMemo(() => {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }, [value]);

    const selectedSet = useMemo(() => new Set(selectedScopes), [selectedScopes]);

    const toggleScope = (scope: string) => {
        const updated = selectedSet.has(scope)
            ? selectedScopes.filter((s) => s !== scope)
            : Array.from(new Set([...selectedScopes, scope]));
        onChange(updated.join(", "));
    };

    const addCustomScope = () => {
        const trimmed = customScope.trim().toLowerCase();
        if (!trimmed || selectedSet.has(trimmed)) {
            setCustomScope("");
            return;
        }
        onChange(Array.from(new Set([...selectedScopes, trimmed])).join(", "));
        setCustomScope("");
    };

    const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addCustomScope();
        }
    };

    const removeScope = (scopeToRemove: string) => {
        onChange(selectedScopes.filter((s) => s !== scopeToRemove).join(", "));
    };

    return (
        <div className="space-y-4 rounded-xl border border-border/80 bg-surface/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    <span className="text-body font-semibold text-foreground">Permission Scopes</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-tiny font-bold text-primary">
                        {selectedScopes.length} selected
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-caption text-foreground-subtle mr-1">Presets:</span>
                    <button
                        type="button"
                        onClick={() => onChange(PERMISSION_PRESETS.moderator.join(", "))}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-tiny font-medium text-foreground-secondary hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                    >
                        <Sparkles size={11} className="text-amber-500" /> Moderator
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(PERMISSION_PRESETS.admin.join(", "))}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-tiny font-medium text-foreground-secondary hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                    >
                        <Sparkles size={11} className="text-blue-500" /> Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange(PERMISSION_PRESETS.super.join(", "))}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-tiny font-medium text-foreground-secondary hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                    >
                        <Sparkles size={11} className="text-purple-500" /> Super (all)
                    </button>
                    {selectedScopes.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="inline-flex items-center gap-1 rounded-md border border-destructive/20 bg-destructive/10 px-2 py-1 text-tiny font-medium text-destructive hover:bg-destructive/20 transition-all cursor-pointer ml-1"
                        >
                            <RotateCcw size={11} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {selectedScopes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-card border border-border/80 min-h-[38px] items-center">
                    {selectedScopes.map((scope) => (
                        <span
                            key={scope}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/25 px-2 py-0.5 text-caption font-mono font-medium text-primary shadow-2xs"
                        >
                            {scope}
                            <button
                                type="button"
                                onClick={() => removeScope(scope)}
                                className="rounded-full hover:bg-primary/20 p-0.5 text-primary/80 hover:text-primary transition-colors cursor-pointer"
                                aria-label={`Remove ${scope} permission`}
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-caption text-foreground-subtle italic">
                    No permissions selected. Choose from the groups below or add a custom scope.
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CANONICAL_PERMISSION_GROUPS.map((group) => (
                    <div key={group.name} className="rounded-lg border border-border/60 bg-card/80 p-3 space-y-2">
                        <div>
                            <p className="text-caption font-bold text-foreground">{group.name}</p>
                            <p className="text-tiny text-foreground-subtle">{group.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {group.scopes.map((scope) => {
                                const isSelected = selectedSet.has(scope.key);
                                return (
                                    <button
                                        key={scope.key}
                                        type="button"
                                        onClick={() => toggleScope(scope.key)}
                                        aria-pressed={isSelected}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-tiny font-medium transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-primary text-primary-foreground shadow-xs font-semibold ring-1 ring-primary/50"
                                                : "bg-muted/70 text-foreground-secondary hover:bg-muted hover:text-foreground border border-border/50"
                                        }`}
                                    >
                                        {isSelected ? <Check size={11} /> : <Plus size={11} />}
                                        {scope.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                <input
                    type="text"
                    value={customScope}
                    onChange={(e) => setCustomScope(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="Add custom scope (e.g. reports:export) and press Enter"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                <button
                    type="button"
                    onClick={addCustomScope}
                    disabled={!customScope.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-caption font-semibold text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-all cursor-pointer"
                >
                    <Plus size={13} /> Add Scope
                </button>
            </div>

            {error && <p className="text-caption text-destructive">{error}</p>}
        </div>
    );
}
