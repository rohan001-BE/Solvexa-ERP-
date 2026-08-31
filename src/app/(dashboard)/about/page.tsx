"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Award,
  Store,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { getCMSContent } from "@/app/actions/cms";
import { CMSContent } from "@/lib/cms-constants";

export default function AboutPage() {
  const [heroContent, setHeroContent] = useState<CMSContent | null>(null);
  const [aboutContent, setAboutContent] = useState<CMSContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      try {
        const [hero, about] = await Promise.all([
          getCMSContent("hero"),
          getCMSContent("about")
        ]);
        setHeroContent(hero);
        setAboutContent(about);
      } catch (err) {
        console.error("Failed to load CMS content", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute permission="view_dashboard">
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden solvexa-banner-dark p-8 sm:p-12 text-white rounded-3xl shadow-lg border border-purple-900/50">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-300/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{heroContent?.subtitle || "Solxa Grocery Store Enterprise Architecture"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {heroContent?.title || "Premium Retail & Grocery Operations Engine"}
            </h1>
            <p className="text-sm text-purple-100 leading-relaxed font-normal whitespace-pre-wrap">
              {heroContent?.content_body || "Designed with royal purple and gold aesthetics, Solxa Grocery ERP is built for high-throughput inventory management, atomic double-entry ledger bookkeeping, supplier logistics, and customer credit billing."}
            </p>
          </div>

          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/10 backdrop-blur-md p-4 border border-amber-400/50 shadow-2xl flex items-center justify-center flex-shrink-0 group hover:scale-105 transition-transform">
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white p-2 flex items-center justify-center shadow-inner">
              <Image
                src="/logo.png"
                alt="Solxa Emblem"
                width={140}
                height={140}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Ambient Glow Elements */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Dynamic About Section */}
      <div className="solvexa-card p-8 bg-white border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          {aboutContent?.title || "About Solxa"}
        </h2>
        <h3 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-6">
          {aboutContent?.subtitle || "Quality You Can Trust"}
        </h3>
        <div className="text-sm text-slate-700 leading-loose whitespace-pre-wrap">
          {aboutContent?.content_body || "Solxa Grocery ERP is your one-stop solution for managing daily inventory, POS, and sales with ease and precision."}
        </div>
      </div>

      {/* Brand Identity & Color Philosophy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="solvexa-card p-6 space-y-3 border-purple-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Royal Purple Heritage</h3>
              <p className="text-xs text-purple-700 font-semibold">Excellence, Authority &amp; Reliability</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The deep purple emblem symbolizes reliability, structured back-office workflows, and uncompromising accounting accuracy across every sale, stock receipt, and payment.
          </p>
        </div>

        <div className="solvexa-card p-6 space-y-3 border-amber-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Golden Prosperity Accent</h3>
              <p className="text-xs text-amber-700 font-semibold">Growth, Value &amp; Profit Margins</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The rich golden hues reflect profitability, real-time financial transparency, automated gross margin tracking, and clean cash flow governance.
          </p>
        </div>
      </div>

      {/* Core ERP Principles */}
      <div className="solvexa-card p-8 space-y-6 bg-white border-slate-200">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-purple-700" />
            <span>Core Architectural Standards</span>
          </h3>
          <p className="text-xs text-slate-500">Implemented per the Solxa Grocery ERP Specifications</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-2 p-4 rounded-2xl bg-purple-50/40 border border-purple-100/60">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <CheckCircle2 className="w-4 h-4 text-purple-700" />
              <span>Strict Back-Office Scope</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              No live barcode-scanning POS or cart animations. Sales are customer invoices filled out by back-office staff.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-amber-50/40 border border-amber-100/60">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              <span>Atomic RPC Operations</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Purchases, sales, returns, and inventory adjustments run via PostgreSQL atomic transactions with zero balance drift.
            </p>
          </div>

          <div className="space-y-2 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/60">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Granular RBAC Security</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Row-Level Security (RLS) and dynamic UI permission guards isolate staff, manager, and administrative privileges.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-amber-50/60 border border-purple-100">
        <div>
          <h4 className="text-sm font-bold text-purple-950">Ready to manage store operations?</h4>
          <p className="text-xs text-slate-500">Jump directly into sales invoicing or real-time stock management.</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-purple-700/20 transition-all hover:scale-105"
        >
          <span>Open Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
        </Link>
      </div>
    </div>
    </ProtectedRoute>
  );
}
