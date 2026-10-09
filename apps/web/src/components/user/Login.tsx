"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { useOtpFlow } from "@/hooks/useOtpFlow";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@esparex/ui";

import { LoginForm } from "./auth/LoginForm";

interface LoginProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
  onRegisterBackAction?: (action: (() => void) | null) => void;
}

export function Login({
  onLoginSuccess,
  onBack,
  onRegisterBackAction,
}: LoginProps) {
  const flow = useOtpFlow(onLoginSuccess);
  const { step } = flow;

  return (
    <Card
      className="w-full max-w-sm mx-auto border-0 shadow-none sm:border-0 rounded-none bg-transparent flex-1 min-h-0 flex flex-col"
    >
      <CardHeader className="relative text-center p-0 mb-4 sm:mb-7 shrink-0 [[data-keyboard-open=true]_&]:mb-1.5">
        <div className="mx-auto mb-2 w-fit [[data-keyboard-open=true]_&]:hidden">
          <div className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/15 p-2">
            <Image
              src="/images/recycle-icon.png"
              alt="Esparex Recycle Logo"
              width={44}
              height={44}
              priority
              className="w-full h-full object-contain brightness-0 invert drop-shadow-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <CardTitle
            className={cn(
              "text-h3 font-semibold tracking-tight text-foreground",
              step === "enterMobile" && "flex items-center justify-center gap-1.5"
            )}
            aria-label={step === "enterMobile" ? "Welcome to Esparex" : "Verify OTP"}
          >
            {step === "enterMobile" ? (
              <>
                <span>Welcome to</span>
                <Image
                  src="/icons/logo.png"
                  alt="Esparex"
                  width={495}
                  height={112}
                  unoptimized
                  priority
                  className="h-5 w-auto inline-block object-contain"
                />
              </>
            ) : (
              "Verify OTP"
            )}
          </CardTitle>
          {step === "enterMobile" && (
            <p className="text-body text-muted-foreground font-normal leading-normal [[data-keyboard-open=true]_&]:hidden">
              Login to buy & sell mobile spares
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 w-full flex-1 min-h-0 flex flex-col">
        <LoginForm
          flow={flow}
          onBack={onBack}
          onRegisterBackAction={onRegisterBackAction}
        />
      </CardContent>
    </Card>
  );
}
