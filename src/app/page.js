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
      <span className={`relative inline-block transition-colors duration-700 ${phase >= 2 ? "text-white/25" : "text-white"}`}>
        weeks
        <span
          className={`absolute left-0 top-[58%] h-[4px] bg-red-500 rounded-full transition-all duration-700 ease-out ${phase >= 2 ? "w-full" : "w-0"}`}
        />
      </span>
      <br />
      <span className={`text-emerald-400 font-bold transition-all duration-700 ${phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
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

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/40" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/40 rounded-full blur-2xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-44 relative">
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

      {/* Built for students — strikethrough animation */}
      <section className="bg-[#0f1729] text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left side — text */}
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.15] font-[var(--font-playfair)]">
                Built for students who need opportunities in{" "}
                <StrikethroughAnimation />
              </h2>
              <p className="text-white/50 mt-6 text-lg max-w-lg leading-relaxed">
                Youdemonia skips the hassle and pairs you with curated opportunities happening in your local area, giving the resources you need.
              </p>
            </div>
            {/* Right side — reserved for future content */}
            <div className="hidden md:block">
            </div>
          </div>
        </div>
      </section>

      {/* YOUDEMONIA Definition + Stats — two column layout */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary/8 rounded-full -translate-x-1/2 -translate-y-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — stacked stat cards with one continuous decorative curve */}
            <div className="relative hidden lg:block" style={{ minHeight: 520 }}>
              {/* Single continuous light purple curve connecting all three cards */}
              <svg className="absolute top-[60px] left-[60px] w-[300px] h-[420px] z-0" viewBox="0 0 300 420" fill="none">
                <path d="M40 10 C120 40, 220 80, 240 160 C260 240, 100 280, 80 340 C60 400, 140 420, 200 400" stroke="#c4b5fd" strokeWidth="10" strokeLinecap="round" fill="none" />
              </svg>

              {/* Card 1 — top left */}
              <div className="absolute top-0 left-0 w-[190px] bg-white rounded-2xl border border-border/60 p-5 shadow-sm text-center z-10">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <p className="text-3xl font-bold text-foreground"><AnimatedNumber target="500" suffix="+" /></p>
                <p className="text-xs text-muted-foreground mt-1">Communities</p>
              </div>

              {/* Card 2 — middle right */}
              <div className="absolute top-[190px] left-[200px] w-[190px] bg-white rounded-2xl border border-border/60 p-5 shadow-md text-center z-10">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <p className="text-3xl font-bold text-foreground"><AnimatedNumber target="120" suffix="+" /></p>
                <p className="text-xs text-muted-foreground mt-1">Opportunities</p>
              </div>

              {/* Card 3 — bottom left */}
              <div className="absolute top-[380px] left-[40px] w-[190px] bg-white rounded-2xl border border-border/60 p-5 shadow-sm text-center z-10">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <p className="text-3xl font-bold text-foreground"><AnimatedNumber target="3000" suffix="+" /></p>
                <p className="text-xs text-muted-foreground mt-1">Students Reached</p>
              </div>
            </div>

            {/* Mobile stats fallback — horizontal row */}
            <div className="lg:hidden grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Communities", value: "500", suffix: "+", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                { label: "Opportunities", value: "120", suffix: "+", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { label: "Students Reached", value: "3000", suffix: "+", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
              ].map((s) => (
                <div key={s.label} className="text-center border border-border/60 rounded-2xl bg-white p-4">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                  </div>
                  <p className="text-2xl font-bold text-foreground"><AnimatedNumber target={s.value} suffix={s.suffix} /></p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Right — Definition card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-border/40 shadow-lg p-10 sm:p-14">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight uppercase">YOUDEMONIA</h2>
                <div className="flex gap-2">
                  <a href="https://linkedin.com/company/youdemonia1" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition">
                    <svg className="w-4 h-4 text-foreground/70" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  <a href="https://instagram.com/youdemonia_org/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition">
                    <svg className="w-4 h-4 text-foreground/70" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
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
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-foreground/20 text-foreground font-semibold hover:bg-foreground hover:text-white transition-all text-base"
                >
                  About Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
      </section>

      {/* Photo Gallery Cards */}
      <section className="bg-accent/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1: Career Symposium / Meet The Team */}
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

            {/* Card 2: Community Events */}
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

            {/* Card 3: #Youdemonia / Support */}
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
      </section>

      {/* CTA */}
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
      </section>
    </div>
  );
}
