"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import app from "../../../lib/firebase";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { format } from "date-fns";

const TYPES = ["Internship", "Workshop", "Event", "Volunteering"];
const INDUSTRIES = ["Healthcare", "Activism", "Business", "Humanities", "Education", "Environment", "Community Service", "STEM"];
const AGE_GROUPS = ["Youth", "High School", "College"];
const LOCATION_MODES = ["In-Person", "Remote", "Hybrid"];

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
};

const TIMEZONES = [
  { value: "EST", label: "EST (GMT-5)" },
  { value: "CST", label: "CST (GMT-6)" },
  { value: "MST", label: "MST (GMT-7)" },
  { value: "PST", label: "PST (GMT-8)" },
  { value: "AKT", label: "AKT (GMT-9)" },
  { value: "HST", label: "HST (GMT-10)" },
  { value: "EDT", label: "EDT (GMT-4)" },
  { value: "CDT", label: "CDT (GMT-5)" },
  { value: "MDT", label: "MDT (GMT-6)" },
  { value: "PDT", label: "PDT (GMT-7)" },
];

const EMPTY = {
  name: "", opportunity_type: "", organization: "", location: "",
  date: "", time: "", timezone: "EST", tags: [], age_group: [],
  description: "", link: "", contact_email: "", status: "approved",
  location_mode: "In-Person", image_url: "", recurring_dates: [],
};

function compressImage(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      let quality = 0.7;
      let result = canvas.toDataURL("image/jpeg", quality);
      while (result.length > 700000 && quality > 0.1) { quality -= 0.1; result = canvas.toDataURL("image/jpeg", quality); }
      if (result.length > 700000) reject(new Error("Image too large. Try a smaller image."));
      else resolve(result);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image.")); };
    img.src = url;
  });
}

// Simple inline calendar for selecting multiple recurring dates
function RecurringDatesPicker({ dates, onChange }) {
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = format(viewMonth, "MMMM yyyy");

  function toggleDate(dateStr) {
    if (dates.includes(dateStr)) onChange(dates.filter((d) => d !== dateStr));
    else onChange([...dates, dateStr].sort());
  }

  function prevMonth() { setViewMonth(new Date(year, month - 1, 1)); }
  function nextMonth() { setViewMonth(new Date(year, month + 1, 1)); }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <button type="button" onClick={() => setPickerOpen(!pickerOpen)}
        className="w-full px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        {dates.length > 0 ? `${dates.length} recurring date${dates.length > 1 ? "s" : ""} selected` : "Select recurring dates"}
      </button>

      {pickerOpen && (
        <div className="mt-2 bg-white border border-border rounded-xl p-4 shadow-lg">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-muted cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-muted cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = dates.includes(dateStr);
              return (
                <button key={dateStr} type="button" onClick={() => toggleDate(dateStr)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition cursor-pointer mx-auto flex items-center justify-center ${
                    isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>
          {dates.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-1.5">
                {dates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-accent text-accent-foreground border border-primary/10">
                    {(() => { try { return format(new Date(d), "MMM d"); } catch { return d; } })()}
                    <button type="button" onClick={() => toggleDate(d)} className="text-muted-foreground hover:text-destructive cursor-pointer">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => setPickerOpen(false)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:bg-primary/90 transition">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [opps, setOpps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [analytics, setAnalytics] = useState({});
  const [rawClicks, setRawClicks] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [chartFilter, setChartFilter] = useState([]); // empty = all

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => { if (user) { fetchOpps(); fetchAnalytics(); } }, [user]);

  async function fetchAnalytics() {
    try {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, "clicks"));
      const counts = {};
      const clicks = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        const { opportunity_id, type, timestamp } = data;
        if (!opportunity_id) return;
        if (!counts[opportunity_id]) counts[opportunity_id] = { more_info: 0, learn_more: 0 };
        if (type === "more_info") counts[opportunity_id].more_info++;
        else if (type === "learn_more") counts[opportunity_id].learn_more++;
        clicks.push({ id: opportunity_id, type, timestamp: timestamp || "" });
      });
      setAnalytics(counts);
      setRawClicks(clicks.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
    } catch (e) { console.log("No clicks data yet."); }
  }

  async function fetchOpps() {
    setLoading(true);
    const db = getFirestore(app);
    const snap = await getDocs(collection(db, "opportunities"));
    setOpps(snap.docs.map((d) => {
      const r = d.data();
      let tags = r.tags || [];
      if (!Array.isArray(tags) && typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length === 0 && r["Industry Tags"]) tags = r["Industry Tags"].split(",").map((t) => t.trim()).filter(Boolean);
      return {
        id: d.id, name: r["What is the name of your opportunity?"] || r.name || "",
        opportunity_type: r["Opportunity Type"] || r.opportunity_type || "",
        organization: r["Organization Name"] || r.organization || "",
        location: r["City, State"] || r.location || "",
        date: r["EventDateTime"] ? r["EventDateTime"].split(" ")[0] : (r.date || ""),
        time: r.time || "", tags,
        age_group: Array.isArray(r.age_group) ? r.age_group : (r.age_group ? [r.age_group] : []),
        description: r["Detailed description of the event"] || r.description || "",
        link: r.link || "", contact_email: r["E-mail Address"] || r.contact_email || "",
        status: r.status || "approved",
        location_mode: r.location_mode || (r["Is the opportunity remote or in-person"] === "Remote" ? "Remote" : "In-Person"),
        image_url: r.image_url || "", recurring_dates: r.recurring_dates || [],
        timezone: r.timezone || "EST",
      };
    }));
    setLoading(false);
  }

  function openCreate() { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); }
  function openEdit(o) { setEditId(o.id); setForm({ ...o }); setShowForm(true); }
  function up(f, v) { setForm((p) => ({ ...p, [f]: v })); }
  function toggleTag(tag) {
    setForm((prev) => {
      if (prev.tags.includes(tag)) return { ...prev, tags: prev.tags.filter((t) => t !== tag) };
      if (prev.tags.length >= 3) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Image must be under 10MB."); return; }
    setUploadingFile(true);
    try { up("image_url", await compressImage(file)); } catch (err) { alert(err.message); }
    setUploadingFile(false);
  }

  async function handleSave() {
    const missing = [];
    if (!form.name) missing.push("Name");
    if (!form.organization) missing.push("Organization");
    if (!form.location && form.location_mode !== "Remote") missing.push("Location");
    if (!form.opportunity_type) missing.push("Type");
    if (!form.age_group || form.age_group.length === 0) missing.push("Age Group");
    if (!form.date) missing.push("Date");
    if (!form.time) missing.push("Time");
    if (!form.contact_email) missing.push("Contact Email");
    if (form.tags.length === 0) missing.push("Industry Tags (at least 1)");
    if (!form.description) missing.push("Description");
    if (missing.length > 0) { alert("Please fill in required fields:\n• " + missing.join("\n• ")); return; }
    if (form.description.length > 1000) { alert("Description must be 1000 characters or fewer."); return; }
    // Prevent exact name duplicates when creating (not editing)
    if (!editId) {
      const nameExists = opps.some((o) => o.name.trim().toLowerCase() === form.name.trim().toLowerCase());
      if (nameExists) { alert("An opportunity with this exact name already exists. Please change the name before saving."); return; }
    }
    setSaving(true);
    try {
      const db = getFirestore(app);
      const data = { ...form }; delete data.id;
      if (editId) await updateDoc(doc(db, "opportunities", editId), data);
      else await addDoc(collection(db, "opportunities"), data);
      setShowForm(false); setEditId(null); setForm({ ...EMPTY });
      await fetchOpps();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Image may be too large — try removing it.");
    }
    setSaving(false);
  }

  function handleDuplicate(o) {
    const copyName = o.name.endsWith(" (Copy)") ? o.name : `${o.name} (Copy)`;
    setEditId(null);
    setForm({ ...o, name: copyName.substring(0, 40) });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this opportunity?")) return;
    await deleteDoc(doc(getFirestore(app), "opportunities", id));
    await fetchOpps();
  }

  if (authLoading || !user) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const filtered = opps.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.organization.toLowerCase().includes(search.toLowerCase()));
  const inputClass = "w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-[system-ui]";
  const selectClass = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white font-[system-ui] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-xs font-bold text-primary uppercase mb-1.5 tracking-wide";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Portal</h1>
          <p className="text-sm text-muted-foreground">Managing as <span className="font-semibold text-primary">{user.displayName || user.email}</span></p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-primary/90 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M12 5v14m-7-7h14" /></svg>
          Add Opportunity
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[{ l: "Total", v: opps.length, c: "text-primary" }, { l: "Workshops", v: opps.filter((o) => o.opportunity_type === "Workshop").length, c: "text-amber-600" }, { l: "Volunteering", v: opps.filter((o) => o.opportunity_type === "Volunteering").length, c: "text-purple-600" }, { l: "Events", v: opps.filter((o) => o.opportunity_type === "Event").length, c: "text-emerald-600" }].map((s) => (
          <div key={s.l} className="bg-white rounded-xl p-5 border border-border/60">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.l}</div>
            <div className={`text-3xl font-bold ${s.c} mt-1`}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Analytics Button */}
      <div className="mb-6">
        <button onClick={() => { setShowAnalytics(true); fetchAnalytics(); }} className="inline-flex items-center gap-2 bg-white border border-primary text-primary font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-primary hover:text-white transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          See Analytics
        </button>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAnalytics(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-5 border-b border-border/40 flex items-center justify-between bg-muted/30">
              <div>
                <h2 className="text-xl font-bold text-foreground">Click Analytics</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Track engagement across all opportunities</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchAnalytics} className="text-xs text-primary hover:underline cursor-pointer font-medium">Refresh</button>
                <button onClick={() => setShowAnalytics(false)} className="w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/10 flex items-center justify-center text-foreground cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-8">
              {/* Chart Filter */}
              <div className="mb-6">
                <div className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Filter by Opportunity</div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setChartFilter([])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${chartFilter.length === 0 ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
                    All Combined
                  </button>
                  {opps.map((o) => {
                    const sel = chartFilter.includes(o.id);
                    return (
                      <button key={o.id} onClick={() => setChartFilter((prev) => sel ? prev.filter((id) => id !== o.id) : [...prev, o.id])}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${sel ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
                        {sel && <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        {o.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SVG Chart */}
              {(() => {
                const filteredClicks = chartFilter.length === 0 ? rawClicks : rawClicks.filter((c) => chartFilter.includes(c.id));
                // Group by date
                const byDate = {};
                filteredClicks.forEach((c) => {
                  const day = c.timestamp ? c.timestamp.substring(0, 10) : "unknown";
                  if (day === "unknown") return;
                  byDate[day] = (byDate[day] || 0) + 1;
                });
                const dates = Object.keys(byDate).sort();
                if (dates.length === 0) return (
                  <div className="bg-muted/30 rounded-xl p-12 text-center mb-8">
                    <svg className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <p className="text-sm text-muted-foreground">No click data yet. Clicks will appear here as students interact with opportunities.</p>
                  </div>
                );

                // Build cumulative data
                let cumulative = 0;
                const points = dates.map((d) => { cumulative += byDate[d]; return { date: d, count: cumulative, daily: byDate[d] }; });
                const maxVal = Math.max(...points.map((p) => p.count), 1);
                const chartW = 700, chartH = 250, padL = 50, padR = 20, padT = 20, padB = 40;
                const plotW = chartW - padL - padR, plotH = chartH - padT - padB;

                return (
                  <div className="bg-white rounded-xl border border-border/60 p-6 mb-8">
                    <h3 className="text-sm font-bold text-foreground mb-4">Cumulative Clicks Over Time</h3>
                    <div className="overflow-x-auto">
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full max-w-[700px]" style={{ minWidth: 400 }}>
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                          const y = padT + plotH - frac * plotH;
                          return (
                            <g key={frac}>
                              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#e2e8f0" strokeWidth={1} />
                              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">{Math.round(frac * maxVal)}</text>
                            </g>
                          );
                        })}
                        {/* Area fill */}
                        <path
                          d={`M${padL},${padT + plotH} ` + points.map((p, i) => {
                            const x = padL + (i / Math.max(points.length - 1, 1)) * plotW;
                            const y = padT + plotH - (p.count / maxVal) * plotH;
                            return `L${x},${y}`;
                          }).join(" ") + ` L${padL + plotW},${padT + plotH} Z`}
                          fill="url(#areaGrad)" opacity={0.3}
                        />
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        {/* Line */}
                        <polyline
                          points={points.map((p, i) => {
                            const x = padL + (i / Math.max(points.length - 1, 1)) * plotW;
                            const y = padT + plotH - (p.count / maxVal) * plotH;
                            return `${x},${y}`;
                          }).join(" ")}
                          fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                        />
                        {/* Dots */}
                        {points.map((p, i) => {
                          const x = padL + (i / Math.max(points.length - 1, 1)) * plotW;
                          const y = padT + plotH - (p.count / maxVal) * plotH;
                          return <circle key={i} cx={x} cy={y} r={4} fill="#7c3aed" stroke="white" strokeWidth={2} />;
                        })}
                        {/* X labels */}
                        {points.map((p, i) => {
                          if (points.length > 10 && i % Math.ceil(points.length / 8) !== 0 && i !== points.length - 1) return null;
                          const x = padL + (i / Math.max(points.length - 1, 1)) * plotW;
                          const label = p.date.substring(5); // MM-DD
                          return <text key={i} x={x} y={chartH - 8} textAnchor="middle" fontSize={10} fill="#94a3b8">{label}</text>;
                        })}
                      </svg>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Total clicks: <span className="font-bold text-foreground">{cumulative}</span></span>
                      <span>Date range: <span className="font-medium text-foreground">{dates[0]} → {dates[dates.length - 1]}</span></span>
                    </div>
                  </div>
                );
              })()}

              {/* Table */}
              <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
                <div className="px-5 py-3 bg-muted/30 border-b border-border/40">
                  <h3 className="text-sm font-bold text-foreground">Click Counts by Opportunity</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="px-5 py-2.5 text-left text-xs font-bold text-muted-foreground uppercase">Opportunity</th>
                        <th className="px-5 py-2.5 text-center text-xs font-bold text-muted-foreground uppercase">More Info</th>
                        <th className="px-5 py-2.5 text-center text-xs font-bold text-muted-foreground uppercase">Learn More</th>
                        <th className="px-5 py-2.5 text-center text-xs font-bold text-muted-foreground uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opps.map((o) => {
                        const a = analytics[o.id] || { more_info: 0, learn_more: 0 };
                        return (
                          <tr key={o.id} className="border-b border-border/20 hover:bg-accent/20 transition">
                            <td className="px-5 py-2.5 text-sm text-foreground font-medium">{o.name}</td>
                            <td className="px-5 py-2.5 text-center"><span className="inline-block min-w-[32px] px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">{a.more_info}</span></td>
                            <td className="px-5 py-2.5 text-center"><span className="inline-block min-w-[32px] px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">{a.learn_more}</span></td>
                            <td className="px-5 py-2.5 text-center"><span className="inline-block min-w-[32px] px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">{a.more_info + a.learn_more}</span></td>
                          </tr>
                        );
                      })}
                      {opps.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">No opportunities yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForm && (
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">{editId ? "Edit Opportunity" : "Create New Opportunity"}</h2>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-2xl cursor-pointer">&times;</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Row 1: Name (full width) */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Name * <span className="text-muted-foreground font-normal normal-case">({form.name.length}/40)</span></label>
              <input value={form.name} onChange={(e) => { if (e.target.value.length <= 40) up("name", e.target.value); }} placeholder="e.g. Summer Volunteer Program" maxLength={40} className={inputClass} />
            </div>

            {/* Row 2: Organization, Location */}
            <div>
              <label className={labelClass}>Organization * <span className="text-muted-foreground font-normal normal-case">({form.organization.length}/30)</span></label>
              <input value={form.organization} onChange={(e) => { if (e.target.value.length <= 30) up("organization", e.target.value); }} maxLength={30} className={inputClass} />
            </div>
            <div><label className={labelClass}>Location *</label><input value={form.location} onChange={(e) => up("location", e.target.value)} placeholder="City, State" className={inputClass} /></div>

            {/* Row 3: Type, Age Group */}
            <div><label className={labelClass}>Type *</label><select value={form.opportunity_type} onChange={(e) => up("opportunity_type", e.target.value)} className={selectClass}><option value="">Select type</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div>
              <label className={labelClass}>Age Group *</label>
              <div className="flex gap-2">
                {AGE_GROUPS.map((age) => {
                  const sel = Array.isArray(form.age_group) && form.age_group.includes(age);
                  return (
                    <button key={age} type="button" onClick={() => {
                      const arr = Array.isArray(form.age_group) ? form.age_group : [];
                      up("age_group", sel ? arr.filter((a) => a !== age) : [...arr, age]);
                    }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:bg-muted"}`}>
                      {sel && <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Format (full width) */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Format *</label>
              <div className="flex gap-2">
                {LOCATION_MODES.map((mode) => (
                  <button key={mode} type="button" onClick={() => up("location_mode", mode)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${form.location_mode === mode ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:bg-muted"}`}>
                    {mode === "Remote" && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 5: Industry Tags (full width) */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Industry Tags * <span className="text-muted-foreground font-normal normal-case">(select up to 3)</span></label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((tag) => {
                  const sel = form.tags.includes(tag);
                  const atMax = form.tags.length >= 3 && !sel;
                  return (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)} disabled={atMax}
                      className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition cursor-pointer ${sel ? "bg-primary text-primary-foreground border-primary" : atMax ? "bg-muted/50 text-muted-foreground/40 border-border/40 cursor-not-allowed" : "bg-white text-foreground border-border hover:bg-muted"}`}>
                      {sel && <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      {tag}
                    </button>
                  );
                })}
              </div>
              {form.tags.length > 0 && <p className="text-xs text-muted-foreground mt-1.5">{form.tags.length}/3 selected: {form.tags.join(", ")}</p>}
            </div>

            {/* Row 6: Date, Time *, Timezone */}
            <div><label className={labelClass}>Date *</label><input type="date" value={form.date} onChange={(e) => up("date", e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Time *</label><input type="time" value={form.time} onChange={(e) => up("time", e.target.value)} className={inputClass} required /></div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Timezone *</label>
              <select value={form.timezone} onChange={(e) => up("timezone", e.target.value)} className={selectClass}>
                {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            {/* Row 7: Recurring Dates calendar, Contact Email */}
            <div>
              <label className={labelClass}>Recurring Dates</label>
              <RecurringDatesPicker dates={form.recurring_dates || []} onChange={(d) => up("recurring_dates", d)} />
            </div>
            <div><label className={labelClass}>Contact Email *</label><input type="email" value={form.contact_email} onChange={(e) => up("contact_email", e.target.value)} className={inputClass} /></div>

            {/* Row 8: Link, Image */}
            <div><label className={labelClass}>Link</label><input value={form.link} onChange={(e) => up("link", e.target.value)} placeholder="https://..." className={inputClass} /></div>
            <div>
              <label className={labelClass}>Image <span className="text-muted-foreground font-normal normal-case">(auto-compressed)</span></label>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingFile}
                className="w-full px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer flex items-center justify-center gap-2">
                {uploadingFile ? <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                {form.image_url ? "Change image" : "Upload image"}
              </button>
              {form.image_url && (
                <div className="mt-2 relative">
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-border" />
                  <button type="button" onClick={() => up("image_url", "")} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs cursor-pointer hover:bg-red-600">&times;</button>
                </div>
              )}
            </div>

            {/* Row 9: Description * (full width, 1000 char limit) */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => { if (e.target.value.length <= 1000) up("description", e.target.value); }}
                rows={3}
                className={`${inputClass} resize-vertical`}
                maxLength={1000}
              />
              <p className={`text-xs mt-1 ${form.description.length >= 1000 ? "text-red-600 font-bold" : form.description.length >= 980 ? "text-amber-500 font-semibold" : "text-muted-foreground"}`}>
                {form.description.length}/1,000 characters
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-border text-muted-foreground text-sm font-medium hover:bg-muted cursor-pointer">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition">{saving ? "Saving..." : editId ? "Save Changes" : "Create Opportunity"}</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search opportunities..." className="max-w-md w-full px-4 py-2.5 border border-border/60 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white" /></div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border/60 overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col style={{ width: "17%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead><tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-3 text-left text-sm font-bold">Name</th>
                <th className="px-3 py-3 text-left text-sm font-bold">Type</th>
                <th className="px-3 py-3 text-left text-sm font-bold">Organization</th>
                <th className="px-3 py-3 text-left text-sm font-bold">Location</th>
                <th className="px-3 py-3 text-left text-sm font-bold">Tags</th>
                <th className="px-3 py-3 text-left text-sm font-bold whitespace-nowrap">Date / Time</th>
                <th className="px-3 py-3 text-center text-sm font-bold">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border/40 hover:bg-accent/30 transition">
                    <td className="px-3 py-3 text-sm font-bold text-foreground break-words">{o.name}</td>
                    <td className="px-3 py-3"><span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${TYPE_STYLES[o.opportunity_type] || "bg-gray-100 text-gray-700"}`}>{o.opportunity_type}</span></td>
                    <td className="px-3 py-3 text-sm text-foreground break-words">{o.organization}</td>
                    <td className="px-3 py-3 text-sm text-foreground break-words">
                      {o.location_mode === "Remote" ? (
                        <span className="inline-flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>Remote</span>
                      ) : o.location_mode === "Hybrid" ? <span>{o.location} or Online</span> : o.location}
                    </td>
                    <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{o.tags?.slice(0, 3).map((tag) => <span key={tag} className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap ${TAG_COLORS[tag] || "bg-secondary text-secondary-foreground"}`}>{tag}</span>)}</div></td>
                    <td className="px-3 py-3 text-sm text-foreground whitespace-nowrap">{o.date}{o.time && ` ${o.time}`}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(o)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-primary/20 text-primary hover:bg-accent cursor-pointer transition">Edit</button>
                        <button onClick={() => handleDuplicate(o)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer transition" title="Duplicate">Duplicate</button>
                        <button onClick={() => handleDelete(o.id)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No opportunities found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
