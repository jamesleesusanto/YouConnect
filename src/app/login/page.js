"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";

export default function LoginPage() {
  const { user, userRole, login, loginWithGoogle, signup, resetPassword } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState(""); // "student" or "organizer"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user) {
      if (userRole === "student") router.push("/opportunities");
      else router.push("/admin");
    }
  }, [user, userRole, router]);
  if (user) return null;

  const labelClass = "block text-xs font-bold text-primary uppercase tracking-wide mb-1.5";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    if (isSignUp) {
      if (!name) { setError("Please enter your name."); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
      if (!selectedRole) { setError("Please select whether you are a Student or Organizer."); return; }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password, name, selectedRole);
        setVerificationSent(true);
      } else {
        await login(email, password, rememberMe);
      }
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) setError("Invalid email or password.");
      else if (code.includes("already-in-use")) setError("An account with this email already exists.");
      else if (code.includes("weak-password")) setError("Password must be at least 6 characters.");
      else if (code.includes("invalid-email")) setError("Please enter a valid email address.");
      else setError(err?.message || "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("not-found")) setError("No account found with this email.");
      else if (code.includes("invalid-email")) setError("Please enter a valid email address.");
      else setError(err?.message || "Failed to send reset email.");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/admin");
    } catch (err) {
      if (err?.code !== "auth/popup-closed-by-user") setError(err?.message || "Google sign-in failed.");
    } finally { setLoading(false); }
  }

  // Verification sent screen
  if (verificationSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Verify Your Email</h2>
            <p className="text-sm text-muted-foreground mb-6">
              We&apos;ve sent a verification link to <span className="font-semibold text-foreground">{email}</span>. Please check your inbox and click the link to activate your account.
            </p>
            {selectedRole === "organizer" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-4">
                Your organizer account is pending admin approval. You&apos;ll be able to post opportunities once approved.
              </div>
            )}
            <p className="text-xs text-muted-foreground mb-6">
              Don&apos;t see it? Check your spam folder.
            </p>
            <button
              onClick={() => { setVerificationSent(false); setIsSignUp(false); setPassword(""); setConfirmPassword(""); }}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl text-sm transition cursor-pointer"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password screen
  if (isForgotPassword) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-border/60 p-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-foreground tracking-tight">
                you<span className="text-primary italic">demonia</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-6">Enter your email to receive a password reset link.</p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-5">{success}</div>}

            {!resetSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3 rounded-xl text-sm transition cursor-pointer">
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-sm text-muted-foreground">Check your email for the reset link.</p>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              <button onClick={() => { setIsForgotPassword(false); setResetSent(false); setError(""); setSuccess(""); }} className="text-primary font-semibold hover:underline cursor-pointer">
                Back to Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main login/signup form
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
                <label className={labelClass}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            )}
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>

            {/* Password with show/hide */}
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-12 border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password (sign up only) */}
            {isSignUp && (
              <div>
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password"
                    className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 ${confirmPassword && confirmPassword !== password ? "border-red-400 focus:border-red-400" : "border-border focus:border-primary"}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1">
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {confirmPassword && confirmPassword === password && confirmPassword.length >= 6 && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Passwords match
                  </p>
                )}
              </div>
            )}

            {/* Role selector (sign up only) */}
            {isSignUp && (
              <div>
                <label className={labelClass}>I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setSelectedRole("student")}
                    className={`py-4 rounded-xl border-2 transition cursor-pointer flex flex-col items-center gap-2 ${selectedRole === "student" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <svg className={`w-8 h-8 ${selectedRole === "student" ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>
                    <span className={`text-sm font-semibold ${selectedRole === "student" ? "text-primary" : "text-foreground"}`}>Student</span>
                    <span className="text-[11px] text-muted-foreground">Browse & save opportunities</span>
                  </button>
                  <button type="button" onClick={() => setSelectedRole("organizer")}
                    className={`py-4 rounded-xl border-2 transition cursor-pointer flex flex-col items-center gap-2 ${selectedRole === "organizer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <svg className={`w-8 h-8 ${selectedRole === "organizer" ? "text-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span className={`text-sm font-semibold ${selectedRole === "organizer" ? "text-primary" : "text-foreground"}`}>Organizer</span>
                    <span className="text-[11px] text-muted-foreground">Post & manage opportunities</span>
                  </button>
                </div>
                {selectedRole === "organizer" && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Organizer accounts require admin approval before you can post opportunities.
                  </p>
                )}
              </div>
            )}

            {/* Remember me + Forgot password (sign in only) */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setRememberMe(!rememberMe)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition cursor-pointer ${rememberMe ? "bg-primary border-primary" : "border-border"}`}>
                    {rememberMe && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button type="button" onClick={() => { setIsForgotPassword(true); setError(""); }}
                  className="text-sm text-primary font-medium hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading || (isSignUp && password !== confirmPassword)}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3 rounded-xl text-sm transition cursor-pointer">
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-muted-foreground uppercase tracking-wide">or</span></div>
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-border/60 hover:bg-muted disabled:opacity-60 text-foreground font-medium py-3 rounded-xl text-sm transition cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setPassword(""); setConfirmPassword(""); }} className="text-primary font-semibold hover:underline cursor-pointer">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
