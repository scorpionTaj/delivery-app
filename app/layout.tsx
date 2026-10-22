import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import Toasts from "@/components/Toasts";
import { uiInitScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delivery Manager",
  description: "Manage delivery zones, products and orders",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The init script sets class/data-* before hydration, hence suppressHydrationWarning.
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script id="ui-init" strategy="beforeInteractive">
          {uiInitScript}
        </Script>
      </head>
      <body className="min-h-full">
        {children}
        <Toasts />
      </body>
    </html>
  );
}
