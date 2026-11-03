import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PinGate } from "@/components/pin-gate";
import { ThemeProvider } from "@/components/theme";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const board = Barlow_Semi_Condensed({
  variable: "--font-board",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "LaMP", template: "%s · LaMP" },
  description: "An AI money helper for the neighborhood pharmacy: cash ahead, expiring stock, and the cheapest way to fund the next order, so families find their medicine in stock.",
  applicationName: "LaMP",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f4d3a" },
    { media: "(prefers-color-scheme: dark)", color: "#0d3f30" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${board.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          {/* Customer cards (/me/<code>) only know their URL at request time, so they stream in here. */}
          <Suspense fallback={<div className="min-h-dvh bg-shelf" aria-busy="true" />}>
            <PinGate>
              <AppShell>{children}</AppShell>
            </PinGate>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
