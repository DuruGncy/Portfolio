import type { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "railpredict-ai",
    name: "RailPredict AI",
    tagline: "Serverless pipeline for Belgian railway data",
    description:
      "Serverless system collecting and processing Belgian railway data.",
    technologies: ["Python", "AWS Lambda", "DynamoDB", "EventBridge"],
    architecture: [
      { label: "EventBridge", detail: "Scheduled trigger — fires the pipeline on a fixed cadence" },
      { label: "Lambda", detail: "Fetches & processes incoming railway information" },
      { label: "Data Processing", detail: "Cleans, normalizes & structures each payload" },
      { label: "DynamoDB", detail: "Stores time-stamped history for later analysis" },
    ],
    details: [
      "EventBridge schedules data collection",
      "Lambda functions process incoming railway information",
      "DynamoDB stores historical data",
      "Data can later be used for predictive analysis",
    ],
    focus: ["Serverless architecture", "Scalability", "Cost efficiency", "Cloud automation"],
    accent: "teal",
    kind: "cloud",
    problem:
      "Live Belgian railway data is transient — it streams and disappears, with no affordable place to keep a history you can actually analyze. To study delays and patterns you first need a reliable, always-on collector that captures the data automatically and costs almost nothing while it sits idle.",
    implementation: [
      "An Amazon EventBridge rule triggers the pipeline on a fixed schedule — no servers to keep running between collections.",
      "A Python AWS Lambda function fetches the latest railway information and handles the request lifecycle.",
      "A processing step cleans and normalizes each payload into a consistent shape before storage.",
      "Records are written to DynamoDB, keyed for time-series access so history can be queried per line/station over time.",
      "The whole stack is pay-per-use: cost scales to zero when nothing is running.",
    ],
    challenges: [
      "Designing DynamoDB partition/sort keys for efficient time-series queries rather than costly scans.",
      "Making collection idempotent so retries and overlapping runs don't create duplicate records.",
      "Keeping Lambda within timeout and cold-start budgets while staying inside the free tier.",
      "Gracefully handling upstream API rate limits and transient failures with retries.",
    ],
    lessons: [
      "Serverless is a perfect fit for scheduled, spiky workloads — you pay for work, not uptime.",
      "For time-series data, key design is the single biggest lever on cost and query speed.",
      "Designing for observability and cost from day one beats bolting them on later.",
    ],
    github: "https://github.com/DuruGncy",
  },
  {
    id: "project-rift",
    name: "Project RIFT",
    tagline: "Modular, performant gameplay systems in Unity 6",
    description:
      "A game project built around clean, scalable engineering: data-driven systems, pooling, procedural content and adaptive AI.",
    technologies: ["Unity 6", "C#", "AI Systems"],
    pillars: [
      {
        title: "ScriptableObjects",
        detail:
          "Data-driven architecture — entities, abilities and config live as assets, decoupled from code so systems stay modular and designer-tweakable.",
        icon: "scriptable",
      },
      {
        title: "Object pooling",
        detail:
          "Enemies and projectiles are reused from pools instead of instantiated at runtime, avoiding GC spikes and keeping frame times stable.",
        icon: "pool",
      },
      {
        title: "Procedural generation",
        detail:
          "Seeded level generation produces varied, replayable layouts while staying fair and solvable.",
        icon: "procedural",
      },
      {
        title: "Adaptive AI",
        detail:
          "Behaviour that reads and responds to the player, adjusting pressure through state-driven decision making.",
        icon: "ai",
      },
    ],
    details: [
      "ScriptableObjects architecture",
      "Object pooling for performance",
      "Procedural level generation",
      "Adaptive AI systems",
    ],
    focus: ["Scalable game architecture", "Performance optimization", "Clean system design"],
    accent: "violet",
    kind: "game",
    problem:
      "As a game grows, its systems tend to rot into tightly-coupled spaghetti and its frame rate suffers from constant object churn. The real challenge wasn't the gameplay — it was engineering systems that stay flexible and performant as content scales.",
    implementation: [
      "Built a data-driven core on ScriptableObjects so behaviour and config are assets, not hard-coded — systems communicate through decoupled channels.",
      "Introduced an object-pool manager that recycles enemies and projectiles, resetting their state on reuse.",
      "Wrote a seeded procedural generator so levels are varied yet reproducible for testing.",
      "Layered an adaptive AI on state machines that shifts tactics based on how the player is doing.",
      "Ran the work with GitHub, Jira and an Agile workflow to iterate in small, reviewable slices.",
    ],
    challenges: [
      "Pooling correctness — every reused object must fully reset, or subtle state bugs leak between lives.",
      "Making procedural levels feel varied without ever generating an unfair or unsolvable layout.",
      "Decoupling systems while still letting them coordinate — solved with event/ScriptableObject channels.",
      "Profiling and hunting down the allocation hot-paths that caused GC hitches.",
    ],
    lessons: [
      "Data-driven design scales — moving config into assets keeps code small and systems composable.",
      "Pooling isn't premature optimization in games; it's the difference between smooth and stuttering.",
      "Event-driven architecture keeps modules independent and far easier to reason about.",
    ],
    github: "https://github.com/DuruGncy",
  },
];
