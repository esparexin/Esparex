"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { emailSchema } from "@esparex/contracts";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Heading,
  Form,
  FieldRoot,
  FieldControl,
  FieldLabel,
  FieldMessage,
  InputGroup,
  InputPrefix,
  Input,
} from "@esparex/ui";

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      await adminFetch(ADMIN_ROUTES.FORGOT_PASSWORD, {
        method: "POST",
        body: { email: values.email },
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while requesting password reset. Please try again.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

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
            {isSuccess ? "Check Your Email" : "Forgot Password"}
          </Heading>
          <p className="text-body-sm text-foreground-secondary">
            {isSuccess
              ? "If your email is registered in our system, you will receive a password reset link shortly."
              : "Enter your registered email address and we will send you a link to reset your password."}
          </p>
        </div>

        <div className="bg-card/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl border border-border isolate animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 animate-in zoom-in-75 duration-300">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-body-sm text-foreground-secondary">
                  The link will expire in <span className="font-semibold text-foreground">10 minutes</span>. Please check your inbox and spam folder.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-body shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FieldRoot<ForgotPasswordValues, "email">
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
                            autoComplete="email"
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

                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200/80 text-red-700 rounded-xl text-caption font-semibold animate-in fade-in duration-200">
                    <AlertCircle size={15} className="shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
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
                    <span>Send Reset Link</span>
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
