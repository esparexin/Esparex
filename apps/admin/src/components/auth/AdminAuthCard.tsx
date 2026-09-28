"use client";

import React from "react";
import Image from "next/image";
import { Heading, Lock } from "@esparex/ui";

interface AdminAuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AdminAuthCard({ title, subtitle, children }: AdminAuthCardProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-t from-primary/10 via-primary/5 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:28px_28px] text-foreground/[0.04]" />

      <div className="relative w-full max-w-[420px] space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2 animate-in zoom-in duration-500">
            <Image
              src="/icons/logo.png"
              alt="Esparex Logo"
              width={160}
              height={40}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>
          <Heading variant="h2" className="font-extrabold tracking-tight">
            {title}
          </Heading>
          {subtitle && (
            <p className="text-body-sm text-foreground-secondary">
              {subtitle}
            </p>
          )}
        </div>

        <div className="bg-card/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl border border-border isolate animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-center gap-1.5 text-tiny text-foreground-subtle">
            <Lock size={12} className="text-primary/70" />
            <span>256-bit Encrypted Admin Session</span>
          </div>
        </div>

        <p className="text-center text-foreground-subtle text-caption font-medium">
          &copy; {new Date().getFullYear()} Esparex Master Admin. All rights reserved.
        </p>
      </div>
    </div>
  );
}
