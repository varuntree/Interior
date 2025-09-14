/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { createClient } from "@/libs/supabase/client";
import config from "@/config";
import { Logo } from "@/components/shared/Logo";

export default function Signin() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const logos = useMemo(() => [
    {
      id: "logo-1",
      description: "Astro",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/astro-wordmark.svg",
      className: "h-6 w-auto",
    },
    {
      id: "logo-2",
      description: "Brand 1",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/company/fictional-company-logo-1.svg",
      className: "h-6 w-auto",
    },
    {
      id: "logo-3",
      description: "Brand 2",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/company/fictional-company-logo-2.svg",
      className: "h-6 w-auto",
    },
    {
      id: "logo-4",
      description: "Brand 3",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/company/fictional-company-logo-3.svg",
      className: "h-6 w-auto",
    },
    {
      id: "logo-5",
      description: "Brand 4",
      image:
        "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/company/fictional-company-logo-4.svg",
      className: "h-6 w-auto",
    },
  ], []);

  async function handleGoogleSignin() {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      // Preserve checkout intent if present
      const sp = new URLSearchParams(window.location.search);
      const qp = new URLSearchParams();
      const priceId = sp.get('priceId');
      const checkoutMode = sp.get('mode');
      const successUrl = sp.get('successUrl');
      const cancelUrl = sp.get('cancelUrl');
      if (priceId) qp.set('priceId', priceId);
      if (checkoutMode) qp.set('mode', checkoutMode);
      if (successUrl) qp.set('successUrl', successUrl);
      if (cancelUrl) qp.set('cancelUrl', cancelUrl);
      const query = qp.toString();
      const redirectURL = baseUrl + "/api/auth/callback" + (query ? `?${query}` : "");
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectURL,
          queryParams: { prompt: "select_account" },
        },
      });
      // The browser will be redirected by Supabase; no further action needed.
    } catch (err) {
      // Fail silently but reset state; UI remains simple by design.
      console.error(err);
      setLoading(false);
    }
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function setServerSession(access_token: string, refresh_token: string) {
    try {
      const res = await fetch("/api/auth/set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token, refresh_token }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to persist session");
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  function getCheckoutParams(): null | {
    priceId: string;
    mode: 'payment' | 'subscription';
    successUrl: string;
    cancelUrl: string;
  } {
    try {
      const sp = new URLSearchParams(window.location.search);
      const priceId = sp.get('priceId');
      const mode = (sp.get('mode') as 'payment' | 'subscription') || 'subscription';
      const successUrl = sp.get('successUrl');
      const cancelUrl = sp.get('cancelUrl');
      if (priceId && successUrl && cancelUrl) {
        return { priceId, mode, successUrl, cancelUrl };
      }
      return null;
    } catch {
      return null;
    }
  }

  function redirectToCallbackOrDashboard() {
    const params = getCheckoutParams();
    if (params) {
      const sp = new URLSearchParams(params as any);
      window.location.href = `/api/auth/callback?${sp.toString()}`;
      return;
    }
    window.location.href = '/dashboard';
  }

  async function handleEmailSignin(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const emailTrimmed = email.trim().toLowerCase();
    if (!isValidEmail(emailTrimmed)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailTrimmed, password });
      if (error) throw error;
      const at = data.session?.access_token;
      const rt = data.session?.refresh_token;
      if (!at || !rt) throw new Error("Missing session tokens after sign-in.");
      await setServerSession(at, rt);
      redirectToCallbackOrDashboard();
    } catch (err: any) {
      console.error(err);
      setFormError("Invalid email or password.");
      setLoading(false);
    }
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const emailTrimmed = email.trim().toLowerCase();
    if (!isValidEmail(emailTrimmed)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email: emailTrimmed, password });
      if (error) throw error;
      if (data.session?.access_token && data.session.refresh_token) {
        await setServerSession(data.session.access_token, data.session.refresh_token);
        redirectToCallbackOrDashboard();
        return;
      }
      // If email confirmations are enabled in Supabase, session may be null.
      // Show a helpful message instead of proceeding silently.
      setFormError(
        "Account created, but email confirmation is required by server settings. Please confirm your email or ask admin to disable confirmations."
      );
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      const msg = String(err?.message || "Could not create account.");
      if (msg.toLowerCase().includes("already registered")) {
        setFormError("An account already exists for this email. Try signing in.");
      } else {
        setFormError("Could not create account. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <section className="bg-background min-h-[100svh] grid place-items-center">
      <div className="w-full px-4">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-3">
            <Logo size="lg" showWordmark={false} />
            <span className="text-2xl md:text-3xl font-semibold tracking-tight">{config.appName}</span>
          </div>

          <h1 className="text-foreground mb-2 w-full text-center text-3xl font-medium tracking-tighter md:text-4xl">
            {mode === "signin" ? "Welcome back" : "Create your free account"}
          </h1>

          <Button
            variant="outline"
            className="border-muted-foreground/30 flex h-14 w-full max-w-lg items-center justify-center gap-8 rounded-full"
            onClick={handleGoogleSignin}
            disabled={loading}
          >
            {!loading && (
              <img
                className="h-5 w-5"
                alt="Google logo"
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/google-icon.svg"
              />
            )}
            <span className="font-medium">
              {loading ? "Redirecting…" : "Continue with Google"}
            </span>
          </Button>

          {/* Divider */}
          <div className="flex w-full max-w-lg items-center gap-6">
            <Separator className="flex-1" />
            <span className="font-medium tracking-tight">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email + Password form */}
          <form
            className="w-full max-w-lg flex flex-col gap-4"
            onSubmit={mode === "signin" ? handleEmailSignin : handleEmailSignup}
            noValidate
          >
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              className="bg-white dark:bg-card text-foreground h-14 rounded-full px-5 py-4 font-medium"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={!!formError}
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="bg-white dark:bg-card text-foreground h-14 rounded-full px-5 py-4 font-medium pr-12"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-invalid={!!formError}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
              </button>
            </div>
            {mode === "create" && (
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="bg-white dark:bg-card text-foreground h-14 rounded-full px-5 py-4 font-medium pr-12"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  aria-invalid={!!formError}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  aria-pressed={showConfirm}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span className="sr-only">{showConfirm ? "Hide password" : "Show password"}</span>
                </button>
              </div>
            )}

            {formError && (
              <div className="text-destructive text-sm" role="alert">
                {formError}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-foreground text-background hover:bg-foreground/90 h-14 w-full max-w-lg rounded-full"
            >
              <span className="font-medium tracking-tight">
                {loading ? (mode === "signin" ? "Signing in…" : "Creating…") : (mode === "signin" ? "Sign in" : "Create account")}
              </span>
            </Button>
          </form>

          <p className="text-foreground w-full text-center text-sm tracking-tight">
            {mode === "signin" ? (
              <>
                Don’t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode("create"); setFormError(null); setConfirmPassword(""); }}
                  className="underline text-foreground"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setFormError(null); setConfirmPassword(""); }}
                  className="underline text-foreground"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <div className="relative mx-auto flex items-center justify-center opacity-20">
            <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 2500 })]}>
              <CarouselContent className="ml-0">
                {logos.map((logo) => (
                  <CarouselItem
                    key={logo.id}
                    className="flex basis-1/3 justify-center sm:basis-1/4 md:basis-1/5 lg:basis-1/4"
                  >
                    <div className="flex shrink-0 items-center justify-center lg:mx-10">
                      <div>
                        <img src={logo.image} alt={logo.description} className={logo.className} />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <div className="bg-gradient-to-r from-background absolute inset-y-0 left-0 w-12 to-transparent"></div>
            <div className="bg-gradient-to-l from-background absolute inset-y-0 right-0 w-12 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
