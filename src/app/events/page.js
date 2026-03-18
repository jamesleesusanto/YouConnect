"use client";

import { useEffect, useState } from "react";
import app from "../../../lib/firebase";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { format } from "date-fns";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const db = getFirestore(app);
      try {
        const snap = await getDocs(collection(db, "events"));
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || "").localeCompare(a.date || "")));
      } catch { /* events collection may not exist yet */ }
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Our Events</h1>
        <p className="text-muted-foreground mt-2">Upcoming events, workshops, and community gatherings you can join.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold">No upcoming events</h3>
          <p className="text-sm text-muted-foreground mt-1">Check back soon for new events!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
              {event.image_url ? (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <div className="p-5">
                {event.category && (
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-secondary text-secondary-foreground mb-3">{event.category}</span>
                )}
                <h3 className="font-semibold text-foreground text-lg leading-tight">{event.title}</h3>
                {event.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>}
                <div className="mt-4 space-y-2">
                  {event.date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {(() => { try { return format(new Date(event.date), "MMMM d, yyyy"); } catch { return event.date; } })()}
                      {event.time && ` at ${event.time}`}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {event.location}
                    </div>
                  )}
                </div>
                {event.link && (
                  <a href={event.link} target="_blank" rel="noopener noreferrer" className="block mt-4">
                    <button className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-border/60 text-foreground hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer flex items-center justify-center gap-1">
                      Learn More
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                    </button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
