import type { TimelineEntry } from "@/types";

export const timeline: TimelineEntry[] = [
  {
    id: "start-degree",
    date: "September 2022",
    role: "Started B.Sc. Software Engineering",
    org: "Yaşar University",
    location: "Izmir, Türkiye",
    description:
      "Started university journey focusing on software engineering fundamentals, programming, algorithms and software development.",
    place: "izmir",
  },
  {
    id: "ambassador",
    date: "February – March 2023",
    role: "Student Ambassador & Software Engineering Representative",
    org: "Yaşar University",
    location: "Izmir, Türkiye",
    description:
      "Represented software engineering students and supported communication between students and university.",
    place: "izmir",
  },
  {
    id: "internship",
    date: "February – March 2024",
    role: "Software Engineering Intern",
    org: "Arkas Holding – Bimar IT",
    location: "Izmir, Türkiye",
    description:
      "Tuned Oracle and Azure SQL workloads — query optimization and performance work on production databases.",
    bullets: [
      "Oracle databases",
      "SQL optimization",
      "Query tuning",
      "Azure SQL",
      "Database performance improvements",
    ],
    place: "izmir",
    image: "/duru_internship.png",
  },
  {
    id: "erasmus",
    date: "February – June 2025",
    role: "Erasmus Exchange — Applied Computer Science",
    org: "Hogeschool West-Vlaanderen",
    location: "Brugge, Belgium",
    description:
      "Studied Applied Computer Science on exchange — my first experience living and building abroad.",
    place: "europe",
    image: "/duru_erasmus.png",
  },
  {
    id: "graduation",
    date: "June 2026",
    role: "Graduation 🎓",
    org: "Yaşar University",
    location: "Izmir, Türkiye",
    description: "B.Sc. Software Engineering.",
    place: "izmir",
    milestone: true,
    image: "/duru_graduation.png",
  },
];
