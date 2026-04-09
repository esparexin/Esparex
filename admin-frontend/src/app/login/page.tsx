"use client";

import { Suspense, useEffect, useRef, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

// How long to wait for the auth check before showing the form anyway
const AUTH_LOADING_TIMEOUT_MS = 4000;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, admin, loading: authLoading } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Show 2FA field only after backend signals it is required
  const [requires2FA, setRequires2FA] = useState(false);
  // Allow the form to render even if authLoading takes too long
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false);

  const twoFactorInputRef = useRef<HTMLInputElement>(null);

  // Timeout: if auth check takes > 4s, stop blocking the form
  useEffect(() => {
    if (!authLoading) return;
    const id = setTimeout(() => setAuthCheckTimedOut(true), AUTH_LOADING_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [authLoading]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && admin) {
      const nextPath = normalizeAdminRedirectUrl(params.get("next"));
      void router.replace(nextPath);
    }
  }, [admin, authLoading, router, params]);

  // Auto-focus 2FA input when it becomes visible
  useEffect(() => {
    if (requires2FA) {
      const id = setTimeout(() => twoFactorInputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [requires2FA]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const nextPath = normalizeAdminRedirectUrl(params.get("next"));

    try {
      await login({
        email,
        password,
        twoFactorCode: twoFactorCode || undefined,
      });
      void router.replace(nextPath);
    } catch (err) {
      // Detect the 2FA required signal from the backend
      if (err instanceof AdminApiError && err.status === 403) {
        const payload = err.payload as Record<string, unknown>;
        const errorObj = payload.error as Record<string, unknown> | string | undefined;
        const code =
          (typeof errorObj === "object" && errorObj !== null ? errorObj.code : undefined) ??
          payload.code;
        const requires2FASignal =
          code === "ADMIN_2FA_REQUIRED" ||
          (typeof errorObj === "object" && errorObj !== null &&
            (errorObj.details as Record<string, unknown>)?.requires2FA === true);

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
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-xl shadow-primary/20 mb-4 animate-in zoom-in duration-500">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Esparex Admin</h1>
          <p className="text-slate-500 text-sm">Secure access to the command center</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-white isolate animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="admin-login-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  id="admin-login-email"
                  name="email"
                  required
                  type="email"
                  placeholder="admin@esparex.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-login-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  id="admin-login-password"
                  name="password"
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 2FA field — only revealed after backend signals it is required */}
            {requires2FA && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label htmlFor="admin-login-2fa" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <KeyRound size={12} />
                  Two-Factor Authentication Code
                  <span className="text-red-500">*</span>
                </label>
                <input
                  ref={twoFactorInputRef}
                  id="admin-login-2fa"
                  name="twoFactorCode"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  required={requires2FA}
                  className="w-full px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all font-medium tracking-[0.2em] text-center"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  disabled={submitting}
                />
                <p className="text-xs text-amber-700 ml-1">Open your authenticator app and enter the 6-digit code.</p>
              </div>
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
        </div>

        <p className="text-center text-slate-400 text-xs font-medium">
          &copy; {new Date().getFullYear()} Esparex Master Admin. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
