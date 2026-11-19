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

// LaMP's display face: page titles, the logo and the numbers that matter.
const display = Barlow_Semi_Condensed({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "LaMP", template: "%s · LaMP" },
  description: "See your cash for the weeks ahead, sell stock before it expires, and pay for the next order the cheapest way. For neighborhood pharmacies and the families who buy there on credit.",
  applicationName: "LaMP",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a110e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${barlow.variable} ${display.variable} h-full antialiased`} suppressHydrationWarning>
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
