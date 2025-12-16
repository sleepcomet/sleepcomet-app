import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics } from "@/components/google-analytics"
import { MicrosoftClarity } from "@/components/microsoft-clarity"
import { TurboInit } from "@/components/turbo-init";
import { UmamiAnalytics } from "@/components/umami-analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sleepcomet Console | Monitoring is Endpoints",
  description: "Monitoring is Endpoints",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID_PROD
  const gaId = process.env.NEXT_PUBLIC_GA_ID_PROD
  const isProduction = process.env.NODE_ENV === "production"

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        cz-shortcut-listen="true"
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TurboInit />
          <UmamiAnalytics />
          <SpeedInsights />
          <Analytics />
          {isProduction && clarityId && <MicrosoftClarity projectId={clarityId} />}
          {isProduction && gaId && <GoogleAnalytics gaId={gaId} />}
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
