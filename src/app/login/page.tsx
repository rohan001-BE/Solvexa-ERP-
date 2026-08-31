import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
import { ShieldCheck, Sparkles, Lock, ShieldAlert, KeyRound, Cpu, Layers } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950 flex flex-col justify-between p-4 sm:p-8 text-white select-none">
      {/* Animated Floating Background Lights */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-solvexa-glow" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none animate-solvexa-glow" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none animate-solvexa-glow" />

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-amber-400/40 shadow-lg flex items-center justify-center">
            <Image src="/solxa-no-bg.png?v=2" alt="Solxa Logo" width={34} height={34} className="object-contain" priority />
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white flex items-center gap-1">
              <span>Solxa</span>
              <span className="text-amber-400 font-black">Grocery</span>
            </span>
            <span className="text-[10px] text-purple-200 font-mono block">Store ERP Enterprise v2.0</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>RBAC Multi-Ledger Enabled</span>
        </div>
      </header>

      {/* Main Login Portal Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full py-6 flex flex-col lg:flex-row items-center justify-between gap-12 my-auto">
        {/* Left Side: Enterprise Branding & Animated Cards */}
        <div className="space-y-6 max-w-lg text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-400/30 text-xs font-bold backdrop-blur-md shadow-md">
            <Cpu className="w-4 h-4 text-amber-300" />
            <span>Operational Back-Office Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Solxa Retail &amp; Grocery <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-md">
              Operations Engine
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-purple-100 font-normal leading-relaxed">
            Unified back-office portal for supermarket inventory management, supplier purchasing, POS customer invoicing, and atomic profit &amp; loss accounting.
          </p>

          {/* Role Access Matrix Badges */}
          <div className="pt-2 space-y-2 text-left">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-300 block">
              Configured Role Access Levels:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-purple-900/80 border border-purple-400/40 text-purple-100 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> Super Admin
              </span>
              <span className="px-3 py-1 rounded-xl bg-purple-900/80 border border-purple-400/40 text-purple-100 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Store Manager
              </span>
              <span className="px-3 py-1 rounded-xl bg-purple-900/80 border border-purple-400/40 text-purple-100 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-purple-300" /> Financial Accountant
              </span>
              <span className="px-3 py-1 rounded-xl bg-purple-900/80 border border-purple-400/40 text-purple-100 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <KeyRound className="w-3.5 h-3.5 text-rose-300" /> Sales &amp; Inventory Staff
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Animated Auth Glass Form */}
        <div className="w-full max-w-md animate-solvexa-float">
          <AuthForm initialMode="login" />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full pt-4 border-t border-purple-900/40 flex flex-col sm:flex-row items-center justify-between text-xs text-purple-300 gap-2">
        <div className="flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>PostgreSQL DB Engine: 100% Operational</span>
        </div>
        <p>© {new Date().getFullYear()} Solxa Grocery Store ERP. All rights reserved.</p>
      </footer>
    </div>
  );
}
