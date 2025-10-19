// src/pages/DashboardPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMoviesByUserId } from "../firebase";

import { Film, Clapperboard, UploadCloud, Settings, TrendingUp, Star, Eye, Clock, Search, User as UserIcon } from "lucide-react";
import ManageMoviesTab from "../components/ManageMoviesTab"; // Assuming you place the tab files in components
import ProfileSettingsTab from "../components/ProfileSettingsTab"; // Assuming you place the tab files in components


// The main view of the dashboard
function DashboardHome({ stats, quickActions, recentMovies, draft, onClearDraft }) {
    const trends = [
        { title: "Views (7d)", value: "+18%", sub: "12,418", icon: TrendingUp },
        { title: "New Favorites", value: "+9%", sub: "1,032", icon: TrendingUp },
        { title: "Watch Time", value: "+23%", sub: "842h", icon: TrendingUp },
    ];

    return (
        <div className="space-y-8">
            {/* KPIs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400">{s.label}</p>
                                <p className="mt-2 text-2xl font-semibold">{s.value}</p>
                            </div>
                            <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                                <s.icon className="size-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Quick Actions & Trends */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    {/* DRAFT SECTION - START */}
                    {draft && (
                        <div className="mb-6 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4">
                            <h3 className="font-medium text-slate-100">Continue Editing Your Draft</h3>
                            <p className="text-sm text-slate-300 mt-1">
                                {draft.title ? `You were working on "${draft.title}".` : "You have an unsaved draft."}
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <Link to="/share" className="inline-flex items-center justify-center rounded-lg bg-indigo-500/90 hover:bg-indigo-500 px-3.5 py-2 text-sm font-medium transition">
                                    Resume
                                </Link>
                                <button
                                    onClick={onClearDraft}
                                    className="inline-flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-100 hover:bg-white/10 px-3.5 py-2 text-sm font-medium transition"
                                >
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                    {/* DRAFT SECTION - END */}

                    <h2 className="text-base font-medium">Quick Actions</h2>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {quickActions.map((a) => (
                            <Link
                                key={a.label}
                                to={a.to}
                                className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 flex items-center gap-3"
                            >
                                <a.icon className="size-5" />
                                <span className="font-medium">{a.label}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Recently Added */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Recently Added</h3>
                            <Link to="/dashboard?tab=manage" className="text-xs text-indigo-300 hover:text-indigo-200">View all</Link>
                        </div>
                        <ul className="mt-3 divide-y divide-white/5">
                            {recentMovies.slice(0, 4).map(movie => (
                                <li key={movie.id} className="py-3 flex items-center gap-3">
                                    <img src={movie.posterURL} alt={movie.title} className="size-10 rounded-lg object-cover bg-white/10" />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium">{movie.title}</p>
                                        <p className="text-xs text-slate-400">{movie.genres?.[0]} • {movie.year}</p>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1"><Star className="size-4"/> {movie.rating || 'N/A'}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                    <h2 className="text-base font-medium">This Week (Demo)</h2>
                    {trends.map((t) => (
                        <div key={t.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-slate-400">{t.title}</p>
                                    <p className="mt-2 text-2xl font-semibold">{t.value}</p>
                                    <p className="text-xs text-slate-400">{t.sub}</p>
                                </div>
                                <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                                    <t.icon className="size-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </aside>
            </section>
        </div>
    );
}


export default function DashboardPage() {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [userMovies, setUserMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState(null);

    // Check for a draft in localStorage when the component mounts
    useEffect(() => {
        const savedDraft = localStorage.getItem("movieShareDraft");
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (Object.keys(parsed).length > 0 && !parsed.__restored) {
                    setDraft(parsed);
                }
            } catch (e) {
                console.error("Failed to parse movie draft", e);
                localStorage.removeItem("movieShareDraft"); // Clear corrupted draft
            }
        }
    }, []);

    const clearDraft = () => {
        localStorage.removeItem("movieShareDraft");
        setDraft(null);
    };

    const refetchMovies = async () => {
        if (!currentUser) return;
        const movies = await getMoviesByUserId(currentUser.uid);
        setUserMovies(movies);
    };

    useEffect(() => {
        if (currentUser) {
            refetchMovies().finally(() => setLoading(false));
        }
    }, [currentUser]);

    const stats = useMemo(() => {
        const total = userMovies.length;
        // This is a simplified example; a `status` field in your movie data would make this more robust.
        const published = userMovies.filter(m => m.isActive !== false).length;
        const drafts = total - published;
        const avgRating = total > 0
            ? (userMovies.reduce((acc, m) => acc + (m.rating || 0), 0) / total).toFixed(1)
            : "N/A";

        return [
            { label: "Total Movies", value: total, icon: Film },
            { label: "Published", value: published, icon: Clapperboard },
            { label: "Drafts", value: drafts, icon: Clock },
            { label: "Avg. Rating", value: avgRating, icon: Star },
        ];
    }, [userMovies]);

    const quickActions = [
        { label: "Add Movie", icon: UploadCloud, to: "/share" },
        { label: "Manage Movies", icon: Clapperboard, to: "/dashboard?tab=manage" },
        { label: "Profile Settings", icon: Settings, to: "/dashboard?tab=profile" },
    ];

    const activeTab = useMemo(() => new URLSearchParams(location.search).get('tab'), [location.search]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'manage':
                return <ManageMoviesTab movies={userMovies} refetchMovies={refetchMovies} />;
            case 'profile':
                return <ProfileSettingsTab />;
            default:
                return <DashboardHome stats={stats} quickActions={quickActions} recentMovies={userMovies} draft={draft} onClearDraft={clearDraft} />;
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-black grid place-items-center text-white">Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
            <header className="mt-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                        <UserIcon className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Creator Dashboard</h1>
                        <p className="text-sm text-slate-400">Welcome back, {currentUser?.displayName || 'Creator'}.</p>
                    </div>
                    <div className="flex-1" />
                    <Link
                        to="/share"
                        className="rounded-xl bg-indigo-500/90 hover:bg-indigo-500 transition px-4 py-2 text-sm font-medium"
                    >
                        New Movie
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8">
                {renderTabContent()}
            </main>
        </div>
    );
}