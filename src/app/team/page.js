"use client";

import { useState } from "react";

const EXEC_BOARD = [
  {
    name: "Nathan George",
    title: "Founder and CEO",
    photo: "/team/nathan.jpg",
    linkedin: "https://linkedin.com/in/nathangeorge",
    bio: "Senior at Northville High School; Tutor for School On Wheels Nonprofit; Supply Chain Intern at Prime Healthcare; Youth Group Leader at Our Lady Of Victory Church",
    fullBio: "Nathan founded Youdemonia in 2020 with the vision of combating social disparities through community-based events. Under his leadership, the organization has grown to serve thousands of students across Michigan and beyond. He is passionate about creating equal access to opportunities for all students regardless of their socioeconomic background.",
  },
  {
    name: "James Susanto",
    title: "Chief Operating Officer",
    photo: "/team/james.jpg",
    linkedin: "https://linkedin.com/in/jamessusanto",
    bio: "Senior at Northville High School. Mentor, Musician, and academic at the Regional and State Level. Web Development Intern for The Detroit Cancer Screening Initiative.",
    fullBio: "James oversees the day-to-day operations of Youdemonia, ensuring smooth execution of events and platform development. His background in web development has been instrumental in building the YouConnect platform. He brings a unique blend of technical expertise and community engagement to the team.",
  },
  {
    name: "Tejas Kota",
    title: "Chief Financial Officer",
    photo: "/team/tejas.jpg",
    linkedin: "https://linkedin.com/in/tejaskota",
    bio: "Varsity tennis at Northville High School, digital marketing intern at Info Services LLC, member of DECA and HOSA, communications chair at Fostering Connections.",
    fullBio: "Tejas manages the financial operations and fundraising efforts for Youdemonia. His experience in digital marketing and business competitions through DECA has given him strong skills in budgeting, strategic planning, and partnership development.",
  },
];

const TEAM_MEMBERS = [
  { name: "Member 1", title: "Director of Outreach", photo: "/team/placeholder.jpg" },
  { name: "Member 2", title: "Director of Marketing", photo: "/team/placeholder.jpg" },
  { name: "Member 3", title: "Director of Events", photo: "/team/placeholder.jpg" },
];

export default function TeamPage() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      {/* Executive Board */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Executive Board</h1>
        <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
        {EXEC_BOARD.map((person, i) => (
          <div key={person.name} className="flex flex-col">
            {/* Photo */}
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-5">
              <img
                src={person.photo}
                alt={person.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.classList.add("flex", "items-center", "justify-center");
                  const initials = document.createElement("span");
                  initials.className = "text-4xl font-bold text-muted-foreground/40";
                  initials.textContent = person.name.split(" ").map((n) => n[0]).join("");
                  e.target.parentElement.appendChild(initials);
                }}
              />
            </div>

            {/* Name + LinkedIn */}
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-foreground">{person.name}</h3>
              {person.linkedin && (
                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <svg className="w-7 h-7 text-[#0077B5]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-4">{person.title}</p>

            {/* Bio */}
            <p className="text-sm text-foreground leading-relaxed mb-3">
              {person.bio}
            </p>

            {/* Read More */}
            {person.fullBio && (
              <>
                {expanded === i && (
                  <p className="text-sm text-foreground leading-relaxed mb-3">{person.fullBio}</p>
                )}
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="text-primary text-sm font-medium hover:underline cursor-pointer self-start"
                >
                  {expanded === i ? "Show Less" : "Read More"}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Additional team members placeholder */}
      {TEAM_MEMBERS.length > 0 && (
        <>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Team Members</h2>
            <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {TEAM_MEMBERS.map((person) => (
              <div key={person.name} className="flex flex-col items-center text-center">
                <div className="w-48 h-48 rounded-full overflow-hidden bg-muted mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-muted-foreground/30">
                    {person.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">{person.name}</h3>
                <p className="text-sm text-muted-foreground">{person.title}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
