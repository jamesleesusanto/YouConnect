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
  { value: "EDT", label: "EDT (GMT-4)" },
  { value: "EST", label: "EST (GMT-5)" },
  { value: "CDT", label: "CDT (GMT-5)" },
  { value: "CST", label: "CST (GMT-6)" },
  { value: "MDT", label: "MDT (GMT-6)" },
  { value: "MST", label: "MST (GMT-7)" },
  { value: "PDT", label: "PDT (GMT-7)" },
  { value: "PST", label: "PST (GMT-8)" },
  { value: "AKT", label: "AKT (GMT-9)" },
  { value: "HST", label: "HST (GMT-10)" },
];

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];


const EMPTY = {
  name: "", opportunity_type: "", organization: "",
  city: "", state: "", zip: "", location: "",
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
    else if (dates.length >= 7) return; // Cap at 7
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
        className={`w-full px-3 py-2.5 rounded-lg border text-sm transition cursor-pointer flex items-center justify-center gap-2 ${dates.length > 0 ? "border-primary bg-primary/5 text-primary font-medium" : "border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        {dates.length > 0 ? `${dates.length}/7 recurring date${dates.length > 1 ? "s" : ""} selected` : "Select recurring dates (max 7)"}
      </button>

      {pickerOpen && (
        <div className="mt-2 bg-white border border-primary/20 rounded-2xl p-5 shadow-xl">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-primary/10 cursor-pointer flex items-center justify-center transition">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold text-foreground">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-primary/10 cursor-pointer flex items-center justify-center transition">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-[11px] font-bold text-primary uppercase py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = dates.includes(dateStr);
              const atMax = dates.length >= 7 && !isSelected;
              return (
                <button key={dateStr} type="button" onClick={() => toggleDate(dateStr)} disabled={atMax}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition mx-auto flex items-center justify-center ${
                    isSelected ? "bg-primary text-white shadow-sm cursor-pointer" : atMax ? "text-muted-foreground/30 cursor-not-allowed" : "hover:bg-primary/10 text-foreground cursor-pointer"
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>
          {dates.length >= 10 && (
            <p className="text-xs text-amber-600 mt-2 text-center font-medium">Maximum of 10 recurring dates reached</p>
          )}
          {dates.length > 0 && (
            <div className="mt-4 pt-3 border-t border-primary/10">
              <div className="flex flex-wrap gap-1.5">
                {dates.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    {(() => { try { return format(new Date(d), "MMM d"); } catch { return d; } })()}
                    <button type="button" onClick={() => toggleDate(d)} className="text-primary/50 hover:text-destructive cursor-pointer ml-0.5">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setPickerOpen(false)}
              className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-primary/90 transition shadow-sm">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading, userRole, roleStatus } = useAuth();
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
  const [chartFilter, setChartFilter] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [showManageUsers, setShowManageUsers] = useState(false);

  const isMaster = userRole === "master";

  useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);
  useEffect(() => {
    if (user && userRole) {
      if (userRole === "student") { router.push("/opportunities"); return; }
      fetchOpps();
      fetchAnalytics();
      if (isMaster) fetchPendingUsers();
    }
  }, [user, userRole]);

  async function fetchPendingUsers() {
    try {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, "user_roles"));
      setPendingUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => u.role === "organizer" && u.status === "pending"));
    } catch {}
  }

  async function approveUser(uid) {
    const db = getFirestore(app);
    const { updateDoc: updateDocument } = await import("firebase/firestore");
    await updateDocument(doc(db, "user_roles", uid), { status: "active" });
    await fetchPendingUsers();
  }

  async function denyUser(uid) {
    const db = getFirestore(app);
    const { updateDoc: updateDocument } = await import("firebase/firestore");
    await updateDocument(doc(db, "user_roles", uid), { status: "denied", role: "student" });
    await fetchPendingUsers();
  }

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
    const allOpps = snap.docs.map((d) => {
      const r = d.data();
      let tags = r.tags || [];
      if (!Array.isArray(tags) && typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tags.length === 0 && r["Industry Tags"]) tags = r["Industry Tags"].split(",").map((t) => t.trim()).filter(Boolean);
      return {
        id: d.id, name: r["What is the name of your opportunity?"] || r.name || "",
        opportunity_type: r["Opportunity Type"] || r.opportunity_type || "",
        organization: r["Organization Name"] || r.organization || "",
        city: r.city || "", state: r.state || "", zip: r.zip || "",
        location: r.city && r.state ? `${r.city}, ${r.state}` : (r["City, State"] || r.location || ""),
        date: r["EventDateTime"] ? r["EventDateTime"].split(" ")[0] : (r.date || ""),
        time: r.time || "", tags,
        age_group: Array.isArray(r.age_group) ? r.age_group : (r.age_group ? [r.age_group] : []),
        description: r["Detailed description of the event"] || r.description || "",
        link: r.link || "", contact_email: r["E-mail Address"] || r.contact_email || "",
        status: r.status || "approved",
        location_mode: r.location_mode || (r["Is the opportunity remote or in-person"] === "Remote" ? "Remote" : "In-Person"),
        image_url: r.image_url || "", recurring_dates: r.recurring_dates || [],
        timezone: r.timezone || "EST",
        created_by: r.created_by || "",
        created_by_email: r.created_by_email || "",
      };
    });
    // Filter: master admins see all, regular users see only their own
    setOpps(isMaster ? allOpps : allOpps.filter((o) => o.created_by === user.uid));
    setLoading(false);
  }

  function openCreate() { setEditId(null); setForm({ ...EMPTY }); setShowForm(true); }
  function openEdit(o) {
    const f = { ...o };
    if (f.time) {
      const [hStr, mStr] = f.time.split(":");
      const h24 = parseInt(hStr);
      f._timeHour = String(h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24);
      f._timeMin = mStr || "00";
      f._timeAP = h24 >= 12 ? "PM" : "AM";
    }
    setEditId(o.id); setForm(f); setShowForm(true);
  }
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
    if (!form.city && form.location_mode !== "Remote") missing.push("Location (select from dropdown)");
    if (form.city && !form.state && form.location_mode !== "Remote") missing.push("Location (incomplete — please select from dropdown)");
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
      const data = { ...form };
      delete data.id; delete data._locationQuery; delete data._locationResults;
      delete data.created_by; delete data.created_by_email;
      delete data._datePickerOpen; delete data._dateViewMonth;
      delete data._timeHour; delete data._timeMin; delete data._timeAP; delete data._timePickerOpen;
      // Build combined location string
      if (data.city && data.state) data.location = `${data.city}, ${data.state}`;
      if (editId) {
        await updateDoc(doc(db, "opportunities", editId), data);
      } else {
        data.created_by = user.uid;
        data.created_by_email = user.email || "";
        await addDoc(collection(db, "opportunities"), data);
      }
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

  // Pending organizer screen
  if (userRole === "organizer" && roleStatus === "pending") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Account Pending Approval</h2>
          <p className="text-sm text-muted-foreground mb-4">Your organizer account is waiting for admin approval. You&apos;ll be able to access the Admin Portal once approved.</p>
          <p className="text-xs text-muted-foreground">In the meantime, you can browse opportunities on the <a href="/opportunities" className="text-primary font-semibold hover:underline">YouConnect Platform</a>.</p>
        </div>
      </div>
    );
  }

  const filtered = opps.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.organization.toLowerCase().includes(search.toLowerCase()));
  const inputClass = "w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-[system-ui]";
  const selectClass = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white font-[system-ui] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-xs font-bold text-primary uppercase mb-1.5 tracking-wide";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Portal</h1>
          <p className="text-sm text-muted-foreground">
            Managing as <span className="font-semibold text-primary">{user.displayName || user.email}</span>
            {isMaster && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">Master Admin</span>}
          </p>
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => { setShowAnalytics(true); fetchAnalytics(); }} className="inline-flex items-center gap-2 bg-white border border-primary text-primary font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-primary hover:text-white transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          See Analytics
        </button>
        {isMaster && (
          <button onClick={() => { setShowManageUsers(true); fetchPendingUsers(); }} className="inline-flex items-center gap-2 bg-white border border-amber-500 text-amber-700 font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-amber-500 hover:text-white transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            Manage Users {pendingUsers.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingUsers.length}</span>}
          </button>
        )}
      </div>

      {/* Manage Users Modal (master admin only) */}
      {showManageUsers && isMaster && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowManageUsers(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/30">
              <h2 className="text-lg font-bold text-foreground">Manage Users</h2>
              <button onClick={() => setShowManageUsers(false)} className="w-8 h-8 rounded-full bg-muted hover:bg-muted-foreground/10 flex items-center justify-center text-foreground cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-6">
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm text-muted-foreground">No pending organizer requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">{pendingUsers.length} pending organizer request{pendingUsers.length !== 1 ? "s" : ""}</p>
                  {pendingUsers.map((u) => (
                    <div key={u.uid} className="bg-muted/30 rounded-xl p-4 border border-border/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{u.name || "No name"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Requested: {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => approveUser(u.uid)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer transition">Approve</button>
                          <button onClick={() => denyUser(u.uid)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 cursor-pointer transition">Deny</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              {/* Filters row: date range + opportunity dropdown + download */}
              <div className="flex flex-wrap items-end gap-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-primary uppercase tracking-wide">From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="block mt-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-primary uppercase tracking-wide">To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="block mt-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-primary" />
                </div>

                {/* Opportunity filter dropdown */}
                <div className="relative group">
                  <button className={`h-[42px] px-4 rounded-lg text-sm font-medium border transition cursor-pointer inline-flex items-center gap-2 ${chartFilter.length > 0 ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border/60 hover:bg-muted"}`}>
                    <span className="text-xs font-bold uppercase tracking-wide">Opportunities</span>
                    {chartFilter.length > 0 && <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{chartFilter.length}</span>}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-white border border-border/60 rounded-xl shadow-lg p-2 w-64 z-50 hidden group-hover:block max-h-64 overflow-y-auto">
                    <div className="flex justify-end items-center mb-1 px-2">
                      <button onClick={() => setChartFilter((prev) => prev.length === opps.length ? [] : opps.map((o) => o.id))} className="text-[11px] text-primary hover:underline cursor-pointer font-medium">
                        {chartFilter.length === opps.length || chartFilter.length === 0 ? "Deselect all" : "Select all"}
                      </button>
                    </div>
                    {opps.map((o) => {
                      const sel = chartFilter.includes(o.id);
                      return (
                        <label key={o.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition ${sel ? "bg-primary border-primary" : "border-border"}`}>
                            {sel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className="text-sm text-foreground truncate">{o.name}</span>
                          <input type="checkbox" checked={sel} onChange={() => setChartFilter((prev) => sel ? prev.filter((id) => id !== o.id) : [...prev, o.id])} className="hidden" />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Download button */}
                <button onClick={() => {
                  const rows = [["Opportunity", "More Info Clicks", "Learn More Clicks", "Total"]];
                  opps.forEach((o) => {
                    const a = analytics[o.id] || { more_info: 0, learn_more: 0 };
                    rows.push([o.name, a.more_info, a.learn_more, a.more_info + a.learn_more]);
                  });
                  rows.push([]);
                  rows.push(["Raw Click Log"]);
                  rows.push(["Opportunity", "Click Type", "Timestamp"]);
                  const nameMap = {};
                  opps.forEach((o) => { nameMap[o.id] = o.name; });
                  rawClicks.forEach((c) => {
                    rows.push([nameMap[c.id] || c.id, c.type, c.timestamp]);
                  });
                  const csv = rows.map((r) => r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "youconnect-analytics.csv"; a.click();
                }} className="h-[42px] px-4 rounded-lg text-sm font-medium border border-border/60 bg-white hover:bg-muted cursor-pointer inline-flex items-center gap-2 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download CSV
                </button>

                {(dateFrom || dateTo) && (
                  <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="h-[42px] text-sm text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>Clear dates
                  </button>
                )}
              </div>

              {/* SVG Chart */}
              {(() => {
                let filteredClicks = chartFilter.length === 0 ? rawClicks : rawClicks.filter((c) => chartFilter.includes(c.id));
                if (dateFrom) filteredClicks = filteredClicks.filter((c) => c.timestamp >= dateFrom);
                if (dateTo) filteredClicks = filteredClicks.filter((c) => c.timestamp <= dateTo + "T23:59:59");
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
                    <p className="text-sm text-muted-foreground">No click data for this range. Clicks will appear as students interact with opportunities.</p>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1: Name (full width) */}
            <div className="lg:col-span-4">
              <label className={labelClass}>Name * <span className="text-muted-foreground font-normal normal-case">({form.name.length}/40)</span></label>
              <input value={form.name} onChange={(e) => { const v = e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()); if (v.length <= 40) up("name", v); }} placeholder="e.g. Summer Volunteer Program" maxLength={40} className={inputClass} />
            </div>

            {/* Row 2: Organization, Type */}
            <div className="lg:col-span-2">
              <label className={labelClass}>Organization * <span className="text-muted-foreground font-normal normal-case">({form.organization.length}/30)</span></label>
              <input value={form.organization} onChange={(e) => { const v = e.target.value.replace(/\b\w/g, (c) => c.toUpperCase()); if (v.length <= 30) up("organization", v); }} maxLength={30} className={inputClass} />
            </div>
            <div className="lg:col-span-2"><label className={labelClass}>Type *</label><select value={form.opportunity_type} onChange={(e) => up("opportunity_type", e.target.value)} className={selectClass}><option value="">Select type</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>

            {/* Row 3: Age Group (full width, evenly spaced) */}
            <div className="lg:col-span-4">
              <label className={labelClass}>Age Group *</label>
              <div className="grid grid-cols-3 gap-2">
                {AGE_GROUPS.map((age) => {
                  const sel = Array.isArray(form.age_group) && form.age_group.includes(age);
                  return (
                    <button key={age} type="button" onClick={() => {
                      const arr = Array.isArray(form.age_group) ? form.age_group : [];
                      up("age_group", sel ? arr.filter((a) => a !== age) : [...arr, age]);
                    }}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:bg-muted"}`}>
                      {sel && <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Format (full width) */}
            <div className="lg:col-span-4">
              <label className={labelClass}>Format *</label>
              <div className="grid grid-cols-3 gap-2">
                {LOCATION_MODES.map((mode) => (
                  <button key={mode} type="button" onClick={() => up("location_mode", mode)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer ${form.location_mode === mode ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border hover:bg-muted"}`}>
                    {mode === "Remote" && <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 5: Location autocomplete via Geoapify (only if In-Person or Hybrid) */}
            {form.location_mode !== "Remote" && (
              <div className="lg:col-span-4 relative">
                <label className={labelClass}>Location *</label>
                <input
                  value={form._locationQuery !== undefined ? form._locationQuery : (form.city && form.state ? `${form.city}, ${form.state}` : "")}
                  onChange={(e) => {
                    const q = e.target.value;
                    up("_locationQuery", q);
                    if (q !== form._locationQuery) { up("city", ""); up("state", ""); up("zip", ""); up("location", ""); }
                    clearTimeout(window._locTimeout);
                    if (q.length < 2) { up("_locationResults", []); return; }
                    window._locTimeout = setTimeout(async () => {
                      try {
                        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
                        if (!apiKey) { console.error("Missing NEXT_PUBLIC_GEOAPIFY_KEY in .env.local"); up("_locationResults", []); return; }
                        const res = await fetch(
                          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(q)}&type=city&filter=countrycode:us&format=json&limit=8&apiKey=${apiKey}`
                        );
                        if (!res.ok) throw new Error("Geoapify API error");
                        const json = await res.json();
                        const seen = new Set();
                        const results = [];
                        for (const r of (json.results || [])) {
                          const city = r.city || r.town || r.name || "";
                          const stateCode = (r.state_code || "").replace("US-", "");
                          const zip = (r.postcode || "").split(";")[0].trim();
                          if (!city || !stateCode) continue;
                          const key = `${city.toLowerCase()}-${stateCode}`;
                          if (seen.has(key)) continue;
                          seen.add(key);
                          results.push({ display: `${city}, ${stateCode}`, city, state: stateCode, zip });
                        }
                        up("_locationResults", results);
                      } catch (err) {
                        console.error("Location search error:", err);
                        up("_locationResults", []);
                      }
                    }, 300);
                  }}
                  placeholder="Type a City or Zip Code"
                  className={inputClass}
                />
                {form.city && form.state && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Selected: {form.city}, {form.state}
                  </p>
                )}
                {form._locationResults?.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border/60 rounded-xl shadow-lg z-40 overflow-hidden max-h-64 overflow-y-auto">
                    {form._locationResults.map((r, i) => (
                      <button key={i} type="button" onClick={() => {
                        up("city", r.city); up("state", r.state); up("zip", r.zip);
                        up("location", `${r.city}, ${r.state}`);
                        up("_locationQuery", r.display);
                        up("_locationResults", []);
                      }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent/50 cursor-pointer transition flex items-center gap-2 border-b border-border/20 last:border-0">
                        <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="text-foreground">{r.display}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Row 5: Industry Tags (full width) */}
            <div className="lg:col-span-4">
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

            {/* Row 6: Date *, Time *, Timezone */}
            <div className="lg:col-span-2 relative">
              <label className={labelClass}>Date *</label>
              <button type="button" onClick={() => up("_datePickerOpen", !form._datePickerOpen)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm text-left transition cursor-pointer flex items-center justify-between ${form.date ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground hover:bg-muted"}`}>
                <span>{form.date ? (() => { try { return format(new Date(form.date), "MMMM d, yyyy"); } catch { return form.date; } })() : "Select date"}</span>
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              {form._datePickerOpen && (() => {
                const dv = form._dateViewMonth || (form.date ? new Date(form.date) : new Date());
                const dy = dv.getFullYear(), dm = dv.getMonth();
                const dFirst = new Date(dy, dm, 1).getDay();
                const dDays = new Date(dy, dm + 1, 0).getDate();
                const dCells = [];
                for (let i = 0; i < dFirst; i++) dCells.push(null);
                for (let d = 1; d <= dDays; d++) dCells.push(d);
                return (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-primary/20 rounded-2xl p-5 shadow-xl z-40 w-[300px]">
                    <div className="flex items-center justify-between mb-4">
                      <button type="button" onClick={() => up("_dateViewMonth", new Date(dy, dm - 1, 1))} className="w-8 h-8 rounded-lg hover:bg-primary/10 cursor-pointer flex items-center justify-center transition">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-sm font-bold text-foreground">{format(dv, "MMMM yyyy")}</span>
                      <button type="button" onClick={() => up("_dateViewMonth", new Date(dy, dm + 1, 1))} className="w-8 h-8 rounded-lg hover:bg-primary/10 cursor-pointer flex items-center justify-center transition">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
                        <div key={d} className="text-[11px] font-bold text-primary py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {dCells.map((day, i) => {
                        if (day === null) return <div key={`de-${i}`} />;
                        const ds = `${dy}-${String(dm + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const isSel = form.date === ds;
                        return (
                          <button key={ds} type="button" onClick={() => { up("date", ds); up("_datePickerOpen", false); }}
                            className={`w-9 h-9 rounded-xl text-xs font-semibold transition cursor-pointer mx-auto flex items-center justify-center ${isSel ? "bg-primary text-white shadow-sm" : "hover:bg-primary/10 text-foreground"}`}>
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="lg:col-span-2 relative">
              <label className={labelClass}>Time *</label>
              <button type="button" onClick={() => up("_timePickerOpen", !form._timePickerOpen)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm text-left transition cursor-pointer flex items-center justify-between ${form.time ? "border-primary bg-primary/5 text-foreground font-medium" : "border-border text-muted-foreground hover:bg-muted"}`}>
                <span>{form.time ? (() => { const [h,m] = form.time.split(":"); const h24=parseInt(h); const h12=h24===0?12:h24>12?h24-12:h24; return `${h12}:${m} ${h24>=12?"PM":"AM"}`; })() : "Select time"}</span>
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              {form._timePickerOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-primary/20 rounded-2xl p-5 shadow-xl z-40 w-[280px]">
                  <div className="text-sm font-bold text-foreground text-center mb-3">Select Time</div>
                  <div className="flex gap-0 border border-primary/20 rounded-xl overflow-hidden" style={{height:200}}>
                    {/* Hour column */}
                    <div className="flex-1 overflow-y-auto border-r border-primary/10">
                      <div className="sticky top-0 bg-white text-[11px] font-bold text-primary text-center py-1.5 border-b border-primary/10">HOUR</div>
                      {[12,1,2,3,4,5,6,7,8,9,10,11].map((h) => {
                        const sel = form._timeHour === String(h);
                        return <button key={h} type="button" onClick={() => {
                          up("_timeHour", String(h));
                          const m = form._timeMin || "00";
                          const ap = form._timeAP || "AM";
                          let h24 = h; if(ap==="PM"&&h!==12)h24+=12; if(ap==="AM"&&h===12)h24=0;
                          up("time", `${String(h24).padStart(2,"0")}:${m}`);
                        }} className={`w-full py-2 text-sm font-semibold cursor-pointer transition ${sel ? "bg-primary text-white" : "hover:bg-primary/10 text-foreground"}`}>{h}</button>;
                      })}
                    </div>
                    {/* Minute column */}
                    <div className="flex-1 overflow-y-auto border-r border-primary/10">
                      <div className="sticky top-0 bg-white text-[11px] font-bold text-primary text-center py-1.5 border-b border-primary/10">MIN</div>
                      {["00","15","30","45"].map((m) => {
                        const sel = (form._timeMin || "00") === m;
                        return <button key={m} type="button" onClick={() => {
                          up("_timeMin", m);
                          const h = parseInt(form._timeHour || "12");
                          const ap = form._timeAP || "AM";
                          let h24 = h; if(ap==="PM"&&h!==12)h24+=12; if(ap==="AM"&&h===12)h24=0;
                          up("time", `${String(h24).padStart(2,"0")}:${m}`);
                        }} className={`w-full py-2 text-sm font-semibold cursor-pointer transition ${sel ? "bg-primary text-white" : "hover:bg-primary/10 text-foreground"}`}>{m}</button>;
                      })}
                    </div>
                    {/* AM/PM column */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="sticky top-0 bg-white text-[11px] font-bold text-primary text-center py-1.5 border-b border-primary/10">AM/PM</div>
                      {["AM","PM"].map((ap) => {
                        const sel = (form._timeAP || "") === ap;
                        return <button key={ap} type="button" onClick={() => {
                          up("_timeAP", ap);
                          const h = parseInt(form._timeHour || "12");
                          const m = form._timeMin || "00";
                          let h24 = h; if(ap==="PM"&&h!==12)h24+=12; if(ap==="AM"&&h===12)h24=0;
                          up("time", `${String(h24).padStart(2,"0")}:${m}`);
                        }} className={`w-full py-2 text-sm font-semibold cursor-pointer transition ${sel ? "bg-primary text-white" : "hover:bg-primary/10 text-foreground"}`}>{ap}</button>;
                      })}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={() => up("_timePickerOpen", false)}
                      className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-primary/90 transition shadow-sm">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-4">
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
            <div className="lg:col-span-4">
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
                {isMaster && <th className="px-3 py-3 text-left text-sm font-bold whitespace-nowrap">Created By</th>}
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
                    {isMaster && <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-[140px]" title={o.created_by_email}>{o.created_by_email || "—"}</td>}
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(o)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-primary/20 text-primary hover:bg-accent cursor-pointer transition">Edit</button>
                        <button onClick={() => handleDuplicate(o)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer transition" title="Duplicate">Duplicate</button>
                        <button onClick={() => handleDelete(o.id)} className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={isMaster ? 8 : 7} className="px-4 py-12 text-center text-muted-foreground">No opportunities found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
