import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solvexa Grocery ERP - Enterprise Management System",
  description:
    "Production-grade Grocery Store ERP with Next.js App Router, Supabase SSR Authentication & PostgreSQL Database",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased selection:bg-purple-700 selection:text-white bg-slate-50 text-slate-900 min-h-screen"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
