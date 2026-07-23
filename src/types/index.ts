// Shared domain types. All portfolio copy lives in /content as typed data.

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
  icon: "github" | "linkedin" | "medium" | "mail" | "phone";
}

export interface LanguageSkill {
  name: string;
  level: string;
  /** 0–100 proficiency for the meter bar. */
  proficiency: number;
}

export interface Profile {
  name: string;
  title: string;
  location: string;
  heroIntro: string;
  aboutParagraphs: string[];
  languages: LanguageSkill[];
  socials: SocialLink[];
  email: string;
  phone: string;
  quickFacts: string[];
}

export interface TimelineEntry {
  id: string;
  date: string;
  role: string;
  org?: string;
  location?: string;
  description: string;
  bullets?: string[];
  /** Journey marker — where on the Izmir→Europe arc this sits. */
  place: "izmir" | "europe";
  milestone?: boolean;
  /** Optional real photo (e.g. "/duru_erasmus.png" in /public). When set, it
   *  replaces the generated gradient + icon emblem in the timeline card. */
  image?: string;
}

export interface ArchitectureNode {
  label: string;
  detail: string;
}

export interface EngineeringPillar {
  title: string;
  detail: string;
  icon: "scriptable" | "pool" | "procedural" | "ai";
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  technologies: string[];
  /** Ordered pipeline nodes for the animated architecture diagram. */
  architecture?: ArchitectureNode[];
  /** Engineering pillars (used for the game project instead of a pipeline). */
  pillars?: EngineeringPillar[];
  details: string[];
  focus: string[];
  accent: "teal" | "violet";
  kind: "cloud" | "game";
  /** Case-study content. */
  problem: string;
  implementation: string[];
  challenges: string[];
  lessons: string[];
  github: string;
}

export interface SkillCategory {
  name: string;
  icon: "code" | "cloud" | "database" | "layers" | "wrench";
  skills: string[];
}

export interface Book {
  /** Stable id; also selects which themed cover motif is drawn. */
  id: number;
  title: string;
  author: string;
  genre: string;
  /** Duru's personal take, slid in beside the shelf when the book is opened. */
  thoughts: string;
  /** 1–5 stars shown in the review byline. */
  rating: number;

  /** Spine thickness in px — every book is a different width. */
  spineW: number;
  /** Book height in px — subtle variance so the shelf reads as real. */
  h: number;
  /** Front-cover width in px when the book swings open. */
  coverW: number;

  /** Solid spine background colour. */
  spine: string;
  /** Spine title colour (light on dark spines, dark on pale ones). */
  spineText: string;
  /** Cover ground colour for the procedural motif art. */
  c0: string;
  /** Motif line-art / lettering colour that sits on the cover ground. */
  accent: string;

  /** Optional real cover image (e.g. "/books/dune.jpg" placed in /public).
   *  When set, it replaces the generated motif cover. */
  coverImage?: string;
  /** Optional spine image; replaces the generated spine when set. */
  spineImage?: string;
}
