"use client";

import { useState } from "react";
import app from "../../../lib/firebase";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const TYPES = ["Internship", "Workshop", "Event", "Volunteering"];
const INDUSTRIES = ["Healthcare", "Activism", "Business", "Humanities", "Education", "Environment", "Community Service", "STEM"];
const AGE_GROUPS = ["Elementary School", "Middle School", "High School", "College", "18+ Only", "All Ages"];

export default function OrganizerPortalPage() {
  const [form, setForm] = useState({ name: "", opportunity_type: "", organization: "", location: "", date: "", industry: "", age_group: "", description: "", link: "", contact_email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const up = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.opportunity_type || !form.organization) { alert("Please fill in required fields."); return; }
    setSubmitting(true);
    const db = getFirestore(app);
    await addDoc(collection(db, "opportunities"), { ...form, status: "pending" });
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Submitted!</h2>
        <p className="text-muted-foreground mt-2">Your opportunity has been submitted for review. We&apos;ll approve it within 24-48 hours.</p>
        <button onClick={() => { setSubmitted(false); setForm({ name: "", opportunity_type: "", organization: "", location: "", date: "", industry: "", age_group: "", description: "", link: "", contact_email: "" }); }} className="mt-6 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg cursor-pointer hover:bg-primary/90 transition">Submit Another</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Organizer&apos;s Portal</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Submit your organization&apos;s opportunity to reach hundreds of motivated students.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/60 shadow-sm p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Opportunity Name *</label><input value={form.name} onChange={(e) => up("name", e.target.value)} placeholder="e.g. Summer Volunteer Program" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Organization *</label><input value={form.organization} onChange={(e) => up("organization", e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Type *</label><select value={form.opportunity_type} onChange={(e) => up("opportunity_type", e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white"><option value="">Select</option>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Industry</label><select value={form.industry} onChange={(e) => up("industry", e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white"><option value="">Select</option>{INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Age Group</label><select value={form.age_group} onChange={(e) => up("age_group", e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-white"><option value="">Select</option>{AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Location</label><input value={form.location} onChange={(e) => up("location", e.target.value)} placeholder="City, State or Virtual" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Date</label><input type="date" value={form.date} onChange={(e) => up("date", e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm" /></div>
        </div>
        <div><label className="block text-sm font-medium text-foreground mb-1.5">Description</label><textarea value={form.description} onChange={(e) => up("description", e.target.value)} placeholder="Describe the opportunity in detail..." rows={4} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-vertical" /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Website / Signup Link</label><input value={form.link} onChange={(e) => up("link", e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Contact Email</label><input type="email" value={form.contact_email} onChange={(e) => up("contact_email", e.target.value)} placeholder="you@org.com" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
        </div>
        <button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg cursor-pointer hover:bg-primary/90 disabled:opacity-60 transition flex items-center justify-center gap-2">
          {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Submit Opportunity</>}
        </button>
      </form>
    </div>
  );
}
