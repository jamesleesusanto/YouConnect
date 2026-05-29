"use client";

import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState, useRef } from "react";

const CYCLING_WORDS = ["opportunity.", "internship.", "research position.", "job."];

function Typewriter() {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = CYCLING_WORDS[wordIndex];
    let timeout;

    if (!isDeleting && text === currentWord) {
      // Pause at full word
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && text === "") {
      // Move to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    } else if (isDeleting) {
      // Delete characters
      timeout = setTimeout(() => setText(currentWord.substring(0, text.length - 1)), 50);
    } else {
      // Type characters
      timeout = setTimeout(() => setText(currentWord.substring(0, text.length + 1)), 100);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex]);

  return (
    <span className="text-primary">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
}

const FADE_WORDS = [
  { text: "Thousands", cn: "text-primary font-bold", para: 1 },
  { text: "of", cn: "text-foreground font-semibold", para: 1 },
  { text: "resources", cn: "text-foreground font-semibold", para: 1 },
  { text: "are", cn: "text-foreground font-semibold", para: 1 },
  { text: "unused", cn: "text-foreground font-semibold", para: 1 },
  { text: "because", cn: "text-foreground font-semibold", para: 1 },
  { text: "students", cn: "text-primary font-bold", para: 1 },
  { text: "don't", cn: "text-primary font-bold", para: 1 },
  { text: "know", cn: "text-primary font-bold", para: 1 },
  { text: "about", cn: "text-primary font-bold", para: 1 },
  { text: "them.", cn: "text-primary font-bold", para: 1 },
  { text: "At", cn: "text-foreground font-semibold", para: 2 },
  { text: "Youdemonia,", cn: "text-foreground font-semibold", para: 2 },
  { text: "we", cn: "text-foreground font-semibold", para: 2 },
  { text: "work", cn: "text-foreground font-semibold", para: 2 },
  { text: "to", cn: "text-foreground font-semibold", para: 2 },
  { text: "increase", cn: "text-primary font-bold", para: 2 },
  { text: "accessibility", cn: "text-primary font-bold", para: 2 },
  { text: "to", cn: "text-foreground font-semibold", para: 2 },
  { text: "these", cn: "text-foreground font-semibold", para: 2 },
  { text: "resources", cn: "text-foreground font-semibold", para: 2 },
  { text: "through", cn: "text-foreground font-semibold", para: 2 },
  { text: "an", cn: "text-foreground font-semibold", para: 2 },
  { text: "online", cn: "text-foreground font-semibold", para: 2 },
  { text: "platform", cn: "text-foreground font-semibold", para: 2 },
  { text: "for", cn: "text-foreground font-semibold", para: 2 },
  { text: "all", cn: "text-foreground font-semibold", para: 2 },
  { text: "types", cn: "text-foreground font-semibold", para: 2 },
  { text: "of", cn: "text-foreground font-semibold", para: 2 },
  { text: "opportunities.", cn: "text-foreground font-semibold", para: 2 },
];

function ScrollFadeText() {
  const wordRefs = useRef([]);
  const [opacities, setOpacities] = useState(() => FADE_WORDS.map(() => 0.08));

  useEffect(() => {
    let ticking = false;
    const compute = () => {
      ticking = false;
      const vh = window.innerHeight;
      // A word fades from dim -> full as it rises through this band.
      const revealStart = vh * 0.9; // just above the fold
      const revealEnd = vh * 0.45; // middle of the screen
      const next = wordRefs.current.map((el) => {
        if (!el) return 0.08;
        const top = el.getBoundingClientRect().top;
        const p = (revealStart - top) / (revealStart - revealEnd);
        return Math.min(1, Math.max(0.08, p));
      });
      setOpacities(next);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    compute();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const renderWords = (para) =>
    FADE_WORDS.map((w, gi) =>
      w.para !== para ? null : (
        <span
          key={gi}
          ref={(el) => (wordRefs.current[gi] = el)}
          className={w.cn}
          style={{ opacity: opacities[gi], transition: "opacity 0.15s ease-out" }}
        >
          {w.text}{" "}
        </span>
      )
    );

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-2xl sm:text-3xl lg:text-4xl leading-snug">
          {renderWords(1)}
        </div>
        <div className="mt-8 text-2xl sm:text-3xl lg:text-4xl leading-snug font-medium">
          {renderWords(2)}
        </div>
      </div>
    </section>
  );
}

function StrikethroughAnimation() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0); // 0=initial, 1=show weeks white, 2=red bar slides in, 3=seconds appears

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !visible) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [visible]);

  return (
    <span ref={ref} className="inline">
      <span className={`relative inline-block transition-colors duration-700 ${phase >= 2 ? "text-foreground/25" : "text-foreground"}`}>
        weeks
        <span
          className={`absolute left-0 top-[58%] h-[4px] bg-red-500 rounded-full transition-all duration-700 ease-out ${phase >= 2 ? "w-full" : "w-0"}`}
        />
      </span>
      <br />
      <span className={`text-emerald-600 font-bold transition-all duration-700 ${phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        seconds.
      </span>
    </span>
  );
}

function AnimatedNumber({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    const duration = 1800;
    const steps = 60;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}
function SwipeReveal({ children, onComplete, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          setVisible(true);
          // Fire onComplete after the swipe animation finishes (~800ms + delay)
          if (onComplete) setTimeout(onComplete, 800 + delay);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} style={{ overflow: "hidden" }}>
      <div
        style={{
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          opacity: visible ? 1 : 0,
          transition: `transform 0.75s cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity 0.4s ease ${delay}ms`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function HowItWorksRight() {
  const [stepsReady, setStepsReady] = useState(false);

  return (
    <div>
      <SwipeReveal onComplete={() => setStepsReady(true)}>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[var(--font-playfair)] mb-4">
          See how it works.
        </h2>
      </SwipeReveal>
      <SwipeReveal delay={120}>
        <p className="text-white/50 text-lg mb-10 max-w-md leading-relaxed">
          Every opportunity is vetted, organized, and ready for you. Here&apos;s how simple it is.
        </p>
      </SwipeReveal>
      <div className="space-y-6">
        {[
          { step: "1", title: "Browse opportunities", desc: "Search and filter through hundreds of curated opportunities from vetted organizations in your area." },
          { step: "2", title: "Save your favorites", desc: "Favorite the opportunities you love and export them as a list for easy reference." },
          { step: "3", title: "Connect & apply", desc: "Click through to apply or learn more directly from the organization. No middleman." },
        ].map((item, i) => (
          <div
            key={item.step}
            style={{
              opacity: stepsReady ? 1 : 0,
              transform: stepsReady ? "translateY(0)" : "translateY(16px)",
              transition: `opacity 0.6s ease ${i * 220}ms, transform 0.6s ease ${i * 220}ms`,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold text-white">{item.step}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-white/40 text-sm mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <Link href="/opportunities" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition text-base">
          Start Browsing
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="bg-gradient-to-b from-[#f3efff] via-[#faf8ff] to-[#f3efff]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/40" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/40 rounded-full blur-2xl" />
        <div className="absolute top-[40%] left-[60%] w-96 h-96 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute top-10 left-[30%] w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-44 relative sm:pt-32 sm:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent border border-primary/20 text-sm font-medium text-accent-foreground mb-6">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              Built by students, for students
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1] font-[var(--font-playfair)]">
              Find your next
              <br />
              <Typewriter />
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mt-6 leading-relaxed max-w-xl">
              Youdemonia connects you with local internships,
              workshops, and volunteering events — all in your area.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Link href="/opportunities" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all text-base">
                Browse Opportunities
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 border border-border/60 text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-muted transition-all text-base">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                I&apos;m an Organizer
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ScrollFadeText />

      {/* YOUDEMONIA Definition + Stats — two column layout */}
      <section className="relative py-20 sm:py-35 overflow-hidden">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Impact stats — single horizontal row */}
          <div className="mb-16">
            <h2 className="px-4 sm:px-8 text-3xl sm:text-4xl font-bold tracking-tight font-[var(--font-playfair)] text-foreground mb-8">The Numbers Speak For Themselves</h2>
            <div className="grid grid-cols-3 divide-x-2 divide-primary/40">
              {[
                { label: "Communities", value: "500", suffix: "+" },
                { label: "Opportunities", value: "120", suffix: "+" },
                { label: "Students Reached", value: "3000", suffix: "+" },
              ].map((s) => (
                <div key={s.label} className="text-left px-4 sm:px-8">
                  <p className="text-4xl sm:text-6xl font-bold text-violet-800 tracking-tight font-[var(--font-playfair)]"><AnimatedNumber target={s.value} suffix={s.suffix} /></p>
                  <p className="text-base sm:text-lg text-muted-foreground mt-2 leading-relaxed">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Definition card with depth effect */}
          {/* <div className="relative max-w-3xl mx-auto">
              
              <div className="absolute inset-[-8px] rounded-[28px] bg-gradient-to-br from-border/30 via-border/20 to-border/10 z-0" />
              <div className="absolute inset-[-3px] rounded-[26px] bg-white/60 z-0" />

              <div className="relative bg-white rounded-3xl border border-primary/15 shadow-lg p-10 sm:p-14 z-10">
                
                <div className="absolute top-0 left-10 right-10 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-b-full" />

                <div className="flex items-center gap-4 mb-2 mt-2">
                  <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight uppercase">YOUDEMONIA</h2>
                  <div className="flex gap-2">
                    <a href="https://linkedin.com/company/youdemonia1" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </a>
                    <a href="https://instagram.com/youdemonia_org/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                    </a>
                  </div>
                </div>

                <p className="text-lg mb-8">
                  <span className="font-mono text-foreground/80">you–de–mon–ia</span>{" "}
                  <span className="text-primary italic">noun</span>
                </p>

                <div className="space-y-5 text-[15px] leading-relaxed text-foreground">
                  <p>
                    Youdemonia is a fully student-run, registered{" "}
                    <span className="text-primary font-semibold">501(c)(3) Not For Profit Organization</span>,
                    aimed at promoting opportunity awareness. Through our{" "}
                    <Link href="/opportunities" className="text-primary font-semibold hover:underline">YouConnect Platform</Link>,
                    and hosted community events, we hope to educate the next generation of leaders and provide
                    another resource for students to{" "}
                    <span className="text-primary font-semibold">leverage for success</span>.
                  </p>
                </div>

                <p className="text-primary font-bold italic text-lg sm:text-xl mt-8 text-center">
                  We offer the world&apos;s first comprehensive opportunity platform!
                </p>

                <div className="text-center mt-8">
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-primary/30 text-primary font-semibold hover:bg-primary hover:text-white transition-all text-base"
                  >
                    About Us
                  </Link>
                </div>
              </div>
            </div> */}
          </div>
      </section>

      {/* Platform Preview + How It Works — dark section */}
      <section className="bg-gradient-to-br from-[#0f1f2e] via-[#141b30]/95 to-[#1e1545]/80 text-white pt-40 pb-20 sm:pt-32 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left — Platform preview mockup */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 pt-4 pb-3 border-b border-border/40">
                <span className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-semibold">Platform</span>
                <span className="px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground">Favorites</span>
                <span className="px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground">Export</span>
              </div>
              {/* Mock content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">YouConnect Platform</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-lg bg-muted text-xs text-muted-foreground">All Types</span>
                    <span className="px-3 py-1 rounded-lg bg-muted text-xs text-muted-foreground">Location</span>
                  </div>
                </div>
                {/* Table rows */}
                <div className="space-y-2">
                  {[
                    { name: "Youth Leadership Summit", type: "Workshop", org: "City Council", loc: "Philadelphia, PA" },
                    { name: "STEM Research Internship", type: "Internship", org: "Penn Labs", loc: "Philadelphia, PA" },
                    { name: "Community Garden Build", type: "Volunteering", org: "Green Philly", loc: "Philadelphia, PA" },
                    { name: "College Prep Workshop", type: "Workshop", org: "Youdemonia", loc: "Detroit, MI" },
                    { name: "Coding Bootcamp", type: "Education", org: "TechBridge", loc: "Remote" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition text-foreground">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.org}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary shrink-0">{row.type}</span>
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{row.loc}</span>
                      <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 text-center">Showing 5 of 120+ opportunities</p>
              </div>
            </div>

            {/* Right — How It Works steps */}
            <HowItWorksRight />
          </div>
        </div>
      </section>

      {/* Built for students — strikethrough animation */}

      {/* <section className="text-foreground py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            <div className="text-center md:text-left md:pl-12">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] font-[var(--font-playfair)]">
                Built for students who need opportunities in{" "}
                <StrikethroughAnimation />
              </h2>
              <p className="text-muted-foreground mt-6 text-lg max-w-lg leading-relaxed">
                Youdemonia skips the hassle and pairs you with curated opportunities happening in your local area, giving the resources you need.
              </p>
            </div>
            
            <div className="hidden md:block">
            </div>
          </div>
        </div>
      </section> */}



      {/* Fading text section */}
      {/* <section className="py-20 sm:py-28 bg-gradient-to-b from-[#faf9ff] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xl sm:text-2xl leading-relaxed font-medium">
            <span className="text-primary font-semibold">Thousands</span>
            <span className="text-foreground"> of resources are unused because </span>
            <span className="text-primary font-semibold">students don&apos;t know about them</span><span className="text-foreground/60">.</span>
          </div>
          <div className="mt-8 text-xl sm:text-2xl leading-relaxed font-medium">
            <span className="text-foreground/50">At Youdemonia, we work to </span>
            <span className="text-primary/70 font-semibold">increase accessibility</span>
            <span className="text-foreground/40"> to these resources through an online platform for all types of opportunities.</span>
          </div>
        </div>
      </section> */}

      {/* How It Works */}
      {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight font-[var(--font-playfair)]">How It Works</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Three simple steps to find the right community opportunity.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Browse", desc: "Search and filter through hundreds of curated opportunities from vetted organizations.", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
            { step: "02", title: "Save", desc: "Favorite the opportunities you love and export them for easy reference.", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
            { step: "03", title: "Connect", desc: "Click through to apply or learn more directly from the organization.", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          ].map((item) => (
            <div key={item.step} className="relative">
              <span className="text-7xl font-bold text-primary/5 absolute -top-6 -left-2">{item.step}</span>
              <div className="relative bg-white rounded-2xl border border-border/40 p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section> */}

      {/* Photo Gallery Cards */}
      {/* <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">

            <Link href="/team" className="group relative bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm hover:shadow-lg transition-all">
              <div className="flex flex-wrap gap-2 p-4 pb-0">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white">Career Symposium</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">Community Events</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">#Youdemonia</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground mb-3">2023 Youth Career Symposium</h3>
                <div className="h-48 bg-accent/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center">
                    <span className="text-6xl font-black text-primary/10 rotate-90 whitespace-nowrap">PHOTOS</span>
                  </div>
                  <div className="flex gap-2 p-3">
                    <div className="w-32 h-32 bg-primary/10 rounded-lg flex items-center justify-center"><svg className="w-10 h-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    <div className="w-32 h-32 bg-primary/10 rounded-lg flex items-center justify-center"><svg className="w-10 h-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  </div>
                </div>
                <p className="text-primary font-semibold text-sm mt-3 underline group-hover:text-primary/80">Meet The Team</p>
              </div>
            </Link>


            <Link href="/events" className="group relative bg-accent/60 rounded-2xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-lg transition-all">
              <div className="flex flex-wrap gap-2 p-4 pb-0">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white">Career Symposium</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">Community Events</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">#Youdemonia</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground mb-3">Youdemonia @ Community Events</h3>
                <div className="h-48 bg-white/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center">
                    <span className="text-6xl font-black text-primary/10 rotate-90 whitespace-nowrap">PHOTOS</span>
                  </div>
                  <div className="flex gap-2 p-3">
                    <div className="w-32 h-32 bg-primary/10 rounded-lg flex items-center justify-center"><svg className="w-10 h-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    <div className="w-32 h-32 bg-primary/10 rounded-lg flex items-center justify-center"><svg className="w-10 h-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  </div>
                </div>
                <p className="text-primary font-semibold text-sm mt-3 underline group-hover:text-primary/80">Our Events</p>
              </div>
            </Link>


            <a href="https://www.instagram.com/youdemonia_org/" target="_blank" rel="noopener noreferrer" className="group relative bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm hover:shadow-lg transition-all">
              <div className="flex flex-wrap gap-2 p-4 pb-0">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">Career Symposium</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">Community Events</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">#Youdemonia</span>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground mb-3">#Youdemonia!</h3>
                <div className="h-48 bg-accent/50 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center">
                    <span className="text-6xl font-black text-primary/10 rotate-90 whitespace-nowrap">PHOTOS</span>
                  </div>
                  <div className="w-36 h-36 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-black text-primary/40">YD</span>
                  </div>
                </div>
                <p className="text-primary font-semibold text-sm mt-3 underline group-hover:text-primary/80">Support Youdemonia!</p>
              </div>
            </a>
          </div>
        </div>
      </section> */}

{/* 
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight font-[var(--font-playfair)]">Ready to make an impact?</h2>
          <p className="mt-3 text-primary-foreground/70 max-w-md mx-auto">
            Join thousands of students discovering meaningful community opportunities.
          </p>
          <Link href="/opportunities" className="inline-flex items-center gap-2 mt-6 bg-secondary text-secondary-foreground font-semibold px-8 py-3 rounded-xl text-base hover:opacity-90 transition">
            Get Started
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </section> */}
    </div>
  );
}
