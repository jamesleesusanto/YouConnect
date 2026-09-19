"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Heart,
  MousePointerClick,
  Building2,
  Users,
  Sparkle,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Animation hooks                                                    */
/* ------------------------------------------------------------------ */

function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal(0.15);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedNumber({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const [ref, started] = useReveal(0.4);
  useEffect(() => {
    if (!started) return;
    const num = parseInt(String(target).replace(/[^0-9]/g, ""), 10);
    const steps = 60;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setCount(num);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 1800 / steps);
    return () => clearInterval(timer);
  }, [started, target]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared bits                                                        */
/* ------------------------------------------------------------------ */

const INK = "#1a1625";
const hardShadow = "shadow-[5px_5px_0_0_#1a1625]";

const CATEGORIES = [
  "Internships",
  "Workshops",
  "Research",
  "Volunteering",
  "Scholarships",
  "Mentorship",
  "Bootcamps",
  "Fellowships",
  "Competitions",
];

function Marquee() {
  const items = [...CATEGORIES, ...CATEGORIES];
  return (
    <div className="overflow-hidden border-y-2 border-[#1a1625] bg-[#1a1625] py-4">
      <div className="yd-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {items.map((c, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-2xl font-semibold text-cream sm:text-3xl" style={{ color: "#fbf7ef" }}>
              {c}
            </span>
            <Sparkle className="size-5 shrink-0" style={{ color: "#c8f135" }} fill="#c8f135" />
          </span>
        ))}
      </div>
    </div>
  );
}

const STATS = [
  { label: "Communities served", value: "500", suffix: "+", lime: false },
  { label: "Curated opportunities", value: "120", suffix: "+", lime: true },
  { label: "Students reached", value: "3000", suffix: "+", lime: false },
];

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Browse what's out there",
    desc: "Search and filter hundreds of vetted opportunities from real organizations in your area.",
  },
  {
    n: "02",
    icon: Heart,
    title: "Save the ones you love",
    desc: "Favorite opportunities and export them as your own personal shortlist — no account gymnastics.",
  },
  {
    n: "03",
    icon: MousePointerClick,
    title: "Connect & apply direct",
    desc: "Go straight to the organization to apply or learn more. No middleman, no fees, ever.",
  },
];

const PREVIEW_ROWS = [
  { name: "Youth Leadership Summit", type: "Workshop", org: "City Council", loc: "Philadelphia, PA" },
  { name: "STEM Research Internship", type: "Internship", org: "Penn Labs", loc: "Philadelphia, PA" },
  { name: "Community Garden Build", type: "Volunteering", org: "Green Philly", loc: "Philadelphia, PA" },
  { name: "College Prep Workshop", type: "Workshop", org: "Youdemonia", loc: "Detroit, MI" },
  { name: "Coding Bootcamp", type: "Education", org: "TechBridge", loc: "Remote" },
  { name: "Marine Biology Fellowship", type: "Research", org: "Ocean Institute", loc: "San Diego, CA" },
  { name: "Hospital Volunteer Corps", type: "Volunteering", org: "Chicago Med", loc: "Chicago, IL" },
  { name: "Robotics Mentorship", type: "Mentorship", org: "TechBridge", loc: "Austin, TX" },
];

const SEARCH_CHIPS = ["Internships", "Workshops", "Research", "Volunteering", "Remote", "Scholarships"];
const TRENDING = ["STEM Research Internship", "Coding Bootcamp", "Hospital Volunteer Corps"];

function HeroSearch() {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const s = q.toLowerCase();
    return PREVIEW_ROWS.filter(
      (r) => (r.name + r.type + r.loc).toLowerCase().includes(s)
    ).slice(0, 5);
  }, [q]);

  return (
    <div className="mt-10 w-full max-w-2xl">
      {/* Search box — styled to match the brutalist theme */}
      <div className="relative">
        <div
          className={`flex items-center gap-3 rounded-2xl border-2 border-[#1a1625] bg-white px-5 py-4 ${hardShadow} transition-shadow ${results.length ? "rounded-b-none shadow-none" : ""}`}
        >
          <Search className="size-5 shrink-0 text-[#1a1625]/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Try "research", "remote", or "workshop"…'
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-[#1a1625]/35 text-[#1a1625]"
            aria-label="Search opportunities"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="shrink-0 text-[#1a1625]/30 hover:text-[#1a1625]/60 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {results.length > 0 && (
          <div className={`absolute z-20 w-full overflow-hidden rounded-b-2xl border-2 border-t-0 border-[#1a1625] bg-white text-left ${hardShadow}`}>
            {results.map((r) => (
              <Link
                key={r.name}
                href="/opportunities"
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#c8f135]/20 border-t border-[#1a1625]/10 first:border-t-0"
              >
                <Search className="size-4 shrink-0 text-[#1a1625]/30" />
                <span className="flex-1 text-sm font-semibold text-[#1a1625]">{r.name}</span>
                <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                  {r.type}
                </span>
                <span className="hidden shrink-0 items-center gap-1 font-mono text-xs text-[#1a1625]/40 sm:flex">
                  <MapPin className="size-3" /> {r.loc}
                </span>
              </Link>
            ))}
            <Link
              href="/opportunities"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1a1625]/5 text-sm font-bold text-primary hover:bg-[#c8f135]/20 transition-colors border-t border-[#1a1625]/10"
            >
              See all results <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Quick chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SEARCH_CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => setQ(c)}
            className="rounded-full border-2 border-[#1a1625]/20 bg-white px-4 py-1.5 text-sm font-semibold text-[#1a1625]/70 transition-all hover:border-[#1a1625] hover:text-[#1a1625] hover:bg-[#c8f135]"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Trending */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#1a1625]/50">
          <TrendingUp className="size-3.5" /> Popular
        </span>
        {TRENDING.map((p) => (
          <button
            key={p}
            onClick={() => setQ(p)}
            className="font-mono text-xs text-[#1a1625]/55 underline-offset-4 hover:underline hover:text-[#1a1625]"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function PlatformPreview() {
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-[#1a1625] bg-white ${hardShadow}`}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b-2 border-[#1a1625] bg-[#fbf7ef] px-4 py-3">
        <span className="h-3 w-3 rounded-full border border-[#1a1625] bg-red-400" />
        <span className="h-3 w-3 rounded-full border border-[#1a1625] bg-amber-400" />
        <span className="h-3 w-3 rounded-full border border-[#1a1625] bg-[#c8f135]" />
        <div className="mx-auto flex items-center gap-2 rounded-md border border-[#1a1625]/20 bg-white px-3 py-1 font-mono text-xs text-[#1a1625]/60">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          youconnect.youdemonia.org
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#1a1625]">YouConnect Platform</p>
        <div className="flex gap-2">
          <span className="rounded-full border-2 border-[#1a1625] px-3 py-0.5 text-xs font-semibold">All Types</span>
          <span className="hidden rounded-full border-2 border-[#1a1625] px-3 py-0.5 text-xs font-semibold sm:inline-flex">
            Location
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2.5 p-5">
        {PREVIEW_ROWS.map((row) => (
          <div
            key={row.name}
            className="flex items-center gap-3 rounded-xl border-2 border-[#1a1625]/10 bg-[#fbf7ef] px-3 py-2.5 transition-colors hover:border-[#1a1625]/30"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#1a1625]">{row.name}</p>
              <p className="font-mono text-xs text-[#1a1625]/50">{row.org}</p>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {row.type}
            </span>
            <span className="hidden shrink-0 items-center gap-1 font-mono text-xs text-[#1a1625]/50 sm:flex">
              <MapPin className="size-3" /> {row.loc}
            </span>
            <Heart className="size-4 shrink-0 fill-red-400 text-red-400" />
          </div>
        ))}
        <p className="pt-1 text-center font-mono text-[11px] text-[#1a1625]/50">Showing 5 of 120+ opportunities</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="font-body text-[#1a1625]" style={{ background: "#fbf7ef" }}>
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden">
        {/* dotted texture */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(#1a162522 1.1px, transparent 1.1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 50%, transparent 100%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left — type */}
            <div className="relative">
              <Reveal>
                <p className="mb-6 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#1a1625]/70">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Student-run · 501(c)(3) nonprofit
                </p>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight text-[#1a1625]">
                  The{" "}
                  <span
                    className="relative inline-block -rotate-1 px-2"
                    style={{ background: "#c8f135", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
                  >
                    opportunities
                  </span>{" "}
                  you deserve, finally in one place.
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-7 max-w-md text-lg leading-relaxed text-[#1a1625]/65">
                  Youdemonia surfaces local internships, workshops, research, and volunteering —
                  vetted, organized, and completely free for students.
                </p>
              </Reveal>

              <Reveal delay={200}>
                <HeroSearch />
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    href="/opportunities"
                    className={`group inline-flex items-center gap-2 rounded-full border-2 border-[#1a1625] bg-primary px-7 py-3.5 text-base font-bold text-white ${hardShadow} transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1625]`}
                  >
                    Browse Opportunities
                    <ArrowUpRight className="size-5 transition-transform group-hover:rotate-12" />
                  </Link>
                  <Link
                    href="/login"
                    className={`group inline-flex items-center gap-2 rounded-full border-2 border-[#1a1625] bg-white px-7 py-3.5 text-base font-bold text-[#1a1625] ${hardShadow} transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1625]`}
                  >
                    <Building2 className="size-5" />
                    I&apos;m an Organizer
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-8 flex items-center gap-3 font-mono text-xs text-[#1a1625]/55">
                  <div className="flex -space-x-2">
                    {["bg-primary", "bg-[#c8f135]", "bg-amber-400", "bg-rose-400"].map((c, i) => (
                      <span key={i} className={`h-7 w-7 rounded-full border-2 border-[#fbf7ef] ${c}`} />
                    ))}
                  </div>
                  <span>Joined by 3,000+ students nationwide</span>
                </div>
              </Reveal>
            </div>

            {/* Right — preview with rotated sticker */}
            <Reveal delay={200} className="relative">
              {/* sticker */}
              <div
                className={`absolute -left-4 -top-6 z-10 rotate-[-8deg] rounded-2xl border-2 border-[#1a1625] bg-[#c8f135] px-4 py-2 ${hardShadow}`}
              >
                <span className="font-display text-lg font-extrabold text-[#1a1625]">100% FREE</span>
              </div>
              <div className="rotate-1">
                <PlatformPreview />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================ MARQUEE ============================ */}
      <Marquee />

      {/* ============================== STATS ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <Reveal>
          <h2 className="max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight text-[#1a1625] sm:text-5xl">
            Small org. <span className="text-primary">Loud</span> impact.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120}>
              <div
                className={`rounded-3xl border-2 border-[#1a1625] p-8 ${hardShadow} ${
                  stat.lime ? "bg-[#c8f135]" : "bg-white"
                }`}
              >
                <p className="font-display text-6xl font-extrabold tracking-tight text-[#1a1625] sm:text-7xl">
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#1a1625]/70">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ========================= HOW IT WORKS (dark) ========================= */}
      <section className="bg-[#1a1625] py-20 text-[#fbf7ef] sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#c8f135" }}>
              / How it works
            </p>
            <h2 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
              Three steps. Zero gatekeeping.
            </h2>
          </Reveal>

          <div className="mt-14 space-y-px">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.n} delay={i * 120}>
                  <div className="group grid items-center gap-6 border-t border-white/15 py-8 md:grid-cols-[auto_1fr_auto] md:gap-10">
                    <span
                      className="font-display text-6xl font-extrabold leading-none text-transparent sm:text-8xl"
                      style={{ WebkitTextStroke: "1.5px #c8f135" }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-bold sm:text-3xl">{step.title}</h3>
                      <p className="mt-2 max-w-xl text-base leading-relaxed text-white/55">{step.desc}</p>
                    </div>
                    <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 transition-colors group-hover:border-[#c8f135] md:flex">
                      <Icon className="size-6" style={{ color: "#c8f135" }} />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={400}>
            <Link
              href="/opportunities"
              className="mt-12 inline-flex items-center gap-2 rounded-full border-2 px-7 py-3.5 text-base font-bold text-[#1a1625] transition-all hover:opacity-90"
              style={{ background: "#c8f135", borderColor: "#c8f135" }}
            >
              Start browsing
              <ArrowRight className="size-5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ========================= PLATFORM PREVIEW ========================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-primary">/ The platform</p>
            <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-[#1a1625] sm:text-5xl">
              One clean feed of everything worth your time.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#1a1625]/65">
              No spam, no dead links, no endless tabs. Filter by type and location, favorite what
              fits, and export your shortlist in a click.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                { icon: Search, t: "Filter by type, location & more" },
                { icon: Heart, t: "Save favorites and export your list" },
                { icon: Star, t: "Every listing vetted by real students" },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.t} className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl border-2 border-[#1a1625] bg-[#c8f135]">
                      <Icon className="size-4 text-[#1a1625]" />
                    </span>
                    <span className="font-semibold text-[#1a1625]">{f.t}</span>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={160} className="rotate-1">
            <PlatformPreview />
          </Reveal>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div
            className={`mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border-2 border-[#1a1625] bg-primary px-6 py-16 text-center sm:py-24 ${hardShadow}`}
          >
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Free forever · Built by students
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl">
              Your next opportunity is one click away.
            </h2>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                href="/opportunities"
                className={`inline-flex items-center gap-2 rounded-full border-2 border-[#1a1625] bg-[#c8f135] px-8 py-4 text-base font-extrabold text-[#1a1625] ${hardShadow} transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#1a1625]`}
              >
                Get Started
                <ArrowUpRight className="size-5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                About Youdemonia
              </Link>
            </div>
            <p className="mt-8 inline-flex items-center gap-2 font-mono text-xs text-white/60">
              <Users className="size-4" /> Joined by 3,000+ students nationwide
            </p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
