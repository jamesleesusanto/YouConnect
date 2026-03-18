"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";

export default function LoginPage() {
  const { user, login, signup } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) { router.push("/admin"); return null; }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (isSignUp && !name) { setError("Please enter your name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (isSignUp) await signup(email, password, name);
      else await login(email, password);
      router.push("/admin");
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) setError("Invalid email or password.");
      else if (code.includes("already-in-use")) setError("An account with this email already exists.");
      else setError(err?.message || "Something went wrong.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-foreground tracking-tight">
              you<span className="text-primary italic">demonia</span>
            </span>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            {isSignUp ? "Create an account to manage opportunities" : "Sign in to your member portal"}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3 rounded-xl text-sm transition cursor-pointer">
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="text-primary font-semibold hover:underline cursor-pointer">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
