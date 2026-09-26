"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { AdminAuthCard } from "@/components/auth/AdminAuthCard";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setErrorMessage("Reset token is missing or invalid. Please request a new link.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await adminFetch(ADMIN_ROUTES.RESET_PASSWORD(token), {
        method: "POST",
        body: { password: values.password },
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to reset password. The link may have expired.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminAuthCard
      title={isSuccess ? "Password Reset Complete" : "Set New Password"}
      subtitle={
        isSuccess
          ? "Your password has been securely updated. You can now sign in with your new credentials."
          : "Choose a strong new password for your admin account."
      }
    >
      {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-300">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-body-sm text-foreground-secondary">
                  Your password has been changed. Any active admin sessions have been revoked for your security.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-body shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Sign In Now</span>
                </button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FieldRoot<ResetPasswordValues, "password">
                  name="password"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <FieldLabel className="text-caption font-semibold text-foreground-secondary ml-0.5">
                        New Password
                      </FieldLabel>
                      <FieldControl animateOnError>
                        <InputGroup>
                          <InputPrefix>
                            <Lock size={18} className="text-foreground-subtle" />
                          </InputPrefix>
                          <Input
                            placeholder="••••••••••••"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
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
                      <FieldDescription className="ml-0.5 text-tiny text-foreground-subtle">
                        Min 8 chars with uppercase, lowercase, and a number.
                      </FieldDescription>
                      <FieldMessage className="ml-0.5 text-caption" />
                    </div>
                  )}
                />

                <FieldRoot<ResetPasswordValues, "confirmPassword">
                  name="confirmPassword"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <FieldLabel className="text-caption font-semibold text-foreground-secondary ml-0.5">
                        Confirm New Password
                      </FieldLabel>
                      <FieldControl animateOnError>
                        <InputGroup>
                          <InputPrefix>
                            <Lock size={18} className="text-foreground-subtle" />
                          </InputPrefix>
                          <Input
                            placeholder="••••••••••••"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className="pl-10 pr-10 h-11 text-body-lg md:text-body bg-background/50 focus:bg-background transition-colors"
                            disabled={submitting}
                            {...field}
                          />
                          <InputSuffix>
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="flex items-center justify-center h-full w-full rounded-sm text-foreground-subtle hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </InputSuffix>
                        </InputGroup>
                      </FieldControl>
                      <FieldMessage className="ml-0.5 text-caption" />
                    </div>
                  )}
                />

                {errorMessage && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200/80 text-red-700 rounded-xl text-caption font-semibold animate-in fade-in duration-200">
                      <AlertCircle size={15} className="shrink-0 text-red-600" />
                      <span>{errorMessage}</span>
                    </div>
                    <div className="text-center">
                      <Link
                        href="/forgot-password"
                        className="text-caption font-medium text-primary hover:underline"
                      >
                        Request a new reset link
                      </Link>
                    </div>
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
                    <span>Update Password</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-caption font-medium text-foreground-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <ArrowLeft size={14} />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            </Form>
          )}
    </AdminAuthCard>
  );
}
