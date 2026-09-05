"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { normalizeAdminRedirectUrl } from "@/lib/normalizeAdminRedirect";
import { AdminApiError } from "@/lib/api/adminClient";
import {
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  KeyRound,
  Heading,
  Text,
  Form,
  FieldRoot,
  FieldControl,
  FieldLabel,
  FieldMessage,
  InputGroup,
  InputPrefix,
  InputSuffix,
  Input,
  FieldDescription,
} from "@esparex/ui";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AUTH_LOADING_TIMEOUT_MS = 4000;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, admin, loading: authLoading } = useAdminAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

  const twoFactorCodeValue = useWatch({
    control: form.control,
    name: "twoFactorCode",
  });

  useEffect(() => {
    if (!authLoading) return;
    const id = setTimeout(() => setAuthCheckTimedOut(true), AUTH_LOADING_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [authLoading]);

  useEffect(() => {
    if (!authLoading && admin) {
      const nextPath = normalizeAdminRedirectUrl(params.get("next"));
      void router.replace(nextPath);
    }
  }, [admin, authLoading, router, params]);

  useEffect(() => {
    if (requires2FA) {
      const id = setTimeout(() => {
        form.setFocus("twoFactorCode");
      }, 60);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [requires2FA, form]);

  // Strip non-digits from 2FA input
  useEffect(() => {
    if (twoFactorCodeValue) {
      const cleaned = twoFactorCodeValue.replace(/\D/g, "").slice(0, 6);
      if (cleaned !== twoFactorCodeValue) {
        form.setValue("twoFactorCode", cleaned);
      }
    }
  }, [twoFactorCodeValue, form]);

  const onSubmit = async (values: LoginFormValues) => {
    if (requires2FA && (!values.twoFactorCode || values.twoFactorCode.length < 6)) {
      form.setError("twoFactorCode", { message: "6-digit code is required." });
      return;
    }

    setSubmitting(true);
    setError("");
    const nextPath = normalizeAdminRedirectUrl(params.get("next"));

    try {
      await login({
        email: values.email,
        password: values.password,
        twoFactorCode: values.twoFactorCode || undefined,
      });
      void router.replace(nextPath);
    } catch (err) {
      if (err instanceof AdminApiError && err.status === 403) {
        const payload = err.payload;
        const errorObj =
          typeof payload.error === "object" && payload.error !== null
            ? (payload.error as { code?: unknown; details?: unknown })
            : undefined;
        const errorDetails =
          typeof errorObj?.details === "object" && errorObj.details !== null
            ? (errorObj.details as { requires2FA?: unknown })
            : undefined;
        const code =
          (typeof errorObj?.code === "string" ? errorObj.code : undefined) ??
          payload.code;
        const requires2FASignal =
          code === "ADMIN_2FA_REQUIRED" ||
          errorDetails?.requires2FA === true;

        if (requires2FASignal) {
          setRequires2FA(true);
          setError("Enter your 2FA code to complete sign-in.");
          return;
        }
      }

      const message =
        err instanceof AdminApiError
          ? AdminApiError.resolveMessage(err, "Login failed. Please try again.")
          : err instanceof Error
          ? err.message
          : "Login failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const showSpinner = authLoading && !submitting && !authCheckTimedOut;
  if (showSpinner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-t from-primary/10 via-primary/5 to-transparent blur-3xl rounded-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:28px_28px] text-foreground/[0.04]" />

      <div className="relative w-full max-w-[420px] space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-1 animate-in zoom-in duration-500">
            <Image
              src="/icons/logo.png"
              alt="Esparex Logo"
              width={160}
              height={40}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-tiny font-semibold uppercase tracking-[0.14em] text-foreground-secondary shadow-xs">
              <Shield size={12} className="text-primary" />
              <span>Admin Command Center</span>
            </div>
            <Heading variant="h2" className="mt-1 font-extrabold tracking-tight">Sign In</Heading>
            <Text variant="small" className="text-foreground-tertiary">Enter your credentials to access the admin portal</Text>
          </div>
        </div>

        <div className="bg-card/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl border border-border isolate animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldRoot<LoginFormValues, "email">
                name="email"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <FieldLabel className="text-caption font-semibold text-foreground-secondary ml-0.5">
                      Email Address
                    </FieldLabel>
                    <FieldControl animateOnError>
                      <InputGroup>
                        <InputPrefix>
                          <Mail size={18} className="text-foreground-subtle" />
                        </InputPrefix>
                        <Input
                          placeholder="admin@esparex.com"
                          type="email"
                          autoComplete="username"
                          className="pl-10 h-11 text-body-lg md:text-body bg-background/50 focus:bg-background transition-colors"
                          disabled={submitting}
                          {...field}
                        />
                      </InputGroup>
                    </FieldControl>
                    <FieldMessage className="ml-0.5 text-caption" />
                  </div>
                )}
              />

              <FieldRoot<LoginFormValues, "password">
                name="password"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <FieldLabel className="text-caption font-semibold text-foreground-secondary ml-0.5">
                      Password
                    </FieldLabel>
                    <FieldControl animateOnError>
                      <InputGroup>
                        <InputPrefix>
                          <Lock size={18} className="text-foreground-subtle" />
                        </InputPrefix>
                        <Input
                          placeholder="••••••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pl-10 pr-10 h-11 text-body-lg md:text-body bg-background/50 focus:bg-background transition-colors"
                          disabled={submitting}
                          {...field}
                        />
                        <InputSuffix>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="flex items-center justify-center h-full w-full rounded-sm text-foreground-subtle hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </InputSuffix>
                      </InputGroup>
                    </FieldControl>
                    <FieldMessage className="ml-0.5 text-caption" />
                  </div>
                )}
              />

              {requires2FA && (
                <FieldRoot<LoginFormValues, "twoFactorCode">
                  name="twoFactorCode"
                  render={({ field }) => (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <FieldLabel className="text-caption font-semibold text-foreground-secondary ml-0.5 flex items-center gap-1.5">
                        <KeyRound size={12} className="text-amber-600" />
                        Two-Factor Authentication Code
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <FieldControl animateOnError>
                        <InputGroup>
                          <Input
                            placeholder="6-digit code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            disabled={submitting}
                            className="h-11 text-center tracking-[0.25em] text-body-lg md:text-body bg-amber-50/70 border-amber-300 focus-visible:ring-amber-400 focus-visible:border-amber-400 font-mono font-semibold"
                            {...field}
                          />
                        </InputGroup>
                      </FieldControl>
                      <FieldDescription className="ml-0.5 text-tiny text-amber-800">
                        Open your authenticator app and enter the 6-digit code.
                      </FieldDescription>
                      <FieldMessage className="ml-0.5 text-caption" />
                    </div>
                  )}
                />
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200/80 text-red-700 rounded-xl text-caption font-semibold animate-in fade-in duration-200">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-body shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </Form>

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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
