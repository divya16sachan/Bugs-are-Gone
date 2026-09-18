import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Beauty Shop | Luxury Botanical Skincare & Makeup",
    template: "%s | Beauty Shop",
  },
  description:
    "Explore our curated collection of luxury botanical serums, moisturizers, makeup, and organic skincare essentials.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body
        className={cn(
          inter.variable,
          geistMono.variable,
          "font-sans antialiased bg-background text-foreground"
        )}
      >
        <QueryProvider>
          {children}
          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}