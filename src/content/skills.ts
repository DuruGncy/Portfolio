import type { SkillCategory } from "@/types";

export const skills: SkillCategory[] = [
  {
    name: "Programming",
    icon: "code",
    skills: ["Python", "Java", "C++", "C#", "JavaScript", "SQL"],
  },
  {
    name: "Cloud",
    icon: "cloud",
    skills: ["Azure", "AWS", "Docker"],
  },
  {
    name: "Databases",
    icon: "database",
    skills: ["PostgreSQL", "MySQL", "Oracle"],
  },
  {
    name: "Frameworks",
    icon: "layers",
    skills: ["React", "Node.js", "Unity 6", "Java Swing"],
  },
  {
    name: "Tools",
    icon: "wrench",
    skills: ["Git", "GitHub", "VS Code", "IntelliJ IDEA", "Jira", "Linux"],
  },
];

// One-line descriptions surfaced on hover/focus in the Skills explorer.
export const skillDescriptions: Record<string, string> = {
  // Programming
  Python: "My go-to for cloud automation, data pipelines and quick scripts.",
  Java: "The OOP workhorse where a lot of my CS fundamentals were forged.",
  "C++": "Low-level control and performance — it taught me how machines really think.",
  "C#": "Powers my Unity game systems and .NET experiments.",
  JavaScript: "The glue of the web — from UI logic to Node services.",
  SQL: "Querying, joining and tuning — the language I speak to databases.",
  // Cloud
  Azure: "Where I tuned Oracle & SQL workloads during my Bimar internship.",
  AWS: "My serverless playground: Lambda, DynamoDB, EventBridge and more.",
  Docker: "Containerizing apps so they run the same everywhere.",
  // Databases
  PostgreSQL: "My favourite relational DB — robust, standards-driven, reliable.",
  MySQL: "A classic relational database for web-scale apps.",
  Oracle: "Enterprise-grade SQL I optimized hands-on at Arkas – Bimar IT.",
  // Frameworks
  React: "Component-driven UIs — like the one you're reading right now.",
  "Node.js": "JavaScript on the server for fast, event-driven backends.",
  "Unity 6": "Where I build game mechanics and AI systems in C#.",
  "Java Swing": "Desktop GUIs — old-school, but great for learning UI architecture.",
  // Tools
  Git: "Version control I can't imagine working without.",
  GitHub: "Where my code lives, collaborates and ships.",
  "VS Code": "My daily editor, tuned for cloud and web work.",
  "IntelliJ IDEA": "Heavy-duty IDE for Java and JVM projects.",
  Jira: "Agile boards to plan and track work — used it on Project RIFT.",
  Linux: "Comfortable in the terminal, where servers and clouds live.",
};
