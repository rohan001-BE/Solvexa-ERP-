"use client";

import { useState } from "react";
import { login, signup } from "@/app/actions/auth";
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface AuthFormProps {
  initialMode?: "login" | "signup";
}

export function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);

    try {
      if (mode === "login") {
        const res = await login(formData);
        if (res?.error) {
          setError(res.error);
        }
      } else {
        const res = await signup(formData);
        if (res?.error) {
          setError(res.error);
        } else if (res?.message) {
          setSuccessMessage(res.message);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("NEXT_REDIRECT")) {
        return;
      }
      setError(err?.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="solvexa-card p-6 sm:p-8 shadow-2xl border-2 border-amber-400/40 bg-white/95 backdrop-blur-xl rounded-3xl space-y-6 text-slate-900">
        {/* Emblem & Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white p-1 border-2 border-amber-400 shadow-lg flex items-center justify-center group hover:scale-105 transition-transform">
            <Image src="/logo.jpeg" alt="Solvexa Logo" width={56} height={56} className="object-contain" priority />
          </div>
          <div>
            <h2 className="text-xl font-black text-purple-950 tracking-tight">
              {mode === "login" ? "Sign In to Solvexa ERP" : "Register Store Account"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {mode === "login"
                ? "Enter your store staff email and password to log in"
                : "Register administrative credentials for store management"}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-purple-900 text-amber-300 shadow-md"
                : "text-slate-600 hover:text-purple-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-purple-900 text-amber-300 shadow-md"
                : "text-slate-600 hover:text-purple-900"
            }`}
          >
            Register Staff Account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "signup" && (
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Asim Raza"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white text-slate-900 text-xs font-semibold rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
              Store Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                name="email"
                type="email"
                required
                placeholder="rohan@gmail.com"
                className="w-full bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white text-slate-900 text-xs font-mono font-bold rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-800 uppercase tracking-wider">
                Password *
              </label>
              {mode === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900"
                >
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-slate-50 border border-slate-300 focus:border-purple-600 focus:bg-white text-slate-900 text-xs font-mono font-bold rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-gradient-to-r from-purple-800 via-purple-900 to-purple-950 hover:from-purple-900 hover:to-black active:scale-[0.98] disabled:opacity-50 text-amber-300 font-extrabold py-3 rounded-xl shadow-lg shadow-purple-950/25 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs uppercase tracking-wider"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to ERP" : "Register Account"}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
          <span>Secured with Supabase RBAC &amp; PostgreSQL Authentication</span>
        </div>
      </div>
    </div>
  );
}
