"use client";

const VALUES = [
  { title: "Community First", desc: "We believe every student deserves access to meaningful opportunities in their community, regardless of background.", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { title: "Bridge the Gap", desc: "We connect young people directly with nonprofits and organizations that need their passion and energy.", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { title: "Empower Youth", desc: "High school students are capable of incredible impact. We give them the tools to find where they fit.", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { title: "Open Access", desc: "Our platform is free for students and organizations, making community service accessible to everyone.", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="max-w-2xl">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">About Us</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight">Connecting students with the world around them.</h1>
            <p className="text-lg text-muted-foreground mt-6 leading-relaxed">YouDemonia was created by students, for students. We saw how hard it was to find volunteering, internships, and community events — so we built a platform to make it effortless.</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Our Mission</h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">We&apos;re on a mission to eliminate the barriers between high school students and impactful community experiences. Whether it&apos;s a weekend volunteer event, a summer internship at a nonprofit, or a workshop to build skills — we want every student to find it in one place.</p>
            <p className="text-muted-foreground mt-4 leading-relaxed">We partner with nonprofits, community organizations, and schools to curate a diverse range of opportunities across industries like healthcare, education, environment, STEM, and more.</p>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-accent overflow-hidden">
              <img src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&h=600&fit=crop" alt="Students collaborating" className="w-full h-full object-cover mix-blend-multiply" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground tracking-tight text-center mb-12">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={v.icon} /></svg>
                </div>
                <h3 className="font-semibold text-foreground text-lg">{v.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
