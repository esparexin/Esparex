"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { normalizeAdminRedirectUrl } from "@/lib/normalizeAdminRedirect";
import {
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2
} from "lucide-react";

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

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && admin) {
      const nextPath = normalizeAdminRedirectUrl(params.get("next"));
      void router.replace(nextPath);
    }
  }, [admin, authLoading, router, params]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({
        email,
        password,
        twoFactorCode: twoFactorCode || undefined
      });
      // Redirection is handled by the useEffect above once state updates
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      setSubmitting(false);
    }
  };

  if (authLoading && !submitting) {
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-login-2fa" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">2FA OTP (Optional)</label>
              <input
                id="admin-login-2fa"
                name="twoFactorCode"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium tracking-[0.2em] text-center"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold animate-in shake duration-300">
                <AlertCircle size={14} />
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
