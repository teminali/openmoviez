// src/pages/WatchlistPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    Film, Trash2, Grid, List, ArrowUpDown, Search,
    X, Layers, ChevronLeft
} from "lucide-react";
import { getWatchlist, getMoviesByIds, removeFromWatchlist } from "../firebase";
import WatchlistMovieCard from "../components/WatchlistMovieCard.jsx";

/* -----------------------------
   Tailwind-only primitives
----------------------------- */
const cx = (...xs) => xs.filter(Boolean).join(" ");
const Shell = ({ children }) => (
    <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {children}
    </div>
);
const Container = ({ children }) => (
    <div className="mx-auto max-w-7xl px-4 md:px-6">{children}</div>
);
const Card = ({ className = "", children }) => (
    <div className={cx("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur", className)}>{children}</div>
);
const Pill = ({ children }) => (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border bg-white/5 border-white/10 text-slate-300">
    {children}
  </span>
);

/* -----------------------------
   Constants & helpers
----------------------------- */
const SORTS = [
    { id: "added_desc", label: "Recently Added" },
    { id: "title_asc", label: "Title A→Z" },
    { id: "year_desc", label: "Year ↓" },
    { id: "year_asc", label: "Year ↑" },
    { id: "rating_desc", label: "Rating ↓" },
];
const TYPE_FILTERS = [
    { id: "all", label: "All" },
    { id: "movie", label: "Movies" },
    { id: "series", label: "TV" },
];

/* -----------------------------
   Page
----------------------------- */
export default function WatchlistPage() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [watchlistMovies, setWatchlistMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // UI state
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("added_desc");
    const [type, setType] = useState("all");
    const [view, setView] = useState("grid"); // grid | list

    // Selection state
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const anySelected = selectedIds.size > 0;

    // Pagination (client-side infinite scroll)
    const [page, setPage] = useState(1);
    const pageSize = view === "grid" ? 24 : 12;
    const sentinelRef = useRef(null);

    // Load watchlist
    useEffect(() => {
        if (!currentUser) return;
        let mounted = true;
        (async () => {
            setIsLoading(true);
            try {
                const movieIds = await getWatchlist(currentUser.uid); // [{id, addedAt?}] or [id]
                const justIds = Array.isArray(movieIds)
                    ? movieIds.map((m) => (typeof m === "string" ? m : m.id))
                    : [];
                const movies = justIds.length ? await getMoviesByIds(justIds) : [];

                const addedAtMap = new Map();
                movieIds.forEach((m) => {
                    if (typeof m !== "string" && m?.id) addedAtMap.set(m.id, m.addedAt || Date.now());
                });
                const enriched = movies.map((m) => ({ ...m, _addedAt: addedAtMap.get(m.id) || Date.now() }));

                if (mounted) setWatchlistMovies(enriched);
            } catch (err) {
                console.error("Error fetching watchlist:", err);
                if (mounted) setError("Failed to load your watchlist. Please try again later.");
            } finally {
                if (mounted) setIsLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [currentUser]);

    // Derived list (search/filter/sort)
    const filteredSorted = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = watchlistMovies.filter((m) => {
            const byType = type === "all" || m.type === type;
            const byQuery = !q || m.title?.toLowerCase().includes(q) || m.genres?.join(" ").toLowerCase().includes(q);
            return byType && byQuery;
        });
        switch (sort) {
            case "title_asc":
                list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
                break;
            case "year_desc":
                list.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            case "year_asc":
                list.sort((a, b) => (a.year || 0) - (b.year || 0));
                break;
            case "rating_desc":
                list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            default: // added_desc
                list.sort((a, b) => (b._addedAt || 0) - (a._addedAt || 0));
        }
        return list;
    }, [watchlistMovies, query, sort, type]);

    // Pagination slices
    const visible = filteredSorted.slice(0, page * pageSize);
    const hasMore = visible.length < filteredSorted.length;

    // Reset page on view/filter/sort/search change
    useEffect(() => setPage(1), [view, sort, type, query]);

    // Infinite scroll observer
    useEffect(() => {
        const el = sentinelRef.current; if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) setPage((p) => p + 1);
            },
            { rootMargin: "600px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [sentinelRef.current, hasMore, isLoading]);

    // Selection helpers
    const toggleSelect = (id) => setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const clearSelection = () => setSelectedIds(new Set());

    // Remove handlers
    const handleRemove = async (movie) => {
        if (!currentUser) return;
        setWatchlistMovies((prev) => prev.filter((m) => m.id !== movie.id)); // optimistic
        try {
            await (removeFromWatchlist ? removeFromWatchlist(currentUser.uid, movie.id) : Promise.resolve());
        } catch {
            // on failure, we would ideally refetch. For now, show error & ignore rollback.
            setError("Failed to remove item. Try again.");
        }
    };
    const handleBulkRemove = async () => {
        if (!currentUser || !anySelected) return;
        const ids = Array.from(selectedIds);
        setWatchlistMovies((prev) => prev.filter((m) => !ids.includes(m.id))); // optimistic
        clearSelection();
        try {
            if (removeFromWatchlist) {
                await Promise.all(ids.map((id) => removeFromWatchlist(currentUser.uid, id)));
            }
        } catch {
            setError("Some items could not be removed. Try again.");
        }
    };

    if (!currentUser) {
        return (
            <Shell>
                <main className="min-h-[60vh] grid place-items-center text-center">
                    <div>
                        <h2 className="text-2xl font-semibold">Please sign in</h2>
                        <p className="mt-2 text-slate-400">Log in to view and manage your watchlist.</p>
                        <Link to="/login" className="mt-4 inline-block rounded-xl bg-indigo-500/90 hover:bg-indigo-500 border border-white/10 px-4 py-2">
                            Go to Login
                        </Link>
                    </div>
                </main>
            </Shell>
        );
    }

    return (
        <Shell>
            {/* Sticky glass header */}
            <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
                <Container>
                    <div className="py-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                                <Film className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Watchlist</h1>
                                <p className="text-sm text-slate-400">All the titles you’ve saved to watch later.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Pill>{filteredSorted.length} item{filteredSorted.length === 1 ? "" : "s"}</Pill>
                        </div>
                    </div>
                </Container>
            </header>

            <main className="py-8">
                <Container>
                    {/* Filters & Controls */}
                    <Card className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                            {/* Left controls: search + type + sort */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="size-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search titles…"
                                        className="pl-8 pr-7 py-2 text-sm rounded-xl bg-white/5 border border-white/10 placeholder-slate-400 focus:outline-none focus:border-white/20"
                                    />
                                    {query && (
                                        <button
                                            onClick={() => setQuery("")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                                            aria-label="Clear search"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Type filter */}
                                <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
                                    {TYPE_FILTERS.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setType(t.id)}
                                            className={cx("px-3 py-2 text-sm", type === t.id ? "bg-white/10" : "hover:bg-white/5")}
                                            title={`Filter: ${t.label}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Sort */}
                                <div className="inline-flex items-center gap-2 border border-white/10 rounded-xl px-2 py-1.5">
                                    <ArrowUpDown className="size-4 text-slate-400" />
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="bg-transparent text-sm focus:outline-none"
                                        title="Sort"
                                    >
                                        {SORTS.map((s) => (
                                            <option key={s.id} value={s.id}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Right controls: view + select mode + bulk */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* View toggle */}
                                <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
                                    <button
                                        onClick={() => setView("grid")}
                                        className={cx("px-3 py-2", view === "grid" ? "bg-white/10" : "hover:bg-white/5")}
                                        title="Grid view"
                                    >
                                        <Grid className="size-4" />
                                    </button>
                                    <button
                                        onClick={() => setView("list")}
                                        className={cx("px-3 py-2", view === "list" ? "bg-white/10" : "hover:bg-white/5")}
                                        title="List view"
                                    >
                                        <List className="size-4" />
                                    </button>
                                </div>

                                {/* Select mode */}
                                <div className="inline-flex rounded-xl border border-white/10 overflow-hidden">
                                    <button
                                        onClick={() => setSelectMode((v) => !v)}
                                        className={cx("px-3 py-2 text-sm", selectMode ? "bg-white/10" : "hover:bg-white/5")}
                                        title="Toggle select mode"
                                    >
                                        <Layers className="size-4 inline mr-1" /> {selectMode ? "Cancel" : "Select"}
                                    </button>
                                    {selectMode && (
                                        <>
                                            <button onClick={clearSelection} className="px-3 py-2 text-sm hover:bg-white/5">Clear</button>
                                            <button
                                                onClick={handleBulkRemove}
                                                disabled={!anySelected}
                                                className={cx("px-3 py-2 text-sm", anySelected ? "hover:bg-white/5" : "opacity-50 cursor-not-allowed")}
                                            >
                                                Remove
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Content */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-8">
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                                    <div className="aspect-[2/3] bg-white/10 animate-pulse" />
                                    <div className="p-3 space-y-2">
                                        <div className="h-4 w-3/4 bg-white/10 animate-pulse rounded" />
                                        <div className="h-3 w-1/3 bg-white/10 animate-pulse rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <Card className="p-8 text-center mt-8">
                            <p className="text-red-300">{error}</p>
                        </Card>
                    ) : filteredSorted.length > 0 ? (
                        <>
                            {view === "grid" ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-8">
                                    {visible.map((movie) => (
                                        <WatchlistMovieCard
                                            key={movie.id}
                                            movie={movie}
                                            view="grid"
                                            onRemove={handleRemove}
                                            selectable={selectMode}
                                            selected={selectedIds.has(movie.id)}
                                            onToggleSelect={() => toggleSelect(movie.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-6 space-y-4">
                                    {visible.map((movie) => (
                                        <WatchlistMovieCard
                                            key={movie.id}
                                            movie={movie}
                                            view="list"
                                            onRemove={handleRemove}
                                            selectable={selectMode}
                                            selected={selectedIds.has(movie.id)}
                                            onToggleSelect={() => toggleSelect(movie.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Infinite scroll sentinel */}
                            <div ref={sentinelRef} className="h-20" />
                            {!hasMore && filteredSorted.length > 0 && (
                                <div className="text-center text-slate-400 mt-6">End of list</div>
                            )}
                        </>
                    ) : (
                        <Card className="text-center py-16 px-6 mt-8">
                            <Film className="w-12 h-12 mx-auto text-white/40 mb-4" />
                            <h2 className="text-xl font-semibold">Your Watchlist is Empty</h2>
                            <p className="mt-2 text-slate-400">Add movies and shows to your watchlist to see them here.</p>
                            <Link
                                to="/"
                                className="mt-6 inline-block bg-indigo-500/90 hover:bg-indigo-500 border border-white/10 text-white font-medium py-2 px-5 rounded-xl transition-colors"
                            >
                                Discover Movies
                            </Link>
                        </Card>
                    )}

                    {/* Back link */}
                    <div className="mt-10">
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
                            <ChevronLeft className="size-4" /> Back to Home
                        </Link>
                    </div>
                </Container>
            </main>
        </Shell>
    );
}