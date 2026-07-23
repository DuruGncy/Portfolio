import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SmoothScrollProvider } from "@/components/smooth-scroll";
import { BootScreen } from "@/components/BootScreen";
import { AmbientBackground } from "@/components/AmbientBackground";
import { SkipLink } from "@/components/nav/SkipLink";
import { Navbar } from "@/components/nav/Navbar";
import { siteMetadata, personJsonLd } from "@/lib/seo";

// Self-hosted via next/font → no external requests, no layout shift.
// Loaded as a variable font (no `weight` array) so the full 100–800 wght axis
// is available — the hero name morphs weight per-letter on hover.
const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          // JSON-LD Person schema for recruiter tooling & rich results.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        {/* No-JS: never trap visitors behind the boot overlay, and reveal the
            grid immediately since the boot cue never fires without JS. */}
        <noscript>
          <style>{`.boot-screen{display:none!important}.ambient-grid--pre{opacity:1!important}`}</style>
        </noscript>
      </head>
      <body>
        {/* Global animated background — sits behind all content. */}
        <AmbientBackground />
        <Providers>
          <SmoothScrollProvider>
            <BootScreen />
            <SkipLink />
            <Navbar />
            {children}
          </SmoothScrollProvider>
        </Providers>
      </body>
    </html>
  );
}
