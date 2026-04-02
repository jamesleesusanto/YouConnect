import Link from "next/link";

export default function Footer() {
  return (
    <footer id="footer" className="bg-foreground text-background/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-xl font-bold text-background tracking-tight">
              you<span className="text-primary italic">demonia</span>
            </span>
            <p className="mt-3 text-sm text-background/50 max-w-xs">
              Connecting high school students with nonprofits, community events, and meaningful opportunities.
            </p>
            <p className="mt-4 text-base font-bold text-background">
              Email: <a href="mailto:contact@youdemonia.org" className="hover:text-primary transition">contact@youdemonia.org</a>
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-background mb-4 uppercase tracking-wider">Navigate</h4>
            <div className="space-y-2">
              {[
                ["Platform", "/opportunities"],
                ["About", "/about"],
                ["Our Events", "/events"],
                ["Contact Us", "#footer"],
              ].map(([label, path]) => (
                <Link key={path} href={path} className="block text-sm hover:text-background transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-background mb-4 uppercase tracking-wider">Connect</h4>
            <div className="flex gap-4 mb-5">
              <a href="https://www.instagram.com/youdemonia_org/" target="_blank" rel="noopener noreferrer" className="text-background hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/youdemonia1" target="_blank" rel="noopener noreferrer" className="text-background hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
            <div className="flex gap-3">
              <Link href="/bylaws" className="px-5 py-2 rounded-lg bg-background text-foreground font-semibold text-sm hover:bg-background/90 transition">
                Bylaws
              </Link>
              <Link href="/donate" className="px-5 py-2 rounded-lg bg-background text-foreground font-semibold text-sm hover:bg-background/90 transition">
                Donate
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-background/10 text-left text-xs text-background/40">
          &copy; {new Date().getFullYear()} Youdemonia.
        </div>
      </div>
    </footer>
  );
}
