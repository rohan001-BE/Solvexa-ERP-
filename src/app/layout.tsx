import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solxa Grocery Store ERP - Enterprise Management System",
  description:
    "Production-grade Solxa Grocery Store ERP with Next.js App Router, Supabase SSR Authentication & PostgreSQL Database",
  icons: {
    icon: "/solxa-no-bg.png",
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
