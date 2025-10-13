// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { logIn } from "../firebase";
import { Eye, EyeOff, LogIn as LogInIcon, Mail, Lock, ArrowLeft } from "lucide-react";

const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await logIn(email.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            // Surface Firebase error messages (e.g., "auth/invalid-credential", "account disabled", etc.)
            const msg = err?.message || "Failed to log in. Please check your credentials.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            {/* Page header spacing handled by the sticky navbar above */}
            <main className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
                <div className="max-w-md mx-auto">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    {/* Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 md:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
                        {/* Title */}
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                                Welcome back
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Sign in to continue to MovieShare.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4" noValidate>
                            {/* Email */}
                            <div>
                                <label className="text-sm text-slate-300" htmlFor="email">
                                    Email
                                </label>
                                <div className="mt-1 relative">
                                    <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className={cx(
                                            "w-full pl-9 pr-3 py-2.5 rounded-xl",
                                            "bg-white/5 border border-white/10",
                                            "text-white placeholder-white/40",
                                            "focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-sm text-slate-300" htmlFor="password">
                                    Password
                                </label>
                                <div className="mt-1 relative">
                                    <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="password"
                                        type={showPw ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className={cx(
                                            "w-full pl-9 pr-11 py-2.5 rounded-xl",
                                            "bg-white/5 border border-white/10",
                                            "text-white placeholder-white/40",
                                            "focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw((v) => !v)}
                                        aria-label={showPw ? "Hide password" : "Show password"}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5"
                                    >
                                        {showPw ? (
                                            <EyeOff className="w-4 h-4 text-white/70" />
                                        ) : (
                                            <Eye className="w-4 h-4 text-white/70" />
                                        )}
                                    </button>
                                </div>
                                {/* Optional forgot password route if you have it */}
                                {/* <Link to="/forgot-password" className="inline-block mt-2 text-xs text-indigo-300 hover:text-indigo-200">Forgot password?</Link> */}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-3 py-2">
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className={cx(
                                    "w-full inline-flex items-center justify-center gap-2",
                                    "rounded-xl bg-indigo-500/90 hover:bg-indigo-500",
                                    "px-4 py-2.5 font-medium",
                                    submitting && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                <LogInIcon className={cx("w-4 h-4", submitting && "animate-pulse")} />
                                {submitting ? "Signing in…" : "Sign in"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="h-px bg-white/10 flex-1" />
                            <span className="text-xs text-slate-400">or</span>
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        {/* Sign up link */}
                        <p className="text-center text-sm text-slate-300">
                            Don’t have an account?{" "}
                            <Link to="/signup" className="text-indigo-300 hover:text-indigo-200 font-medium">
                                Create one
                            </Link>
                        </p>
                    </div>

                    {/* Fine print */}
                    <p className="text-center text-[11px] text-slate-500 mt-4">
                        By continuing, you agree to our <Link to="/terms" className="text-indigo-300 hover:text-indigo-200 font-medium">
                        Terms of Use
                    </Link> and acknowledge our <Link to="/privacy" className="text-indigo-300 hover:text-indigo-200 font-medium">
                        Privacy Policy
                    </Link>.
                    </p>
                </div>
            </main>
        </div>
    );
}