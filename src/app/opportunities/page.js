"use client";

import { useEffect, useState, useMemo } from "react";
import app from "../../../lib/firebase";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { format } from "date-fns";

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
const AGE_GROUPS = ["Elementary School", "Middle School", "High School", "College", "18+ Only", "All Ages"];
const TYPES = ["Internship", "Workshop", "Event", "Volunteering"];

export default function PlatformPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", industry: "", ageGroup: "", type: "" });
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("youdemonia_favorites");
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [showFavorites, setShowFavorites] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpp, setModalOpp] = useState(null);
  const perPage = 15;

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
          location: raw["City, State"] || raw.location || "",
          date: raw["EventDateTime"] ? raw["EventDateTime"].split(" ")[0] : (raw.date || ""),
          time: raw.time || "",
          industry: raw.industry || "",
          age_group: raw.age_group || (raw["What is the suggested age group?"] || ""),
          tags, description: raw["Detailed description of the event"] || raw.description || "",
          link: raw.link || "", contact_email: raw["E-mail Address"] || raw.contact_email || "",
          location_mode: raw.location_mode || (raw["Is the opportunity remote or in-person"] === "Remote" ? "Remote" : "In-Person"),
          image_url: raw.image_url || raw.media_url || "",
          recurring_dates: raw.recurring_dates || [],
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
    if (filters.industry) result = result.filter((o) => o.industry === filters.industry || o.tags?.includes(filters.industry));
    if (filters.ageGroup) result = result.filter((o) => o.age_group === filters.ageGroup);
    if (filters.type) result = result.filter((o) => o.opportunity_type === filters.type);
    return result;
  }, [opportunities, filters, favorites, showFavorites]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => { setPage(1); }, [filters, showFavorites]);

  const exportFavorites = () => {
    const favOpps = opportunities.filter((o) => favorites.has(o.id));
    const csv = [["Name", "Type", "Organization", "Location", "Date", "Tags", "Link"].join(","),
      ...favOpps.map((o) => [o.name, o.opportunity_type, o.organization, o.location, o.date, (o.tags || []).join("; "), o.link].map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "youdemonia-favorites.csv"; a.click();
  };

  function renderLocation(opp) {
    if (opp.location_mode === "Remote") return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        Remote
      </span>
    );
    if (opp.location_mode === "Hybrid") return <span className="text-sm text-muted-foreground">{opp.location || "TBD"} or Online</span>;
    return opp.location ? <span className="text-sm text-muted-foreground">{opp.location}</span> : null;
  }

  const hasFilters = filters.search || filters.industry || filters.ageGroup || filters.type;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">YouConnect Platform</h1>
        <p className="text-muted-foreground mt-2">Discover opportunities with nonprofits and community organizations.</p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input placeholder="Search by name, location, industry, or organization..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full pl-12 pr-4 h-12 text-base bg-white border border-border/60 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-[system-ui]" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            <span className="font-medium">Filters:</span>
          </div>
          <select value={filters.industry || ""} onChange={(e) => setFilters({ ...filters, industry: e.target.value })} className="h-10 px-3 rounded-lg bg-white border border-border/60 text-sm font-[system-ui]">
            <option value="">All Industries</option>{INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={filters.ageGroup || ""} onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })} className="h-10 px-3 rounded-lg bg-white border border-border/60 text-sm font-[system-ui]">
            <option value="">All Age Groups</option>{AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filters.type || ""} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="h-10 px-3 rounded-lg bg-white border border-border/60 text-sm font-[system-ui]">
            <option value="">All Types</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => setFilters({ search: "", industry: "", ageGroup: "", type: "" })} className="text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>Clear
            </button>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 mt-6 mb-4">
        <button onClick={() => setShowFavorites(!showFavorites)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border cursor-pointer transition ${showFavorites ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
          <svg className={`w-4 h-4 ${showFavorites ? "fill-white" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          Favorites ({favorites.size})
        </button>
        {favorites.size > 0 && (
          <button onClick={exportFavorites} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border/60 bg-white hover:bg-muted cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Export
          </button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">{filtered.length} opportunities</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : paged.length === 0 ? (
        <div className="text-center py-16"><h3 className="text-lg font-semibold text-foreground">No opportunities found</h3><p className="text-sm text-muted-foreground mt-1">Try adjusting your filters.</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "4%" }} />
              </colgroup>
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-3 py-3 text-left font-semibold text-sm"></th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Opportunity</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Type</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Organization</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Location</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Date</th>
                  <th className="px-3 py-3 text-left font-semibold text-sm">Tags</th>
                  <th className="px-3 py-3 text-center font-semibold text-sm"></th>
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
                    <td className="px-3 py-3 font-medium text-foreground text-sm truncate">{opp.name}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${TYPE_STYLES[opp.opportunity_type] || "bg-gray-100 text-gray-700"}`}>{opp.opportunity_type}</span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-sm truncate">{opp.organization}</td>
                    <td className="px-3 py-3">{renderLocation(opp)}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {opp.date && (() => { try { return format(new Date(opp.date), "MMM d, yyyy"); } catch { return opp.date; } })()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {opp.tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${TAG_COLORS[tag] || "bg-secondary text-secondary-foreground"}`}>{tag}</span>
                        ))}
                        {opp.tags?.length > 2 && <span className="text-[11px] text-muted-foreground">+{opp.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button onClick={() => setModalOpp(opp)} className="p-1.5 rounded-lg text-primary hover:bg-accent transition cursor-pointer" title="View details">
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border/60 bg-white hover:bg-muted disabled:opacity-50 cursor-pointer">Previous</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-sm font-medium rounded-lg border border-border/60 bg-white hover:bg-muted disabled:opacity-50 cursor-pointer">Next</button>
        </div>
      )}

      {/* Modal — wider */}
      {modalOpp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpp(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpp(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/10 flex items-center justify-center text-foreground cursor-pointer z-10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {modalOpp.image_url && (
              <img src={modalOpp.image_url} alt={modalOpp.name} className="w-full h-64 object-cover rounded-t-2xl" />
            )}

            <div className="p-8 sm:p-10">
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold mb-3 ${TYPE_STYLES[modalOpp.opportunity_type] || "bg-gray-100 text-gray-700"}`}>{modalOpp.opportunity_type}</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{modalOpp.name}</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 mt-6">
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Organization</p>
                  <p className="text-sm text-foreground mt-0.5">{modalOpp.organization}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Age Group</p>
                  <p className="text-sm text-foreground mt-0.5">{modalOpp.age_group || "All Ages"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Location</p>
                  <p className="text-sm text-foreground mt-0.5 flex items-center gap-1">
                    {modalOpp.location_mode === "Remote" ? (
                      <><svg className="w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Remote</>
                    ) : modalOpp.location_mode === "Hybrid" ? <>{modalOpp.location} or Online</> : modalOpp.location || "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Industry</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {modalOpp.tags?.map((tag) => <span key={tag} className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${TAG_COLORS[tag] || "bg-secondary text-secondary-foreground"}`}>{tag}</span>)}
                    {(!modalOpp.tags || modalOpp.tags.length === 0) && <span className="text-sm text-muted-foreground">—</span>}
                  </div>
                </div>
                {modalOpp.date && (
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Date & Time</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {(() => { try { return format(new Date(modalOpp.date), "MMMM d, yyyy"); } catch { return modalOpp.date; } })()}
                      {modalOpp.time && ` at ${modalOpp.time}`}
                    </p>
                  </div>
                )}
                {modalOpp.contact_email && (
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Contact</p>
                    <p className="text-sm text-foreground mt-0.5">{modalOpp.contact_email}</p>
                  </div>
                )}
              </div>

              {/* Recurring Dates */}
              {modalOpp.recurring_dates?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Recurring Dates</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {modalOpp.recurring_dates.map((d) => (
                      <span key={d} className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-accent text-accent-foreground border border-primary/10">
                        {(() => { try { return format(new Date(d), "MMM d, yyyy"); } catch { return d; } })()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {modalOpp.description && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Description</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{modalOpp.description}</p>
                </div>
              )}

              {modalOpp.link && (
                <a href={modalOpp.link.startsWith("http") ? modalOpp.link : `https://${modalOpp.link}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition">
                  Learn More / Apply
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
