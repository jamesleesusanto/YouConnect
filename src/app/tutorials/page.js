"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS = [
  {
    q: "How Do I Know All Events Are Safe/Secure?",
    a: "Safety is a top priority for the Youdemonia Team. Through our organizer registration process, we manually verify and meet with each organization seeking to join our network to ensure ONLY high-quality, safe events are published on our platform.",
  },
  {
    q: "What Types of Opportunities Are Available on Youdemonia?",
    a: "We offer a wide range of internships, volunteering events, community-building workshops, and miscellaneous education-related opportunities on our platform. However, our team is always working on expanding these options. In the near future, we plan to introduce scholarship opportunities as well!",
  },
  {
    q: "How is Youdemonia Structured?",
    a: "Youdemonia is a 501(c)(3) Pending Organization headquartered at The University of Pennsylvania. We operate under a board of directors and have an international team that works to find local resources and integrate them into the larger Youdemonia platform.",
  },
  {
    q: "How Can I Join Youdemonia?",
    a: "We are excited to offer social media content creation positions year-round for those interested in expanding their marketing/social media portfolios. Youdemonia also accepts team members for our Operations and Outreach departments on a need-based basis. For more information, send us an email at nathan@youdemonia.org",
  },
];

export default function TutorialsPage() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div>
      {/* Content with same gradient as homepage hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/40" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent/40 rounded-full blur-2xl" />
        <div className="absolute top-[500px] left-[-100px] w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-[900px] right-[-80px] w-[250px] h-[250px] bg-accent/30 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          {/* Hero */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight font-[var(--font-playfair)] relative inline-block">
              <span className="absolute left-[0px] right-[0px] bottom-[2px] h-[45%] bg-primary/20 -z-10 rounded-sm" />
              Welcome to our tutorials page!
            </h1>
            <p className="text-foreground mt-5 text-base">
              If you are an organizer looking to publish your events on our platform, click here:{" "}
              <Link href="/login" className="text-foreground font-semibold underline decoration-2 underline-offset-2 hover:text-primary transition">
                uploading events tutorial
              </Link>
            </p>
            <p className="text-muted-foreground mt-4 text-base">
              All other users see the video tutorial below to get started!
            </p>
          </div>

          {/* User Video Tutorial */}
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight font-[var(--font-playfair)] mb-4 underline decoration-primary/30 decoration-2 underline-offset-4">User Video Tutorial</h2>
            <p className="text-foreground text-sm leading-relaxed">
              Are you looking for academic and career-building events geared toward students in your local area?
              Look no further, Youdemonia&apos;s Opportunity Awareness Platform is here!{" "}
              <span className="text-primary underline decoration-1 underline-offset-2">Check out this user tutorial video below to see how it works.</span>
            </p>
          </div>

          {/* Video Embed Placeholder */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-border/40 shadow-sm aspect-video flex items-center justify-center relative overflow-hidden mb-16">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 hover:bg-primary/20 transition cursor-pointer">
                <svg className="w-10 h-10 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground font-medium">Video tutorial coming soon</p>
              <p className="text-xs text-muted-foreground mt-1">YouTube or Vimeo embed will go here</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/40 mb-16" />

          {/* FAQ Section */}
          <div className="pb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight font-[var(--font-playfair)] text-center mb-10">
              Frequently Asked Questions
            </h2>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl border border-border/40 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-white/90 transition"
                  >
                    <span className="font-semibold text-foreground pr-4">{faq.q}</span>
                    <svg
                      className={`w-5 h-5 text-primary shrink-0 transition-transform duration-200 ${openIdx === i ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${openIdx === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="px-6 pb-6 text-sm text-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
