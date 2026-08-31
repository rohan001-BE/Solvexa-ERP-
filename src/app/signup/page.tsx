import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
import { Navbar } from "@/components/navbar";

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-purple-950/5 border border-purple-200/80 shadow-lg flex items-center justify-center p-1.5 group hover:scale-105 transition-transform">
            <Image
              src="/solxa-no-bg.png"
              alt="Solxa Logo"
              width={60}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-purple-950 tracking-tight">
            Register Store Profile
          </h1>
          <span className="text-xs text-slate-500 font-medium">
            Setup administrative access for Solxa Grocery Store
          </span>
        </div>

        <AuthForm initialMode="signup" />
      </main>
    </div>
  );
}
