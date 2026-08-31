"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { signout } from "@/app/actions/auth";
import { User, LogOut, LayoutDashboard, Info, Store } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-purple-100 transition-all shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform duration-150 active:scale-95"
        >
          <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-white border border-purple-200 shadow-sm flex items-center justify-center p-0.5 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Solvexa Logo"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-extrabold text-lg text-purple-950 tracking-tight flex items-center gap-1 group-hover:text-purple-700 transition-colors">
            <span>Solvexa</span>
            <span className="text-amber-600">Store</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-slate-700 hover:text-purple-800 transition-colors px-3 py-1.5 rounded-xl hover:bg-purple-50"
          >
            Home
          </Link>

          <Link
            href="/about"
            className="text-xs font-bold text-slate-700 hover:text-purple-800 transition-colors px-3 py-1.5 rounded-xl hover:bg-purple-50 flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5 text-purple-600" />
            <span>About Solvexa</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 px-3.5 py-2 rounded-xl shadow-sm shadow-purple-700/20 transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
                <span>Dashboard</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span className="truncate max-w-[120px]">{user.email}</span>
                </div>

                <form action={signout}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-700 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-700 hover:text-purple-800 px-3.5 py-2 rounded-xl hover:bg-purple-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-xs font-bold text-white bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 px-4 py-2 rounded-xl shadow-md shadow-purple-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
