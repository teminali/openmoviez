// src/pages/SeriesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpDown, Timer, Tv } from "lucide-react";
import { getMovies } from "../firebase.js";
import MovieCard from "../components/MovieCard.jsx";
import {GENRE_LIST} from "../data.js";

/* -----------------------------
   Tailwind-only primitives
----------------------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const Shell = ({ children }) => (
    <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {children}
    </div>
);
const Container = ({ children }) => (
    <div className="mx-auto max-w-7xl px-4 md:px-6">{children}</div>
);
const Card = ({ className = "", children }) => (
    <div className={cx("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur", className)}>
        {children}
    </div>
);
const Pill = ({ children }) => (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border bg-white/5 border-white/10 text-slate-300">
    {children}
  </span>
);

/* -----------------------------
   Animations
----------------------------- */
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

/* -----------------------------
   Skeletons
----------------------------- */
function SkeletonGrid({ count = 15 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <div className="aspect-[11/16] bg-white/10 animate-pulse" />
                    <div className="p-3 space-y-2">
                        <div className="h-4 w-3/4 bg-white/10 animate-pulse rounded" />
                        <div className="h-3 w-1/3 bg-white/10 animate-pulse rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* -----------------------------
   Page
----------------------------- */
export default function SeriesPage() {
    const [seriesList, setSeriesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const sentinelRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // URL state
    const getParam = (key, def) => new URLSearchParams(location.search).get(key) || def;
    const [sort, setSort] = useState(() => getParam("sort", "recent"));
    const [genre, setGenre] = useState(() => getParam("genre", "all"));
    const [page, setPage] = useState(1);
    const pageSize = 24;

    // Sync URL from state
    useEffect(() => {
        const params = new URLSearchParams();
        if (genre !== "all") params.set("genre", genre);
        if (sort !== "recent") params.set("sort", sort);
        navigate(`?${params.toString()}`, { replace: true });
    }, [sort, genre, navigate]);

    // Resync when navigating history
    useEffect(() => {
        setSort(getParam("sort", "recent"));
        setGenre(getParam("genre", "all"));
    }, [location.search]);

    // Data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allContent = await getMovies();
                setSeriesList(allContent.filter((c) => c.type === "series"));
            } catch (err) {
                setErrorMessage("Failed to load series data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Build genre list from the centralized data file for consistency.
    const allGenres = useMemo(() => {
        // We start with "all" and add the sorted, lowercase list from our data file.
        return ["all", ...GENRE_LIST.map(g => g.toLowerCase()).sort()];
    }, []); // <-- Dependency array is now empty

    // Derived list with filtering/sorting
    const derived = useMemo(() => {
        let xs = [...seriesList];
        if (genre !== "all") {
            const g = String(genre).toLowerCase();
            xs = xs.filter((m) => (m.genres || []).map((x) => String(x).toLowerCase()).includes(g));
        }
        switch (sort) {
            case "rating":
                xs.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case "year":
                xs.sort((a, b) => (b.year || 0) - (a.year || 0));
                break;
            // "recent" leaves original order
            default:
                break;
        }
        return xs;
    }, [seriesList, sort, genre]);

    const visible = derived.slice(0, page * pageSize);
    const hasMore = visible.length < derived.length;

    // Reset pagination when filters change
    useEffect(() => setPage(1), [sort, genre]);

    // Infinite scroll observer
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) setPage((p) => p + 1);
            },
            { rootMargin: "600px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [sentinelRef.current, hasMore, isLoading]);

    // Helpers
    const humanize = (g) => (g === "all" ? "All genres" : g.replace(/\b\w/g, (c) => c.toUpperCase()));
    const showReset = genre !== "all" || sort !== "recent";
    const resetFilters = () => {
        setGenre("all");
        setSort("recent");
    };

    return (
        <Shell>
            {/* Sticky glass header */}
            <header className="mt-0 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
                <Container>
                    <div className="py-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                                <Tv className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">All TV Series</h1>
                                <p className="text-sm text-slate-400">Browse and filter the complete collection of series.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Pill>{derived.length} result{derived.length === 1 ? "" : "s"}</Pill>
                            {showReset && (
                                <button onClick={resetFilters} className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs">
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </Container>
            </header>

            <main className="py-8">
                <Container>
                    {/* Filters */}
                    <Card className="p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm capitalize"
                                    title="Filter by genre"
                                >
                                    {allGenres.map((g) => (
                                        <option key={g} value={g} className="capitalize">
                                            {humanize(g)}
                                        </option>
                                    ))}
                                </select>
                                <div className="inline-flex items-center gap-2 border border-white/10 rounded-xl px-2 py-1.5">
                                    <ArrowUpDown className="size-4 text-white/60" />
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="bg-transparent text-sm focus:outline-none"
                                        title="Sort"
                                    >
                                        <option value="recent">Recent</option>
                                        <option value="rating">Rating</option>
                                        <option value="year">Year</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Grid */}
                    <section className="mt-6">
                        {isLoading && page === 1 ? (
                            <SkeletonGrid count={15} />
                        ) : visible.length > 0 ? (
                            <motion.ul
                                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {visible.map((series) => (
                                    <motion.li key={series.id} variants={itemVariants}>
                                        <Link to={`/movie/${series.id}`}>
                                            <MovieCard movie={series} />
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        ) : (
                            <Card className="py-16 px-6 text-center">
                                <Timer className="w-10 h-10 mx-auto text-white/40 mb-3" />
                                <p className="text-white/70">No series found matching your criteria.</p>
                            </Card>
                        )}
                        {errorMessage && <p className="text-red-300 text-center mt-4">{errorMessage}</p>}
                    </section>

                    {/* Infinite scroll sentinel & footer note */}
                    <div ref={sentinelRef} className="h-24" />
                    {!isLoading && !hasMore && visible.length > 0 && (
                        <div className="text-center text-white/60">End of list</div>
                    )}
                </Container>
            </main>
        </Shell>
    );
}