// src/pages/AdminPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    ShieldCheck,
    Film,
    Users,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Eye,
    UserX,
    UserCheck,
    Shield,
    ShieldOff,
    Loader2,
    Search,
    RefreshCw,
    Filter,
    MoreHorizontal,
    BadgeCheck,
    Ban,
    Sparkles,
    TrendingUp,
    Clock,
} from "lucide-react";
import {
    getAllUsers,
    getAllMoviesAdmin,
    updateUserAsAdmin,
    verifyMovie,
    deleteMovie,
} from "../firebase";
import { useAuth } from "../context/AuthContext";

// ---------- Small helpers ----------
const classNames = (...c) => c.filter(Boolean).join(" ");

const Pill = ({ tone = "slate", children }) => (
    <span
        className={classNames(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
            tone === "slate" && "bg-white/5 border-white/10 text-slate-300",
            tone === "green" && "bg-emerald-500/10 border-emerald-400/20 text-emerald-300",
            tone === "amber" && "bg-amber-500/10 border-amber-400/20 text-amber-300",
            tone === "red" && "bg-red-500/10 border-red-400/20 text-red-300"
        )}
    >
    {children}
  </span>
);

const Card = ({ children, className = "" }) => (
    <div
        className={classNames(
            "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5",
            className
        )}
    >
        {children}
    </div>
);

const IconBox = ({ children }) => (
    <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center shrink-0">
        {children}
    </div>
);

const LoadingBar = () => (
    <div className="w-full h-1 overflow-hidden rounded bg-white/5">
        <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-white/40" />
        <style>{`
      @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(300%); }
      }
    `}</style>
    </div>
);

// ---------- Overview Header ----------
function OverviewHeader({ onRefresh, refreshing, counts }) {
    const items = [
        { label: "Total Users", value: counts.users, icon: Users },
        { label: "Admins", value: counts.admins, icon: ShieldCheck },
        { label: "Blocked", value: counts.blocked, icon: Ban },
        { label: "Movies", value: counts.movies, icon: Film },
        { label: "Verified", value: counts.verified, icon: BadgeCheck },
        { label: "Pending Review", value: counts.unverified, icon: Clock },
    ];

    return (
        <Card className="p-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <IconBox>
                        <ShieldCheck className="size-5 text-red-400" />
                    </IconBox>
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                            Admin Panel
                        </h1>
                        <p className="text-sm text-slate-400">
                            Moderate users & content with confidence.
                        </p>
                    </div>
                </div>
                <button
                    onClick={onRefresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
                >
                    <RefreshCw className={classNames("size-4", refreshing && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {refreshing && <div className="px-5 pt-3"><LoadingBar /></div>}

            <div className="p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {items.map((s) => (
                    <Card key={s.label} className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                                    {s.label}
                                </p>
                                <p className="mt-2 text-2xl font-semibold">{s.value}</p>
                            </div>
                            <IconBox>
                                <s.icon className="size-5" />
                            </IconBox>
                        </div>
                    </Card>
                ))}
            </div>
        </Card>
    );
}

// ---------- Users Tab ----------
function AdminUsersTab() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const { currentUser } = useAuth();

    const fetchUsers = useCallback(() => {
        setLoading(true);
        getAllUsers()
            .then(setUsers)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleToggle = async (user) => {
        if (user.id === currentUser.uid) {
            alert("You cannot change your own role.");
            return;
        }
        await updateUserAsAdmin(user.id, { isAdmin: !user.isAdmin });
        fetchUsers();
    };

    const handleBlockToggle = async (user) => {
        if (user.id === currentUser.uid) {
            alert("You cannot block yourself.");
            return;
        }
        await updateUserAsAdmin(user.id, { isBlocked: !user.isBlocked });
        fetchUsers();
    };

    const filtered = useMemo(() => {
        return users
            .filter((u) =>
                q.trim()
                    ? (u.displayName || "").toLowerCase().includes(q.toLowerCase()) ||
                    (u.email || "").toLowerCase().includes(q.toLowerCase())
                    : true
            )
            .filter((u) => (roleFilter === "all" ? true : roleFilter === "admin" ? u.isAdmin : !u.isAdmin))
            .filter((u) => (statusFilter === "all" ? true : statusFilter === "blocked" ? u.isBlocked : !u.isBlocked));
    }, [users, q, roleFilter, statusFilter]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search users by name or email…"
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                            title="Filter by role"
                        >
                            <option value="all">All roles</option>
                            <option value="admin">Admins</option>
                            <option value="user">Users</option>
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                            title="Filter by status"
                        >
                            <option value="all">All status</option>
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                        </select>
                    </div>
                    <div className="hidden md:block">
                        <button
                            onClick={fetchUsers}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
                        >
                            <Filter className="size-4" />
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            <Card>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h2 className="text-base font-medium">Manage Users</h2>
                    <Pill tone="slate">{filtered.length} result(s)</Pill>
                </div>

                {loading ? (
                    <div className="py-6">
                        <LoadingBar />
                        <div className="mt-4 grid gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-10 rounded bg-white/5" />
                            ))}
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                        No users match your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl mt-4">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5">
                            <tr className="text-left">
                                <th className="px-4 py-3">Display Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                            {filtered.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-4 py-3">{user.displayName || "—"}</td>
                                    <td className="px-4 py-3 text-white/70">{user.email || "—"}</td>
                                    <td className="px-4 py-3">
                      <span
                          className={classNames(
                              "inline-flex items-center gap-1.5 text-xs font-medium",
                              user.isAdmin ? "text-red-400" : "text-white/70"
                          )}
                      >
                        {user.isAdmin ? <Shield size={14} /> : <UserCheck size={14} />}
                          {user.isAdmin ? "Admin" : "User"}
                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                      <span
                          className={classNames(
                              "inline-flex items-center gap-1.5 text-xs font-medium",
                              user.isBlocked ? "text-amber-400" : "text-emerald-400"
                          )}
                      >
                        {user.isBlocked ? <UserX size={14} /> : <CheckCircle size={14} />}
                          {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <button
                                            onClick={() => handleRoleToggle(user)}
                                            title={user.isAdmin ? "Demote to User" : "Promote to Admin"}
                                            className="p-1.5 rounded-md hover:bg-white/10"
                                        >
                                            {user.isAdmin ? (
                                                <ShieldOff size={14} className="text-red-400" />
                                            ) : (
                                                <Shield size={14} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleBlockToggle(user)}
                                            title={user.isBlocked ? "Unblock User" : "Block User"}
                                            className="p-1.5 rounded-md hover:bg-white/10"
                                        >
                                            {user.isBlocked ? (
                                                <UserCheck size={14} className="text-emerald-400" />
                                            ) : (
                                                <UserX size={14} />
                                            )}
                                        </button>
                                        <button
                                            className="p-1.5 rounded-md hover:bg-white/10"
                                            title="More"
                                        >
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ---------- Movies Tab ----------
function AdminMoviesTab() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchMovies = useCallback(() => {
        setLoading(true);
        getAllMoviesAdmin()
            .then(setMovies)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    const handleVerifyToggle = async (movie) => {
        await verifyMovie(movie.id, !movie.isVerified);
        fetchMovies();
    };

    const handleDelete = async (movieId) => {
        if (window.confirm("Delete this movie permanently?")) {
            await deleteMovie(movieId);
            fetchMovies();
        }
    };

    const filtered = useMemo(() => {
        return movies
            .filter((m) =>
                q.trim()
                    ? (m.title || "").toLowerCase().includes(q.toLowerCase()) ||
                    (m.uploaderName || "").toLowerCase().includes(q.toLowerCase())
                    : true
            )
            .filter((m) =>
                statusFilter === "all"
                    ? true
                    : statusFilter === "verified"
                        ? !!m.isVerified
                        : !m.isVerified
            );
    }, [movies, q, statusFilter]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search movies by title or uploader…"
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                    title="Filter by status"
                >
                    <option value="all">All status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                </select>
                <button
                    onClick={fetchMovies}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
                >
                    <RefreshCw className="size-4" />
                    Reload
                </button>
            </div>

            <Card>
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h2 className="text-base font-medium">Manage Movies & Reviews</h2>
                    <Pill tone="slate">{filtered.length} result(s)</Pill>
                </div>

                {loading ? (
                    <div className="py-6">
                        <LoadingBar />
                        <div className="mt-4 grid gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-10 rounded bg-white/5" />
                            ))}
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">
                        No movies match your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl mt-4">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5">
                            <tr className="text-left">
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Uploader</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                            {filtered.map((movie) => (
                                <tr key={movie.id}>
                                    <td className="px-4 py-3">{movie.title}</td>
                                    <td className="px-4 py-3 text-white/70">
                                        {movie.uploaderName || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleVerifyToggle(movie)}
                                            className={classNames(
                                                "flex items-center gap-1.5 text-xs font-medium",
                                                movie.isVerified ? "text-emerald-400" : "text-amber-400"
                                            )}
                                        >
                                            {movie.isVerified ? (
                                                <CheckCircle size={14} />
                                            ) : (
                                                <XCircle size={14} />
                                            )}
                                            {movie.isVerified ? "Verified" : "Unverified"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <Link
                                            to={`/movie/${movie.id}`}
                                            title="View Movie"
                                            className="p-1.5 rounded-md hover:bg-white/10"
                                        >
                                            <Eye size={14} />
                                        </Link>
                                        <Link
                                            to={`/share/${movie.id}`}
                                            title="Edit Movie"
                                            className="p-1.5 rounded-md hover:bg-white/10"
                                        >
                                            <Edit size={14} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(movie.id)}
                                            title="Delete Movie"
                                            className="p-1.5 rounded-md hover:bg-white/10 text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}

// ---------- Admin Page (Tabs + Layout) ----------
export default function AdminPage() {
    const [active, setActive] = useState("overview");
    const [counts, setCounts] = useState({
        users: 0,
        admins: 0,
        blocked: 0,
        movies: 0,
        verified: 0,
        unverified: 0,
    });
    const [refreshing, setRefreshing] = useState(false);

    const computeCounts = async () => {
        setRefreshing(true);
        try {
            const [u, m] = await Promise.all([getAllUsers(), getAllMoviesAdmin()]);
            const admins = u.filter((x) => x.isAdmin).length;
            const blocked = u.filter((x) => x.isBlocked).length;
            const verified = m.filter((x) => x.isVerified).length;
            const unverified = m.length - verified;
            setCounts({
                users: u.length,
                admins,
                blocked,
                movies: m.length,
                verified,
                unverified,
            });
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        computeCounts();
    }, []);

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
            {/* Sticky header to match Dashboard */}
            <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
                    <IconBox>
                        <ShieldCheck className="size-5 text-red-400" />
                    </IconBox>
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                            Administration
                        </h1>
                        <p className="text-sm text-slate-400">
                            Industrial-grade controls & moderation.
                        </p>
                    </div>
                    <div className="flex-1" />
                    <button
                        onClick={computeCounts}
                        className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-sm inline-flex items-center gap-2"
                    >
                        <RefreshCw className={classNames("size-4", refreshing && "animate-spin")} />
                        Sync Stats
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <aside className="md:col-span-1">
                    <nav className="flex flex-col space-y-2">
                        {[
                            { key: "overview", label: "Overview", icon: Sparkles },
                            { key: "movies", label: "Movies", icon: Film },
                            { key: "users", label: "Users", icon: Users },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setActive(t.key)}
                                className={classNames(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-left",
                                    active === t.key ? "bg-white/10" : "hover:bg-white/5"
                                )}
                            >
                                <t.icon className="size-5" />
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Content */}
                <section className="md:col-span-3 space-y-6">
                    {active === "overview" && (
                        <>
                            <OverviewHeader
                                onRefresh={computeCounts}
                                refreshing={refreshing}
                                counts={counts}
                            />
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2">
                                    <h3 className="text-base font-medium">Moderation Activity (Demo)</h3>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Recent moderation insights to help you act quickly.
                                    </p>
                                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider text-slate-400">
                                                        Reviews Cleared
                                                    </p>
                                                    <p className="mt-2 text-2xl font-semibold">128</p>
                                                </div>
                                                <IconBox>
                                                    <TrendingUp className="size-5" />
                                                </IconBox>
                                            </div>
                                        </Card>
                                        <Card className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider text-slate-400">
                                                        Reports Resolved
                                                    </p>
                                                    <p className="mt-2 text-2xl font-semibold">56</p>
                                                </div>
                                                <IconBox>
                                                    <BadgeCheck className="size-5" />
                                                </IconBox>
                                            </div>
                                        </Card>
                                        <Card className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider text-slate-400">
                                                        Accounts Flagged
                                                    </p>
                                                    <p className="mt-2 text-2xl font-semibold">7</p>
                                                </div>
                                                <IconBox>
                                                    <Ban className="size-5" />
                                                </IconBox>
                                            </div>
                                        </Card>
                                    </div>
                                </Card>

                                <Card>
                                    <h3 className="text-base font-medium">Quick Links</h3>
                                    <div className="mt-4 grid gap-3">
                                        <Link
                                            to="/dashboard?tab=manage"
                                            className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 flex items-center gap-3"
                                        >
                                            <Film className="size-5" />
                                            <span className="font-medium">Manage My Movies</span>
                                        </Link>
                                        <Link
                                            to="/share"
                                            className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 flex items-center gap-3"
                                        >
                                            <Edit className="size-5" />
                                            <span className="font-medium">Add New Movie</span>
                                        </Link>
                                    </div>
                                </Card>
                            </div>
                        </>
                    )}

                    {active === "users" && <AdminUsersTab />}
                    {active === "movies" && <AdminMoviesTab />}
                </section>
            </main>
        </div>
    );
}