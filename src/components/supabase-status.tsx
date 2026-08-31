"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, AlertCircle, RefreshCw, Key, Globe } from "lucide-react";

export function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "not_configured" | "error">(
    "checking"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkConnection = async () => {
    setStatus("checking");
    setErrorMessage(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes("your-project-id") ||
      supabaseAnonKey.includes("your-anon-key")
    ) {
      setStatus("not_configured");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.getSession();
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
      } else {
        setStatus("connected");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err?.message || "Failed to reach Supabase endpoint.");
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              status === "connected"
                ? "bg-emerald-400 shadow-lg shadow-emerald-500/50"
                : status === "not_configured"
                ? "bg-amber-400 shadow-lg shadow-amber-500/50"
                : status === "checking"
                ? "bg-indigo-400"
                : "bg-rose-500 shadow-lg shadow-rose-500/50"
            }`}
          />
          <h3 className="font-semibold text-white">Supabase Connection</h3>
        </div>

        <button
          onClick={checkConnection}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-md transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
          <span>Check</span>
        </button>
      </div>

      {status === "connected" && (
        <div className="flex items-start gap-3 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3.5 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-300">Live & Connected</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">
              Your Next.js app is communicating with your Supabase project properly.
            </p>
          </div>
        </div>
      )}

      {status === "not_configured" && (
        <div className="flex items-start gap-3 text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-xl p-3.5 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <p className="font-medium text-amber-200">Configuration Required</p>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Add your credentials to <code className="bg-amber-950 px-1.5 py-0.5 rounded text-amber-200 font-mono">.env.local</code>:
            </p>
            <div className="text-xs font-mono bg-slate-900/90 text-slate-300 p-2.5 rounded-lg border border-slate-800 space-y-1 mt-2">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl p-3.5 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-medium text-rose-200">Connection Error</p>
            <p className="text-xs text-rose-300/80 mt-0.5 font-mono">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
