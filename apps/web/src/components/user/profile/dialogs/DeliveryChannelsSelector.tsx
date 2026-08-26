"use client";

import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/FormError";
import { cn } from "@/components/ui/utils";

type ChannelType = "push" | "email" | "sms" | "whatsapp" | "in-app";

interface DeliveryChannelsSelectorProps {
    value?: ChannelType[];
    onChange: (channels: ChannelType[]) => void;
    error?: string;
}

const DELIVERY_CHANNELS = [
    { id: "email", label: "Email", active: true },
    { id: "sms", label: "SMS", active: false, badge: "SOON" },
    { id: "whatsapp", label: "WhatsApp", active: false, badge: "SOON" },
];

export function DeliveryChannelsSelector({ value = [], onChange, error }: DeliveryChannelsSelectorProps) {
    return (
        <div>
            <Label className="text-caption font-semibold text-foreground mb-1.5 block">
                Additional Delivery Channels
            </Label>
            <div className="flex flex-wrap items-center gap-2">
                {DELIVERY_CHANNELS.map((ch) => {
                    const isSelected = (value || []).includes(ch.id as ChannelType);
                    return (
                        <button
                            key={ch.id}
                            type="button"
                            disabled={!ch.active}
                            onClick={() => {
                                if (!ch.active) return;
                                const next = isSelected
                                    ? value.filter((item) => item !== ch.id)
                                    : [...value, ch.id as ChannelType];
                                onChange(next);
                            }}
                            className={cn(
                                "flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-caption font-semibold transition-all border select-none cursor-pointer shadow-2xs",
                                !ch.active
                                    ? "bg-muted/30 text-muted-foreground/50 border-border/40 cursor-not-allowed"
                                    : isSelected
                                    ? "bg-primary/10 text-primary border-primary/40 font-bold"
                                    : "bg-card text-foreground-subtle border-border hover:bg-muted"
                            )}
                        >
                            <span>{ch.label}</span>
                            {ch.badge && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/80 text-foreground-subtle">
                                    {ch.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <FormError message={error} />
        </div>
    );
}
