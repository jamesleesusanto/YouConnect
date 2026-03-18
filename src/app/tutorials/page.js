"use client";

import { useState } from "react";

const TUTORIALS = [
  { id: "1", title: "Getting Started with YouConnect", category: "Getting Started", content: "Welcome to YouConnect! Here's how to get started:\n\n1. Browse the Platform — Head to the YouConnect Platform tab to see all available opportunities.\n2. Use Filters — Narrow your search by industry, age group, or opportunity type.\n3. Save Favorites — Click the heart icon on any opportunity to save it for later.\n4. Export — Download your favorited opportunities as a CSV file to keep track." },
  { id: "2", title: "How to Find the Right Opportunity", category: "Finding Opportunities", content: "Finding the perfect match:\n\n- Know your interests — Think about what industries excite you (STEM, healthcare, environment, etc.).\n- Consider your schedule — Filter by date to find opportunities that work with your calendar.\n- Check location — Use location filters to find local opportunities.\n- Read descriptions — Click 'More Info' for full details about each opportunity." },
  { id: "3", title: "Tips for Applying to Opportunities", category: "Applying", content: "Make your application stand out:\n\n- Be genuine — Share why you're passionate about the cause.\n- Highlight experience — Even informal experience counts (school clubs, family projects).\n- Follow instructions — Read the application requirements carefully.\n- Follow up — If you haven't heard back in a week, send a polite follow-up email." },
  { id: "4", title: "For Organizers: Posting Opportunities", category: "For Organizers", content: "Want to post your organization's opportunities?\n\n1. Go to the Organizer's Portal tab.\n2. Fill in the details about your opportunity.\n3. Submit for review — our team will approve it within 24-48 hours.\n4. Your opportunity will appear on the platform for students to discover!" },
];

export default function TutorialsPage() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Tutorials & Guides</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Everything you need to know about finding and applying to opportunities.</p>
      </div>

      <div className="space-y-3">
        {TUTORIALS.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
            <button onClick={() => setOpenId(openId === t.id ? null : t.id)} className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-accent/30 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.category}</p>
                </div>
              </div>
              <svg className={`w-4 h-4 text-muted-foreground transition-transform ${openId === t.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openId === t.id && (
              <div className="px-6 pb-6 pl-19 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{t.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
