"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/content/profile";
import { skills } from "@/content/skills";
import { projects } from "@/content/projects";
import { timeline } from "@/content/timeline";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { clsx } from "@/lib/clsx";

const WELCOME = "Welcome to Duru's portfolio.";
const WELCOME_HINT = "Type 'help' to get started.";

interface OutputLine {
  id: number;
  node: React.ReactNode;
}

// ---- small presentational helpers for command output --------------------
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap gap-x-3">
      <span className="w-28 shrink-0 text-violet">{k}</span>
      <span className="text-fg/90">{v}</span>
    </div>
  );
}
function Head({ children }: { children: React.ReactNode }) {
  return <p className="text-teal">{children}</p>;
}

// ---- command registry ----------------------------------------------------
type CommandMap = Record<
  string,
  { desc: string; run: () => React.ReactNode }
>;

function buildCommands(): CommandMap {
  const workIds = new Set(["ambassador", "internship"]);
  const eduIds = new Set(["start-degree", "erasmus", "graduation"]);

  return {
    help: {
      desc: "list available commands",
      run: () => (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {COMMAND_ORDER.map((c, i) => (
            <span key={c} className="flex items-center gap-2">
              <span className="text-cyan">{c}</span>
              {i < COMMAND_ORDER.length - 1 && (
                <span aria-hidden className="text-subtle">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      ),
    },
    whoami: {
      desc: "who is Duru?",
      run: () => (
        <div className="space-y-1">
          <Head>{profile.name} · {profile.title}</Head>
          <p className="text-fg/90">{profile.heroIntro}</p>
          <p className="text-muted">📍 {profile.location} → Europe</p>
        </div>
      ),
    },
    skills: {
      desc: "technical skills",
      run: () => (
        <div className="space-y-1.5">
          {skills.map((cat) => (
            <div key={cat.name} className="flex flex-wrap gap-x-3">
              <span className="w-24 shrink-0 text-violet">{cat.name}</span>
              <span className="text-fg/90">{cat.skills.join(" · ")}</span>
            </div>
          ))}
        </div>
      ),
    },
    projects: {
      desc: "featured projects",
      run: () => (
        <div className="space-y-2.5">
          {projects.map((p) => (
            <div key={p.id}>
              <Head>
                {p.name} <span className="text-muted">— {p.tagline}</span>
              </Head>
              <p className="text-fg/80">{p.description}</p>
              <p className="text-cyan/80">{p.technologies.join(" · ")}</p>
            </div>
          ))}
        </div>
      ),
    },
    experience: {
      desc: "work experience",
      run: () => (
        <div className="space-y-2">
          {timeline
            .filter((t) => workIds.has(t.id))
            .map((t) => (
              <div key={t.id}>
                <Head>
                  {t.role} <span className="text-muted">· {t.date}</span>
                </Head>
                <p className="text-fg/80">
                  {t.org} — {t.location}
                </p>
                {t.bullets && (
                  <p className="text-cyan/80">{t.bullets.join(" · ")}</p>
                )}
              </div>
            ))}
        </div>
      ),
    },
    education: {
      desc: "education & exchange",
      run: () => (
        <div className="space-y-2">
          {timeline
            .filter((t) => eduIds.has(t.id))
            .map((t) => (
              <div key={t.id}>
                <Head>
                  {t.role} <span className="text-muted">· {t.date}</span>
                </Head>
                <p className="text-fg/80">
                  {t.org}
                  {t.location ? ` — ${t.location}` : ""}
                </p>
              </div>
            ))}
        </div>
      ),
    },
    socials: {
      desc: "find me online",
      run: () => (
        <div className="space-y-1">
          {profile.socials.map((s) => (
            <div key={s.label} className="flex gap-3">
              <span className="w-20 shrink-0 text-violet">{s.label}</span>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan underline-offset-2 hover:underline"
              >
                {s.handle}
              </a>
            </div>
          ))}
        </div>
      ),
    },
    resume: {
      desc: "download my CV",
      run: () => (
        <div className="space-y-1">
          <p className="text-fg/90">Grab a copy of my resume:</p>
          <a
            href="/Duru_Gencay_Resume.pdf"
            download
            className="text-cyan underline-offset-2 hover:underline"
          >
            ↳ Duru_Gencay_Resume.pdf
          </a>
        </div>
      ),
    },
    contact: {
      desc: "get in touch",
      run: () => (
        <div className="space-y-1">
          <Row k="email" v={profile.email} />
          <Row k="phone" v={profile.phone} />
          <Row k="location" v={`${profile.location} · open to relocation`} />
        </div>
      ),
    },
    languages: {
      desc: "languages I speak",
      run: () => (
        <div className="space-y-1">
          {profile.languages.map((l) => (
            <Row key={l.name} k={l.name} v={l.level} />
          ))}
        </div>
      ),
    },
    clear: {
      desc: "clear the terminal",
      run: () => null, // handled specially
    },
  };
}

const COMMANDS = buildCommands();
const COMMAND_ORDER = [
  "help",
  "whoami",
  "skills",
  "projects",
  "experience",
  "education",
  "socials",
  "resume",
  "contact",
  "languages",
  "clear",
];

// -------------------------------------------------------------------------
/**
 * @param start Gate for the "wake up" beat. While `false` the terminal sits
 *   silent — no welcome typing, no cursor — so the hero can reveal it first and
 *   only bring it to life once the entrance has landed. Defaults to `true`.
 */
export function Terminal({ start = true }: { start?: boolean }) {
  const reduced = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [awake, setAwake] = useState(false);
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);

  const idRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nextId = () => ++idRef.current;

  // Derived: reduced motion shows the full welcome immediately, no animation.
  const booted = reduced || typingDone;
  const shownWelcome = reduced ? WELCOME : typed;

  // Typewriter welcome message — held until the hero says the entrance has
  // landed (`start`), then types out. Skipped entirely under reduced motion.
  useEffect(() => {
    if (reduced || !start) return;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTyped(WELCOME.slice(0, i));
      if (i >= WELCOME.length) {
        clearInterval(timer);
        setTypingDone(true);
      }
    }, 22);
    return () => clearInterval(timer);
  }, [reduced, start]);

  // Keep scrolled to the newest output.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, booted]);

  const push = useCallback((node: React.ReactNode) => {
    setLines((prev) => [...prev, { id: nextId(), node }]);
  }, []);

  const runCommand = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      // Echo the prompt line.
      push(
        <div className="flex items-center gap-2">
          <span className="text-teal">➜</span>
          <span className="text-cyan">~</span>
          <span className="text-fg/90">{cmd}</span>
        </div>
      );

      if (cmd === "") return;

      if (cmd === "clear") {
        setLines([]);
        return;
      }

      const entry = COMMANDS[cmd];
      if (!entry) {
        push(
          <p className="text-red-400/90">
            command not found: {cmd} — type{" "}
            <span className="text-cyan">help</span>
          </p>
        );
        return;
      }
      push(<div className="pl-4">{entry.run()}</div>);
    },
    [push]
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = input;
      if (value.trim()) setHistory((h) => [...h, value.trim()]);
      setHistIdx(null);
      runCommand(value);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(idx);
      setInput(history[idx]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const idx = histIdx + 1;
      if (idx >= history.length) {
        setHistIdx(null);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(history[idx]);
      }
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const frag = input.trim().toLowerCase();
      if (!frag) return;
      const matches = COMMAND_ORDER.filter((c) => c.startsWith(frag));
      if (matches.length === 1) {
        setInput(matches[0]);
      } else if (matches.length > 1) {
        push(<p className="text-muted">{matches.join("   ")}</p>);
      }
    }
  }

  const focusInput = () => inputRef.current?.focus();

  const promptCursor = useMemo(
    () => (
      <span
        className="ml-0.5 inline-block h-4 w-[8px] translate-y-0.5 bg-teal"
        style={{
          animation: reduced
            ? undefined
            : `boot-blink ${awake ? "0.7s" : "1.15s"} steps(1) infinite`,
        }}
      />
    ),
    [reduced, awake]
  );

  return (
    <div
      onClick={focusInput}
      onPointerEnter={() => setAwake(true)}
      onFocusCapture={() => setAwake(true)}
      style={{ backgroundColor: "var(--surface)" }}
      className={clsx(
        "overflow-hidden rounded-2xl border transition-[border-color,box-shadow] duration-500",
        awake
          ? "border-border-strong shadow-[0_0_0_1px_rgba(45,212,191,0.15),0_30px_80px_-45px_rgba(0,0,0,0.9)]"
          : "border-border-subtle shadow-[0_20px_60px_-50px_rgba(0,0,0,0.8)]"
      )}
    >
      {/* Title bar */}
      <div
        className={clsx(
          "flex items-center gap-4 border-b border-border-subtle bg-white/[0.02] px-4 py-3 transition-opacity duration-500",
          awake ? "opacity-100" : "opacity-70"
        )}
      >
        <div className="flex items-center gap-2" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <p className="flex-1 text-center font-mono text-xs text-muted">
          duru@portfolio · zsh
        </p>
        <div className="w-[52px]" aria-hidden />
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className={clsx(
          "h-[420px] overflow-y-auto p-5 font-mono text-[13px] leading-relaxed transition-opacity duration-500 sm:h-[470px]",
          awake ? "opacity-100" : "opacity-80"
        )}
        role="log"
        aria-label="Terminal output"
      >
        {/* Welcome — two calm lines; the hint appears once the greeting lands */}
        <p className="text-muted">
          {shownWelcome}
          {!booted && start && promptCursor}
        </p>
        {booted && <p className="mt-0.5 text-subtle">{WELCOME_HINT}</p>}

        {/* Output history */}
        <div className="mt-2 space-y-2">
          {lines.map((l) => (
            <div key={l.id}>{l.node}</div>
          ))}
        </div>

        {/* Live input */}
        {booted && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-teal">➜</span>
            <span className="text-cyan">~</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal command input"
              className="flex-1 bg-transparent text-fg outline-none"
              style={{ caretColor: "var(--teal)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
