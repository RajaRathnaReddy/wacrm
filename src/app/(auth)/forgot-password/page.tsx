"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, CheckCircle, ArrowLeft } from "lucide-react";
import { RasaLogo } from "@/components/brand/rasa-logo";

export default function ForgotPasswordPage() {
  const t = useTranslations("ForgotPasswordPage");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // The emailed link returns to /auth/callback, which exchanges it
    // for a recovery session and forwards to /reset-password (issue
    // #592). Supabase must allow this origin under Authentication →
    // URL Configuration → Redirect URLs, or it silently falls back to
    // its Site URL; see docs/auth-emails.md.
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }
    } catch {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,_rgba(123,45,139,0.18)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none blur-3xl" />
        <Card className="relative z-10 w-full max-w-md border border-white/10 bg-[#0b0914]/85 shadow-[0_0_60px_-10px_rgba(212,160,23,0.25)] backdrop-blur-2xl rounded-2xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff2a85] to-transparent opacity-90" />
          <CardHeader className="items-center text-center pt-8 pb-4">
            <div className="mb-4">
              <RasaLogo size="lg" subtitle="PRODUCTIONS" />
            </div>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-wider uppercase text-white" style={{ fontFamily: "var(--font-heading)" }}>
              {t("checkEmailTitle")}
            </CardTitle>
            <CardDescription className="text-sm text-gray-400 max-w-xs mt-1">
              {t.rich("checkEmailDesc", {
                email,
                strong: (chunks) => (
                  <span className="text-[#00f0ff] font-semibold">{chunks}</span>
                ),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full h-11 border-white/15 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl font-bold uppercase tracking-wider transition-all"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {t("backToSignIn")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 overflow-hidden">
      {/* Studio Radial Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,_rgba(123,45,139,0.18)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none blur-3xl" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[radial-gradient(circle,_rgba(0,240,255,0.12)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[radial-gradient(circle,_rgba(255,42,133,0.12)_0%,_rgba(0,0,0,0)_70%)] pointer-events-none blur-3xl" />

      {/* Luxury Studio Glass Card */}
      <Card className="relative z-10 w-full max-w-md border border-white/10 bg-[#0b0914]/85 shadow-[0_0_60px_-10px_rgba(212,160,23,0.25)] backdrop-blur-2xl rounded-2xl overflow-hidden">
        {/* Top neon shimmer line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff2a85] to-transparent opacity-90" />

        <CardHeader className="items-center text-center pt-8 pb-4">
          <div className="mb-4">
            <RasaLogo size="lg" subtitle="PRODUCTIONS" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-wider uppercase text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {t("title")}
          </CardTitle>
          <CardDescription className="text-sm text-gray-400 max-w-xs mt-1">
            {t("desc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8">
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-gray-400 font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {t("emailLabel")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-white/10 bg-[#130f21]/90 text-white placeholder:text-gray-500 focus-visible:border-[#d4a017] focus-visible:ring-[#d4a017]/25 rounded-xl h-11"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-3 h-11 w-full bg-gradient-to-r from-[#d4a017] via-[#f59e0b] to-[#d4a017] text-black font-bold uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(212,160,23,0.35)] hover:shadow-[0_0_35px_rgba(212,160,23,0.55)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {loading ? t("sending") : t("sendLink")}
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#00f0ff] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToSignIn")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
