"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@esparex/ui";

interface CatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

export function CatalogModal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: CatalogModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className={`w-full ${maxWidth} p-0 overflow-hidden rounded-2xl`}>
                <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
                    <DialogTitle className="text-body-lg font-bold text-foreground">{title}</DialogTitle>
                    <DialogDescription className="sr-only">{title}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
