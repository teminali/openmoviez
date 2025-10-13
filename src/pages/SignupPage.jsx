// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp } from "../firebase";
import {
    Eye, EyeOff, User, Mail, Lock, ArrowLeft, UserPlus
} from "lucide-react";

const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function SignupPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail]     = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw]   = useState(false);
    const [error, setError]     = useState("");
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        if (!username.trim()) {
            setError("Please enter a display name.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setSubmitting(true);
        try {
            await signUp(email.trim(), password, username.trim());
            navigate("/dashboard");
        } catch (err) {
            const msg =
                err?.message ||
                "Failed to create an account. The email might already be in use.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
            <main className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-14">
                <div className="max-w-md mx-auto">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 md:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]">
                        {/* Title */}
                        <div className="mb-6">
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                                Create your account
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">
                                Join MovieShare to track, rate, and share what you watch.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignup} className="space-y-4" noValidate>
                            {/* Username */}
                            <div>
                                <label className="text-sm text-slate-300" htmlFor="username">
                                    Display Name
                                </label>
                                <div className="mt-1 relative">
                                    <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="e.g. John Wick"
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
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
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
                                <UserPlus className={cx("w-4 h-4", submitting && "animate-pulse")} />
                                {submitting ? "Creating account…" : "Create account"}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="h-px bg-white/10 flex-1" />
                            <span className="text-xs text-slate-400">or</span>
                            <div className="h-px bg-white/10 flex-1" />
                        </div>

                        {/* Login link */}
                        <p className="text-center text-sm text-slate-300">
                            Already have an account?{" "}
                            <Link to="/login" className="text-indigo-300 hover:text-indigo-200 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <p className="text-center text-[11px] text-slate-500 mt-4">
                        By creating an account, you agree to our Terms and acknowledge our Privacy Policy.
                    </p>
                </div>
            </main>
        </div>
    );
}