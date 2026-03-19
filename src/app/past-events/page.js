"use client";

import { useEffect, useState, useMemo } from "react";
import app from "../../../lib/firebase";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Hardcoded past projects — replace or supplement with Firestore data
const SAMPLE_EVENTS = [
  {
    id: "s1", year: 2025, title: "YouConnect Platform Launch",
    description: "Launched the world's first comprehensive opportunity awareness platform, connecting students with hundreds of opportunities across Michigan.",
    image: "", tags: ["Platform", "Launch"],
  },
  {
    id: "s2", year: 2024, title: "Detroit Community Service Fair",
    description: "Organized a community service fair partnering with 15+ Detroit-area nonprofits, reaching over 200 high school students.",
    image: "", tags: ["Event", "Detroit"],
  },
  {
    id: "s3", year: 2024, title: "Opportunity Awareness Workshop Series",
    description: "Hosted a 4-part workshop series educating students on finding and applying for internships, scholarships, and volunteer positions.",
    image: "", tags: ["Workshop", "Education"],
  },
  {
    id: "s4", year: 2023, title: "School Supply Drive",
    description: "Collected and distributed over 500 school supply kits to underserved students in the Detroit metro area.",
    image: "", tags: ["Community Service", "Detroit"],
  },
  {
    id: "s5", year: 2023, title: "Youth Leadership Summit",
    description: "Brought together 100+ high school students for a day of leadership workshops, networking, and community building.",
    image: "", tags: ["Leadership", "Event"],
  },
  {
    id: "s6", year: 2022, title: "Virtual Tutoring Initiative",
    description: "Launched a free virtual tutoring program connecting college mentors with high school students across Southeast Michigan.",
    image: "", tags: ["Education", "Virtual"],
  },
  {
    id: "s7", year: 2021, title: "COVID-19 Relief Drive",
    description: "Organized food and supply drives during the pandemic, delivering essential items to families in need.",
    image: "", tags: ["Community Service", "COVID-19"],
  },
  {
    id: "s8", year: 2020, title: "Youdemonia Founded",
    description: "Nathan George founded Youdemonia with a mission to combat social disparities through community-based events and opportunity awareness.",
    image: "", tags: ["Founding", "Milestone"],
  },
];

export default function PastEventsPage() {
  const [firestoreEvents, setFirestoreEvents] = useState([]);
  const [activeYear, setActiveYear] = useState(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const db = getFirestore(app);
        const snap = await getDocs(collection(db, "past_events"));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setFirestoreEvents(data);
      } catch (e) {
        console.log("No past_events collection yet, using samples.");
      }
    }
    fetchEvents();
  }, []);

  const allEvents = useMemo(() => {
    const combined = [...firestoreEvents, ...SAMPLE_EVENTS];
    // Deduplicate by id
    const seen = new Set();
    return combined.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    }).sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [firestoreEvents]);

  const years = useMemo(() => [...new Set(allEvents.map((e) => e.year))].sort((a, b) => b - a), [allEvents]);

  useEffect(() => {
    if (years.length > 0 && !activeYear) setActiveYear(years[0]);
  }, [years, activeYear]);

  const TAG_COLORS = [
    "bg-purple-100 text-purple-700", "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700", "bg-cyan-100 text-cyan-700",
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Past Events & Projects</h1>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">A look back at the work our team has done to promote opportunity awareness.</p>
      </div>

      {/* Year navigation — sticky horizontal scroll */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-border/40 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-10">
        <div className="flex gap-2 py-3 overflow-x-auto">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => {
                setActiveYear(year);
                document.getElementById(`year-${year}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                activeYear === year
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Events by year */}
      <div className="space-y-16">
        {years.map((year) => {
          const yearEvents = allEvents.filter((e) => e.year === year);
          return (
            <div key={year} id={`year-${year}`} className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-3xl font-bold text-foreground">{year}</h2>
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-sm text-muted-foreground">{yearEvents.length} project{yearEvents.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {yearEvents.map((event, i) => (
                  <div key={event.id} className="bg-white rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    {/* Image or gradient placeholder */}
                    <div className="h-44 bg-gradient-to-br from-primary/10 to-accent/40 relative overflow-hidden">
                      {event.image ? (
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl font-bold text-primary/10">{year}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Tags */}
                      {event.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {event.tags.map((tag, ti) => (
                            <span key={tag} className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${TAG_COLORS[ti % TAG_COLORS.length]}`}>{tag}</span>
                          ))}
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-foreground leading-snug">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
