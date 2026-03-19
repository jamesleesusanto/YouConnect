"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div>
      {/* Our Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-10">Our Story</h1>
        <div className="grid md:grid-cols-[1fr_320px] gap-12 items-start">
          <div className="space-y-6 text-[15px] leading-relaxed text-foreground">
            <p>
              Despite being one of the fastest growing economic hubs in The United States,
              Detroit, MI, has one major problem - an all-time low{" "}
              <a href="https://www.bridgemi.com/talent-education/michigan-college-enrollment-decline" className="text-primary hover:underline">
                51% of students are enrolling in higher education programs
              </a>
              . Given the{" "}
              <a href="https://www.census.gov/quickfacts/detroitcitymichigan" className="text-primary hover:underline">
                31.5+% of the population living below the poverty line
              </a>
              , for most families, every dollar and minute is put towards putting food on the table,
              leaving academic opportunities widely unused. And it&apos;s not just Detroit; students
              all over the world are trapped in a poverty cycle where they do not have exposure to
              the resources they need to break out and succeed.
            </p>
            <p>
              Youdemonia was founded in 2020 to combat social disparities through community-based
              events and has since refocused{" "}
              <Link href="/about" className="text-primary hover:underline">
                to specifically promote opportunity awareness for students
              </Link>
              . Since our beginnings in early 2020, we&apos;ve been driven by the same ideas we
              initially founded our organization upon: support, empowerment, and progress.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
              <img
                src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=600&h=450&fit=crop"
                alt="YouDemonia Team"
                className="w-full h-full object-cover"
              />
            </div>
            <Link
              href="/team"
              className="mt-3 text-primary font-semibold text-sm tracking-wider uppercase hover:underline"
            >
              Meet The Team
            </Link>
          </div>
        </div>
      </section>

      {/* What is Opportunity Awareness */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight text-center mb-10">
            What is Opportunity Awareness?
          </h2>
          <div className="space-y-6 text-[15px] leading-relaxed">
            <p className="text-foreground">
              Opportunity Awareness is &quot;the ability of students to know about work opportunities and their requirements&quot;
            </p>
            <p className="text-foreground">
              At Youdemonia, our goal is to promote Opportunity Awareness!
            </p>
            <p className="text-primary italic">
              (In simple terms, there are thousands of resources geared towards students that go unused because
              they simply don&apos;t know about them. At Youdemonia, we work to increase the accessibility to
              these resources by creating an easy-access one stop shop for all academic and pre-professional opportunities)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
