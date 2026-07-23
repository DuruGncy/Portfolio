import { NAV_LINKS } from "@/lib/sections";
import { Hero } from "@/components/hero/Hero";
import { WhoIAm } from "@/components/about/WhoIAm";
import { Journey } from "@/components/journey/Journey";
import { MissionArchive } from "@/components/projects/MissionArchive";
import { Skills } from "@/components/skills/Skills";
import { Books } from "@/components/books/Books";
import { FutureDestination } from "@/components/future/FutureDestination";
import { Contact } from "@/components/contact/Contact";

// Sections that have been built render their real component; the rest stay as
// lightweight placeholders until they're implemented.
const BUILT: Record<string, React.ComponentType> = {
  home: Hero,
  "who-i-am": WhoIAm,
  journey: Journey,
  "mission-archive": MissionArchive,
  skills: Skills,
  books: Books,
  "future-destination": FutureDestination,
  contact: Contact,
};

// Page section order, matching the nav destinations.
const PAGE_ORDER = [
  "home",
  "who-i-am",
  "journey",
  "mission-archive",
  "skills",
  "books",
  "future-destination",
  "contact",
];

const LABELS: Record<string, string> = Object.fromEntries(
  NAV_LINKS.map((l) => [l.id, l.label])
);

export default function Home() {
  return (
    <main id="main">
      {PAGE_ORDER.map((id, i) => {
        const Built = BUILT[id];
        if (Built) return <Built key={id} />;
        return (
          <section
            key={id}
            id={id}
            data-section={id}
            className="flex min-h-[100svh] scroll-mt-24 flex-col items-center justify-center px-6 text-center"
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              {`0${i + 1}`} — section placeholder
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-balance sm:text-6xl">
              {LABELS[id] ?? id}
            </h2>
            <p className="mt-4 max-w-md text-sm text-muted">
              Navigation target for testing. The real content will live here later.
            </p>
          </section>
        );
      })}
    </main>
  );
}
