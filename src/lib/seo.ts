import type { Metadata } from "next";
import { profile } from "@/content/profile";

const SITE_URL = "https://durugencay.dev"; // update at deploy time
const DESCRIPTION = profile.heroIntro;

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s — ${profile.name}`,
  },
  description: DESCRIPTION,
  keywords: [
    "Duru Gencay",
    "Software Engineer",
    "Cloud Engineer",
    "Backend Developer",
    "AWS",
    "Serverless",
    "Europe",
    "Izmir",
  ],
  authors: [{ name: profile.name }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: `${profile.name} — ${profile.title}`,
    description: DESCRIPTION,
    siteName: `${profile.name} Portfolio`,
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.title}`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

// JSON-LD structured data for rich results / recruiter tooling.
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    email: `mailto:${profile.email}`,
    telephone: profile.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Izmir",
      addressCountry: "TR",
    },
    knowsLanguage: profile.languages.map((l) => l.name),
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Yaşar University",
    },
    sameAs: profile.socials
      .filter((s) => s.icon !== "mail" && s.icon !== "phone")
      .map((s) => s.href),
  };
}
