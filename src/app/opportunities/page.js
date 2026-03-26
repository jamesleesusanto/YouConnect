"use client";

import { useEffect, useState, useMemo } from "react";
import app from "../../../lib/firebase";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";
import { format } from "date-fns";

function trackClick(oppId, clickType) {
  try {
    const db = getFirestore(app);
    addDoc(collection(db, "clicks"), {
      opportunity_id: oppId,
      type: clickType, // "more_info" or "learn_more"
      timestamp: new Date().toISOString(),
    });
  } catch (e) { /* silent fail */ }
}

const TYPE_STYLES = {
  Internship: "bg-blue-50 text-blue-700 border border-blue-200",
  Workshop: "bg-amber-50 text-amber-700 border border-amber-200",
  Event: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Volunteering: "bg-purple-50 text-purple-700 border border-purple-200",
};
const TAG_COLORS = {
  Healthcare: "bg-red-100 text-red-700", Activism: "bg-pink-100 text-pink-700",
  Business: "bg-blue-100 text-blue-700", Humanities: "bg-violet-100 text-violet-700",
  Education: "bg-teal-100 text-teal-700", Environment: "bg-lime-100 text-green-700",
  "Community Service": "bg-orange-100 text-orange-700", STEM: "bg-cyan-100 text-cyan-700",
  Community: "bg-orange-100 text-orange-700",
};
const INDUSTRIES = ["Healthcare", "Activism", "Business", "Humanities", "Education", "Environment", "Community Service", "STEM"];
const AGE_GROUPS = ["Youth", "High School", "College"];
const TYPES = ["Internship", "Workshop", "Event", "Volunteering"];

export default function PlatformPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", industries: [], ageGroups: [], types: [] });
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("youdemonia_favorites");
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpp, setModalOpp] = useState(null);
  const [imgOrientation, setImgOrientation] = useState("landscape");
  const [enlargeImg, setEnlargeImg] = useState(false);
  const [locationSort, setLocationSort] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [zipModalOpen, setZipModalOpen] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [geoCache, setGeoCache] = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("youconnect_geocache") || "{}"); } catch { return {}; }
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [perPage, setPerPage] = useState(25);

  // Haversine distance in miles
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async function geocode(location) {
    if (!location) return null;
    const key = location.trim().toLowerCase();
    if (geoCache[key]) return geoCache[key];
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1&countrycodes=us`);
      const data = await res.json();
      if (data && data[0]) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        const newCache = { ...geoCache, [key]: coords };
        setGeoCache(newCache);
        localStorage.setItem("youconnect_geocache", JSON.stringify(newCache));
        return coords;
      }
    } catch (e) { /* silent */ }
    return null;
  }

  async function enableLocationSort() {
    if (!zipInput) return;
    setGeoLoading(true);
    const coords = await geocode(zipInput);
    if (!coords) { alert("Could not find that zip code. Please try again."); setGeoLoading(false); return; }
    setUserCoords(coords);
    // Geocode all opportunity zip codes (much more accurate than city names)
    for (const opp of opportunities) {
      if (opp.location_mode === "Remote") continue;
      const zipKey = opp.zip || "";
      const locKey = zipKey || opp.location;
      if (locKey && !geoCache[locKey.trim().toLowerCase()]) {
        await geocode(locKey);
        await new Promise((r) => setTimeout(r, 1100));
      }
    }
    setLocationSort(true);
    setZipModalOpen(false);
    setGeoLoading(false);
  }

  function openModal(opp) {
    setModalOpp(opp);
    setEnlargeImg(false);
    trackClick(opp.id, "more_info");
    if (opp.image_url) {
      const img = new window.Image();
      img.onload = () => setImgOrientation(img.width >= img.height ? "landscape" : "portrait");
      img.src = opp.image_url;
    } else {
      setImgOrientation("landscape");
    }
  }

  useEffect(() => {
    async function fetchData() {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, "opportunities"));
      const data = snap.docs.map((d) => {
        const raw = d.data();
        let tags = raw.tags || [];
        if (!Array.isArray(tags) && typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        if (tags.length === 0 && raw["Industry Tags"]) tags = raw["Industry Tags"].split(",").map((t) => t.trim()).filter(Boolean);
        return {
          id: d.id,
          name: raw["What is the name of your opportunity?"] || raw.name || "",
          opportunity_type: raw["Opportunity Type"] || raw.opportunity_type || "",
          organization: raw["Organization Name"] || raw.organization || "",
          location: raw.city && raw.state ? `${raw.city}, ${raw.state}` : (raw["City, State"] || raw.location || ""),
          zip: raw.zip || "",
          date: raw["EventDateTime"] ? raw["EventDateTime"].split(" ")[0] : (raw.date || ""),
          time: raw.time || "",
          industry: raw.industry || "",
          age_group: Array.isArray(raw.age_group) ? raw.age_group : (raw.age_group ? [raw.age_group] : []),
          tags, description: raw["Detailed description of the event"] || raw.description || "",
          link: raw.link || "", contact_email: raw["E-mail Address"] || raw.contact_email || "",
          location_mode: raw.location_mode || (raw["Is the opportunity remote or in-person"] === "Remote" ? "Remote" : "In-Person"),
          image_url: raw.image_url || raw.media_url || "",
          recurring_dates: raw.recurring_dates || [],
          timezone: raw.timezone || "",
        };
      });
      setOpportunities(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("youdemonia_favorites", JSON.stringify([...next]));
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = opportunities;
    if (showFavorites) result = result.filter((o) => favorites.has(o.id));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((o) =>
        o.name?.toLowerCase().includes(q) || o.organization?.toLowerCase().includes(q) ||
        o.location?.toLowerCase().includes(q) || o.industry?.toLowerCase().includes(q) ||
        o.opportunity_type?.toLowerCase().includes(q) || o.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters.industries.length > 0) result = result.filter((o) => filters.industries.some((f) => o.industry === f || o.tags?.includes(f)));
    if (filters.ageGroups.length > 0) result = result.filter((o) => {
      const oAges = Array.isArray(o.age_group) ? o.age_group : (o.age_group ? [o.age_group] : []);
      return filters.ageGroups.some((f) => oAges.includes(f));
    });
    if (filters.types.length > 0) result = result.filter((o) => filters.types.includes(o.opportunity_type));
    // Distance sorting
    if (locationSort && userCoords) {
      result = result.map((o) => {
        if (o.location_mode === "Remote") return { ...o, _dist: 99999 };
        const locKey = (o.zip || o.location || "").trim().toLowerCase();
        const coords = locKey ? geoCache[locKey] : null;
        const dist = coords ? haversine(userCoords.lat, userCoords.lng, coords.lat, coords.lng) : 99998;
        return { ...o, _dist: dist };
      }).sort((a, b) => a._dist - b._dist);
    }
    return result;
  }, [opportunities, filters, favorites, showFavorites, locationSort, userCoords, geoCache]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => { setPage(1); }, [filters, showFavorites]);

  // Email modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const downloadFavoritesCSV = () => {
    const favOpps = opportunities.filter((o) => favorites.has(o.id));
    if (favOpps.length === 0) return;
    const csv = [["Name", "Type", "Organization", "Location", "Date", "Tags", "Link"].join(","),
      ...favOpps.map((o) => [o.name, o.opportunity_type, o.organization, o.location, o.date, (o.tags || []).join("; "), o.link].map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "youdemonia-favorites.csv"; a.click();
  };

  const sendFavoritesEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) { setEmailError("Please enter a valid email."); return; }
    const favOpps = opportunities.filter((o) => favorites.has(o.id));
    if (favOpps.length === 0) { setEmailError("No favorites to send."); return; }
    setEmailSending(true);
    setEmailError("");
    try {
      const res = await fetch("/api/send-favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailInput,
          favorites: favOpps.map((o) => ({
            name: o.name, opportunity_type: o.opportunity_type, organization: o.organization,
            location: o.location, date: o.date, tags: o.tags, link: o.link,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");
      setEmailSent(true);
    } catch (err) {
      setEmailError(err.message || "Failed to send email.");
    }
    setEmailSending(false);
  };

  const hasFilters = filters.search || filters.industries.length > 0 || filters.ageGroups.length > 0 || filters.types.length > 0;

  function toggleFilter(key, value) {
    setFilters((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  }

  function renderLocation(opp) {
    if (opp.location_mode === "Remote") return (
      <span className="inline-flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        Remote
      </span>
    );
    if (opp.location_mode === "Hybrid") return <span>{opp.location || "TBD"} or Online</span>;
    return opp.location ? <span>{opp.location}</span> : null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">YouConnect Platform</h1>
        <p className="text-muted-foreground mt-2">Discover opportunities with nonprofits and community organizations.</p>
      </div>

      {/* Filters — hover dropdowns with checkboxes */}
      <div className="space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search by name, location, industry, or organization..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full pl-12 pr-4 h-12 text-base bg-white border border-border/60 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-[system-ui]" />
        </div>

        <div className="flex flex-wrap items-start gap-3">
          {/* Industry dropdown */}
          <div className="relative group">
            <button className={`h-10 px-4 rounded-lg text-sm font-medium border transition cursor-pointer inline-flex items-center gap-2 ${filters.industries.length > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
              <span className="text-xs font-bold uppercase tracking-wide">Industry</span>
              {filters.industries.length > 0 && <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{filters.industries.length}</span>}
              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 pt-2 z-40 hidden group-hover:block">
              <div className="bg-white border border-border/60 rounded-xl shadow-lg p-2 w-56">
              <div className="flex justify-end mb-1">
                <button onClick={() => setFilters((p) => ({ ...p, industries: p.industries.length === INDUSTRIES.length ? [] : [...INDUSTRIES] }))} className="text-[11px] text-primary hover:underline cursor-pointer font-medium">
                  {filters.industries.length === INDUSTRIES.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {INDUSTRIES.map((i) => {
                const sel = filters.industries.includes(i);
                return (
                  <label key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? "bg-primary border-primary" : "border-border"}`}>
                      {sel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-sm text-foreground">{i}</span>
                    <input type="checkbox" checked={sel} onChange={() => toggleFilter("industries", i)} className="hidden" />
                  </label>
                );
              })}
              </div>
            </div>
          </div>

          {/* Age Group dropdown */}
          <div className="relative group">
            <button className={`h-10 px-4 rounded-lg text-sm font-medium border transition cursor-pointer inline-flex items-center gap-2 ${filters.ageGroups.length > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
              <span className="text-xs font-bold uppercase tracking-wide">Age Group</span>
              {filters.ageGroups.length > 0 && <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{filters.ageGroups.length}</span>}
              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 pt-2 z-40 hidden group-hover:block">
              <div className="bg-white border border-border/60 rounded-xl shadow-lg p-2 w-48">
              <div className="flex justify-end mb-1">
                <button onClick={() => setFilters((p) => ({ ...p, ageGroups: p.ageGroups.length === AGE_GROUPS.length ? [] : [...AGE_GROUPS] }))} className="text-[11px] text-primary hover:underline cursor-pointer font-medium">
                  {filters.ageGroups.length === AGE_GROUPS.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {AGE_GROUPS.map((a) => {
                const sel = filters.ageGroups.includes(a);
                return (
                  <label key={a} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? "bg-primary border-primary" : "border-border"}`}>
                      {sel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-sm text-foreground">{a}</span>
                    <input type="checkbox" checked={sel} onChange={() => toggleFilter("ageGroups", a)} className="hidden" />
                  </label>
                );
              })}
              </div>
            </div>
          </div>

          {/* Type dropdown */}
          <div className="relative group">
            <button className={`h-10 px-4 rounded-lg text-sm font-medium border transition cursor-pointer inline-flex items-center gap-2 ${filters.types.length > 0 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
              <span className="text-xs font-bold uppercase tracking-wide">Type</span>
              {filters.types.length > 0 && <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{filters.types.length}</span>}
              <svg className="w-3.5 h-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute top-full left-0 pt-2 z-40 hidden group-hover:block">
              <div className="bg-white border border-border/60 rounded-xl shadow-lg p-2 w-48">
              <div className="flex justify-end mb-1">
                <button onClick={() => setFilters((p) => ({ ...p, types: p.types.length === TYPES.length ? [] : [...TYPES] }))} className="text-[11px] text-primary hover:underline cursor-pointer font-medium">
                  {filters.types.length === TYPES.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              {TYPES.map((t) => {
                const sel = filters.types.includes(t);
                return (
                  <label key={t} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? "bg-primary border-primary" : "border-border"}`}>
                      {sel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-sm text-foreground">{t}</span>
                    <input type="checkbox" checked={sel} onChange={() => toggleFilter("types", t)} className="hidden" />
                  </label>
                );
              })}
              </div>
            </div>
          </div>

          {hasFilters && (
            <button onClick={() => setFilters({ search: "", industries: [], ageGroups: [], types: [] })} className="h-10 text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer px-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>Clear all
            </button>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 mt-6 mb-4">
        {/* Location sorting toggle */}
        <button onClick={() => {
          if (locationSort) { setLocationSort(false); }
          else { setZipModalOpen(true); }
        }} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition ${locationSort ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {locationSort ? `Sorted by distance from ${zipInput}` : "Sort by Distance"}
        </button>

        <button onClick={() => setShowFavorites(!showFavorites)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition ${showFavorites ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
          <svg className={`w-4 h-4 ${showFavorites ? "fill-white" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          Favorites ({favorites.size})
        </button>
        {favorites.size > 0 && (
          <>
            <button onClick={downloadFavoritesCSV} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border/60 bg-white hover:bg-muted cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download CSV
            </button>
            <button onClick={() => { setEmailModalOpen(true); setEmailSent(false); setEmailError(""); }} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-primary bg-primary text-white hover:bg-primary/90 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Email Favorites
            </button>
          </>
        )}
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} opportunities</span>
      </div>

      {/* Table — cells use word-break for long text */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : paged.length === 0 ? (
        <div className="text-center py-16"><h3 className="text-lg font-semibold text-foreground">No opportunities found</h3><p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col style={{ width: "3%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "7%" }} />
              </colgroup>
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-3 text-left font-bold text-sm"></th>
                  <th className="px-3 py-3 text-left font-bold text-sm">Opportunity</th>
                  <th className="px-3 py-3 text-left font-bold text-sm">Type</th>
                  <th className="px-3 py-3 text-left font-bold text-sm">Organization</th>
                  <th className="px-3 py-3 text-left font-bold text-sm">Location</th>
                  <th className="px-3 py-3 text-left font-bold text-sm">Date</th>
                  <th className="px-3 py-3 text-left font-bold text-sm">Tags</th>
                  <th className="px-3 py-3 text-center font-bold text-sm whitespace-nowrap">More&nbsp;Info</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((opp) => (
                  <tr key={opp.id} className="group border-b border-border/40 hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleFavorite(opp.id)} className="p-1 rounded-lg hover:bg-muted transition cursor-pointer">
                        <svg className={`w-4 h-4 transition-all ${favorites.has(opp.id) ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-foreground"}`} fill={favorites.has(opp.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-3 py-3 font-bold text-foreground text-sm break-words">{opp.name}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${TYPE_STYLES[opp.opportunity_type] || "bg-gray-100 text-gray-700"}`}>{opp.opportunity_type}</span>
                    </td>
                    <td className="px-3 py-3 text-foreground text-sm break-words">{opp.organization}</td>
                    <td className="px-3 py-3 text-foreground text-sm break-words">{renderLocation(opp)}</td>
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">
                      {opp.date && (() => { try { return format(new Date(opp.date), "MMM d, yyyy"); } catch { return opp.date; } })()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-nowrap gap-1">
                        {opp.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${TAG_COLORS[tag] || "bg-secondary text-secondary-foreground"}`}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => openModal(opp)} className="p-1.5 rounded-lg text-primary hover:bg-accent transition cursor-pointer" title="View details">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            {[25, 50, 100].map((n) => (
              <button key={n} onClick={() => { setPerPage(n); setPage(1); }}
                className={`px-3 py-1.5 text-sm font-medium cursor-pointer transition ${perPage === n ? "bg-primary text-white" : "bg-white text-foreground hover:bg-muted"} ${n !== 25 ? "border-l border-border/60" : ""}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{filtered.length > 0 ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} of ${filtered.length}` : "0 results"}</span>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/60 bg-white hover:bg-muted disabled:opacity-30 cursor-pointer transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-border/60 bg-white hover:bg-muted disabled:opacity-30 cursor-pointer transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Enlarge image overlay */}
      {enlargeImg && modalOpp?.image_url && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 cursor-pointer" onClick={() => setEnlargeImg(false)}>
          <img src={modalOpp.image_url} alt={modalOpp.name} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          <button onClick={() => setEnlargeImg(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white cursor-pointer">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpp(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpp(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-foreground cursor-pointer z-20 shadow-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex">
              {/* Info */}
              <div className={`overflow-y-auto max-h-[85vh] p-8 sm:p-10 ${modalOpp.image_url ? "flex-1 min-w-0" : "w-full"}`}>
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold mb-3 ${TYPE_STYLES[modalOpp.opportunity_type] || "bg-gray-100 text-gray-700"}`}>{modalOpp.opportunity_type}</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{modalOpp.name}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mt-6">
                  <div><p className="text-xs font-semibold text-primary uppercase tracking-wide">Organization</p><p className="text-sm text-foreground mt-0.5">{modalOpp.organization}</p></div>
                  <div><p className="text-xs font-semibold text-primary uppercase tracking-wide">Age Group</p><p className="text-sm text-foreground mt-0.5">{Array.isArray(modalOpp.age_group) ? modalOpp.age_group.join(", ") : (modalOpp.age_group || "All Ages")}</p></div>
                  <div><p className="text-xs font-semibold text-primary uppercase tracking-wide">Location</p><p className="text-sm text-foreground mt-0.5 flex items-center gap-1">{modalOpp.location_mode === "Remote" ? (<><svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Remote</>) : modalOpp.location_mode === "Hybrid" ? <>{modalOpp.location} or Online</> : modalOpp.location || "TBD"}</p></div>
                  <div><p className="text-xs font-semibold text-primary uppercase tracking-wide">Industry</p><div className="flex flex-wrap gap-1 mt-1">{modalOpp.tags?.map((tag) => <span key={tag} className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${TAG_COLORS[tag] || "bg-secondary text-secondary-foreground"}`}>{tag}</span>)}{(!modalOpp.tags || modalOpp.tags.length === 0) && <span className="text-sm text-muted-foreground">—</span>}</div></div>
                  {modalOpp.date && (<div><p className="text-xs font-semibold text-primary uppercase tracking-wide">Date & Time</p><p className="text-sm text-foreground mt-0.5">{(() => { try { return format(new Date(modalOpp.date), "MMMM d, yyyy"); } catch { return modalOpp.date; } })()}{modalOpp.time && ` at ${modalOpp.time}`}{modalOpp.timezone && ` ${modalOpp.timezone}`}</p></div>)}
                  {modalOpp.contact_email && (<div><p className="text-xs font-semibold text-primary uppercase tracking-wide">Contact</p><p className="text-sm text-foreground mt-0.5">{modalOpp.contact_email}</p></div>)}
                </div>
                {modalOpp.recurring_dates?.length > 0 && (<div className="mt-5"><p className="text-xs font-semibold text-primary uppercase tracking-wide">Recurring Dates</p><div className="flex flex-wrap gap-2 mt-1">{modalOpp.recurring_dates.map((d) => (<span key={d} className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-accent text-accent-foreground border border-primary/10">{(() => { try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; } })()}</span>))}</div></div>)}
                {modalOpp.description && (<div className="mt-5"><p className="text-xs font-semibold text-primary uppercase tracking-wide">Description</p><p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{modalOpp.description}</p></div>)}
                {modalOpp.link && (<a href={modalOpp.link.startsWith("http") ? modalOpp.link : `https://${modalOpp.link}`} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(modalOpp.id, "learn_more")} className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition">Learn More / Apply<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>)}
              </div>
              {/* Right side image panel — all images go here */}
              {modalOpp.image_url && (
                <div className="hidden sm:flex w-[320px] shrink-0 bg-muted/30 items-center justify-center rounded-r-2xl overflow-hidden relative cursor-pointer" onClick={(e) => { e.stopPropagation(); setEnlargeImg(true); }}>
                  <img src={modalOpp.image_url} alt={modalOpp.name} onClick={(e) => { e.stopPropagation(); setEnlargeImg(true); }} className="w-full h-full object-contain p-2 cursor-pointer hover:opacity-90 transition" />
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white text-xs font-medium flex items-center gap-1.5 transition pointer-events-none">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    Enlarge
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Favorites Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEmailModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setEmailModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/10 flex items-center justify-center text-foreground cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {emailSent ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-foreground">Email Sent!</h3>
                <p className="text-sm text-muted-foreground mt-1">Your favorites have been sent to <span className="font-medium text-foreground">{emailInput}</span></p>
                <button onClick={() => setEmailModalOpen(false)} className="mt-6 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm cursor-pointer hover:bg-primary/90 transition">
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Email Favorites</h3>
                    <p className="text-sm text-muted-foreground">Send your {favorites.size} saved opportunities to any email.</p>
                  </div>
                </div>

                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setEmailError(""); }}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-[system-ui]"
                  onKeyDown={(e) => { if (e.key === "Enter") sendFavoritesEmail(); }}
                />

                {emailError && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {emailError}
                  </p>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEmailModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={sendFavoritesEmail} disabled={emailSending} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition flex items-center justify-center gap-2">
                    {emailSending ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Send</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Zip Code Modal */}
      {zipModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setZipModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setZipModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/10 flex items-center justify-center text-foreground cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Sort by Distance</h3>
                <p className="text-sm text-muted-foreground">Enter your zip code to sort opportunities by distance.</p>
              </div>
            </div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wide mb-1.5">Zip Code</label>
            <input
              type="text"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value.replace(/\D/g, "").substring(0, 5))}
              placeholder="e.g. 48167"
              className="w-full px-4 py-3 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-[system-ui]"
              onKeyDown={(e) => { if (e.key === "Enter" && zipInput.length === 5) enableLocationSort(); }}
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => setZipModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
              <button onClick={enableLocationSort} disabled={zipInput.length !== 5 || geoLoading} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition flex items-center justify-center gap-2">
                {geoLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading...</>
                ) : "Sort"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
