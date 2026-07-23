import type { Profile } from "@/types";

export const profile: Profile = {
  name: "Duru Gencay",
  title: "Software Engineer",
  location: "Izmir, Türkiye",
  heroIntro:
    "Software Engineering graduate specializing in cloud and backend development — building serverless systems on AWS and tuning databases on Azure. Based in Izmir.",
  aboutParagraphs: [
    "I'm Duru — a software engineer who got hooked on building things the first time I watched code turn into something people could actually use.",
    "I'm finishing my B.Sc. in Software Engineering at Yaşar University in Izmir (June 2026), with an Erasmus semester studying Applied Computer Science in Brugge, Belgium behind me — my first taste of living and building abroad, and the experience that set my direction.",
    "Most of my energy goes into the cloud — I love the puzzle of making systems that are reliable, scalable, and don't cost a fortune to run.",
    "I got hands-on with Oracle and Azure SQL during my internship at Arkas – Bimar IT, and I've been building serverless projects on AWS — Lambda, DynamoDB, EventBridge — ever since. When I'm not thinking about databases and pipelines, I'm in Unity building game mechanics or deep in a sci-fi or philosophy novel.",
    "I speak Turkish, English (C1), and I'm learning Dutch.",
    "Always up for a new challenge, a new country, and a new problem to solve.",
  ],
  languages: [
    { name: "Turkish", level: "Native", proficiency: 100 },
    { name: "English", level: "C1", proficiency: 85 },
    { name: "Dutch", level: "Beginner", proficiency: 25 },
  ],
  socials: [
    {
      label: "GitHub",
      href: "https://github.com/DuruGncy",
      handle: "DuruGncy",
      icon: "github",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/durugencay",
      handle: "durugencay",
      icon: "linkedin",
    },
    {
      label: "Medium",
      href: "https://medium.com/@durugencayy",
      handle: "@durugencayy",
      icon: "medium",
    },
    {
      label: "Email",
      href: "mailto:durugencayy@gmail.com",
      handle: "durugencayy@gmail.com",
      icon: "mail",
    },
  ],
  email: "durugencayy@gmail.com",
  phone: "+90 552 223 99 07",
  quickFacts: [
    "Cloud & backend engineering",
    "Serverless on AWS",
    "Unity game mechanics",
    "Sci-fi & philosophy reader",
    "Learning Dutch 🇳🇱",
  ],
};
