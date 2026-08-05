"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
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

  const twoFactorCodeValue = form.watch("twoFactorCode");

  // Keep the focus logic for 2FA using a callback ref or manual DOM focus since RHF doesn't auto-focus dynamically revealed fields easily
  const focus2FARef = useRef<HTMLInputElement>(null);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white p-4">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-xl shadow-primary/20 mb-4 animate-in zoom-in duration-500">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Esparex Admin</h1>
          <p className="text-foreground-tertiary text-sm">Secure access to the command center</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white isolate animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FieldRoot<LoginFormValues, "email">
                name="email"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider ml-1">
                      Email Address
                    </FieldLabel>
                    <FieldControl animateOnError>
                      <InputGroup>
                        <InputPrefix>
                          <Mail size={18} />
                        </InputPrefix>
                        <Input
                          placeholder="admin@esparex.com"
                          type="email"
                          autoComplete="username"
                          className="pl-10"
                          disabled={submitting}
                          {...field}
                        />
                      </InputGroup>
                    </FieldControl>
                    <FieldMessage className="ml-1 text-xs" />
                  </div>
                )}
              />

              <FieldRoot<LoginFormValues, "password">
                name="password"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <FieldLabel className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider ml-1">
                      Password
                    </FieldLabel>
                    <FieldControl animateOnError>
                      <InputGroup>
                        <InputPrefix>
                          <Lock size={18} />
                        </InputPrefix>
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          className="pl-10 pr-10"
                          disabled={submitting}
                          {...field}
                        />
                        <InputSuffix>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="flex items-center justify-center h-full w-full rounded-sm hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </InputSuffix>
                      </InputGroup>
                    </FieldControl>
                    <FieldMessage className="ml-1 text-xs" />
                  </div>
                )}
              />

              {requires2FA && (
                <FieldRoot<LoginFormValues, "twoFactorCode">
                  name="twoFactorCode"
                  render={({ field }) => (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <FieldLabel className="text-xs font-bold text-foreground-tertiary uppercase tracking-wider ml-1 flex items-center gap-1.5">
                        <KeyRound size={12} />
                        Two-Factor Authentication Code
                        <span className="text-destructive">*</span>
                      </FieldLabel>
                      <FieldControl animateOnError>
                        <InputGroup>
                          <Input
                            placeholder="000000"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            disabled={submitting}
                            className="text-center tracking-[0.2em] bg-amber-50 border-amber-300 focus-visible:ring-amber-400 focus-visible:border-amber-400"
                            {...field}
                          />
                        </InputGroup>
                      </FieldControl>
                      <FieldDescription className="ml-1 text-xs text-amber-700">
                        Open your authenticator app and enter the 6-digit code.
                      </FieldDescription>
                      <FieldMessage className="ml-1 text-xs" />
                    </div>
                  )}
                />
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 group"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </Form>
        </div>

        <p className="text-center text-foreground-subtle text-xs font-medium">
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
