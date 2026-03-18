"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

const NAV_LINKS = [
  { label: "YouConnect Platform", path: "/opportunities" },
  { label: "About", path: "/about" },
  { label: "Tutorials", path: "/tutorials" },
  { label: "Our Events", path: "/events" },
  { label: "Press", path: "/press" },
  { label: "Contact Us", path: "/contact" },
  { label: "Organizer's Portal", path: "/organizer" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 shrink-0">
            <span className="text-xl font-bold text-foreground tracking-tight">
              you<span className="text-primary italic">demonia</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              // Only show admin link if logged in
              if (link.path === "/organizer" && !user) return null;
              // Show admin link to logged-in users
              const adminLink = link.path === "/organizer" && user
                ? { ...link, path: "/admin", label: "Admin Portal" }
                : link;

              return (
                <Link
                  key={adminLink.path}
                  href={adminLink.path}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    pathname === adminLink.path
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {adminLink.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth + Mobile */}
          <div className="flex items-center gap-3">
            {!loading && (
              user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden sm:flex items-center gap-2 border border-primary/20 text-primary hover:bg-primary hover:text-white text-sm font-medium px-4 py-2 rounded-md transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Log In
                </Link>
              )
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 rounded-lg hover:bg-muted cursor-pointer"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-border/50 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              if (link.path === "/organizer" && !user) return null;
              const adminLink = link.path === "/organizer" && user
                ? { ...link, path: "/admin", label: "Admin Portal" }
                : link;
              return (
                <Link
                  key={adminLink.path}
                  href={adminLink.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    pathname === adminLink.path
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {adminLink.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border/50">
              {user ? (
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium">{user.displayName || user.email}</span>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center bg-primary text-white font-medium py-3 rounded-lg"
                >
                  Log In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
