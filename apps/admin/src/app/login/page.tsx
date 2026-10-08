"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { emailSchema } from "@esparex/contracts";

import { AdminAuthCard } from "@/components/auth/AdminAuthCard";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { normalizeAdminRedirectUrl } from "@/lib/normalizeAdminRedirect";
import { AdminApiError } from "@/lib/api/adminClient";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  KeyRound,
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
  email: emailSchema,
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
    <AdminAuthCard title="Sign In">
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
                          placeholder="Your admin email address"
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
                    <div className="flex items-center justify-between">
                      <FieldLabel className="text-caption font-semibold text-foreground-secondary ml-0.5">
                        Password
                      </FieldLabel>
                      <Link
                        href="/forgot-password"
                        className="text-caption font-medium text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                      >
                        Forgot password?
                      </Link>
                    </div>
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
                        <KeyRound size={12} className="text-warning" />
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
                            className="h-11 text-center tracking-[0.25em] text-body-lg md:text-body bg-warning/10 border-warning focus-visible:ring-warning focus-visible:border-warning font-mono font-semibold"
                            {...field}
                          />
                        </InputGroup>
                      </FieldControl>
                      <FieldDescription className="ml-0.5 text-tiny text-warning-dark">
                        Open your authenticator app and enter the 6-digit code.
                      </FieldDescription>
                      <FieldMessage className="ml-0.5 text-caption" />
                    </div>
                  )}
                />
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-caption font-semibold animate-in fade-in duration-200">
                  <AlertCircle size={15} className="shrink-0 text-destructive" />
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
    </AdminAuthCard>
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
