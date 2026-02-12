import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import Providers from "@/app/providers";
import { initializePerformanceFixes } from "@/lib/performance-fix";
import PerformanceFix from "@/components/PerformanceFix";
import RazorpayLoader from "@/components/RazorpayLoader";
import ClientOnly from "@/components/ClientOnly";
import * as React from "react";
// ✅ IMPORT ADDED
import GlobalAuthListener from '@/components/auth/GlobalAuthListener';
import AppShell from '@/components/app/AppShell'; // ✅ NEW IMPORT

// Initialize performance fixes on client side
if (typeof window !== 'undefined') {
  initializePerformanceFixes();
}


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saanify - Smart Society Management",
  description: "Modern financial management for cooperative societies.",
  keywords: ["Society Management", "Community Living", "Member Management", "Maintenance Tracking", "Financial Management", "Resident Portal"],
  authors: [{ name: "Saanify Team" }],

  // ✅ ADD THIS
  applicationName: "Saanify",
  manifest: "/manifest.json",
  themeColor: "#0f172a",

  icons: {
    icon: "/icons/icon-192.png",   // 🔁 favicon.ico ki jagah
    apple: "/icons/icon-192.png",
  },

  openGraph: {
    title: "Saanify Society Management",
    description: "Complete society management solution for modern communities",
    url: "https://saanify.com",
    siteName: "Saanify",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Saanify Society Management",
    description: "Complete society management solution for modern communities",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* existing script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Immediate Performance API patch - runs before any React code
            (function() {
              if (typeof window !== 'undefined' && window.performance) {
                const originalMeasure = window.performance.measure;
                const originalMark = window.performance.mark;
                
                window.performance.measure = function(name, startMark, endMark) {
                  try {
                    return originalMeasure.call(this, name, startMark, endMark);
                  } catch (e) {
                    if (e.message && e.message.includes('negative time stamp')) {
                      console.warn('[Performance Fix] Early patch: Ignored measure "' + name + '" due to negative timestamp');
                      return undefined;
                    }
                    throw e;
                  }
                };
                
                window.performance.mark = function(name, options) {
                  try {
                    return originalMark.call(this, name, options);
                  } catch (e) {
                    console.warn('[Performance Fix] Early patch: Ignored mark "' + name + '"');
                    return undefined;
                  }
                };
              }
            })();
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <RazorpayLoader />
        <Providers>
          {/* ✅ LISTENER ADDED HERE INSIDE PROVIDERS */}
          <GlobalAuthListener />
          
          <ErrorBoundary>
            <AppShell>
              {children}
            </AppShell>
          </ErrorBoundary>
        </Providers>
        <ClientOnly>
          <Toaster />
          <SonnerToaster />
        </ClientOnly>

        {/* ✅ Service Worker (Bottom of body) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/service-worker.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
