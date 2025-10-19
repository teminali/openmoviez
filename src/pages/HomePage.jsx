import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, Flame, Tv, ChevronLeft, ChevronRight, User, Users } from "lucide-react";

// --- Firebase Imports ---
import {
    getMovies,
    getTrendingMovies,
    onAuthChange,
    getWatchlist,
    getTopPeople,
    getRecentPeople, // NEW
} from "../firebase.js";

// --- Component Imports ---
import MovieCard from "../components/MovieCard.jsx";
import TrendingMovieCard from "../components/TrendingMovieCard.jsx";
import HeroBanner from "../components/HeroBanner.jsx";

/* -----------------------------
   Tailwind-only UI primitives
----------------------------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const Shell = ({ children }) => (
    <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {children}
    </div>
);
const Container = ({ children, className = "" }) => (
    <div className={cx("mx-auto max-w-7xl px-4 md:px-6", className)}>{children}</div>
);
const Card = ({ className = "", children }) => (
    <div className={cx("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur", className)}>{children}</div>
);
const SectionHeader = ({ icon: Icon, title, to }) => (
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            {Icon && <Icon className="size-5" />} {title}
        </h2>
        {to && (
            <Link to={to} className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
                View All
            </Link>
        )}
    </div>
);

/* -----------------------------
   Animations
----------------------------- */
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

/* -----------------------------
   Horizontal Rail with controls
----------------------------- */
function useRailControls(ref) {
    const scrollBy = (amt) => {
        if (ref.current) ref.current.scrollBy({ left: amt, behavior: "smooth" });
    };
    return { prev: () => scrollBy(-(ref.current?.clientWidth || 600)), next: () => scrollBy(ref.current?.clientWidth || 600) };
}

function TrendingRail({ items }) {
    const listRef = useRef(null);
    const { prev, next } = useRailControls(listRef);
    if (!items?.length) return null;
    return (
        <section>
            <SectionHeader icon={Flame} title="Trending" />
            <div className="relative">
                <button
                    onClick={prev}
                    className="hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
                    aria-label="Previous"
                >
                    <ChevronLeft className="size-5" />
                </button>
                <button
                    onClick={next}
                    className="hidden md:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
                    aria-label="Next"
                >
                    <ChevronRight className="size-5" />
                </button>
                <div ref={listRef} className="hide-scrollbar overflow-x-auto pr-2">
                    <ul className="flex gap-8">{items.map((m, index) => <TrendingMovieCard key={m.id} movie={m} index={index} />)}</ul>
                </div>
            </div>
        </section>
    );
}

function TopActorsRail({ items }) {
    const listRef = useRef(null);
    const { prev, next } = useRailControls(listRef);

    if (!items?.length) {
        return (
            <section>
                <SectionHeader icon={Users} title="Top Actors" />
                <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                    <p className="text-white/70">No people to show yet.</p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <SectionHeader icon={Users} title="Top Actors" />
            <div className="relative">
                <button
                    onClick={prev}
                    className="hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
                    aria-label="Previous"
                >
                    <ChevronLeft className="size-5" />
                </button>
                <button
                    onClick={next}
                    className="hidden md:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
                    aria-label="Next"
                >
                    <ChevronRight className="size-5" />
                </button>
                <div ref={listRef} className="hide-scrollbar overflow-x-auto pr-2">
                    <ul className="flex gap-6">
                        {items.map((person) => (
                            <li key={person.id}>
                                <Link to={`/person/${person.id}`} className="flex flex-col items-center gap-2 group">
                                    <div className="size-24 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-colors bg-white/5 grid place-items-center">
                                        {person.profilePicURL ? (
                                            <img src={person.profilePicURL} alt={person.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="size-10 text-slate-500" />
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-center w-24 truncate group-hover:text-white transition-colors">
                                        {person.name}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

/* -----------------------------
   Loading skeletons
----------------------------- */
function SkeletonGrid({ rows = 2, cols = 5 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: rows * cols }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[11/16] rounded-xl bg-white/5 border border-white/10" />
                    <div className="h-3 w-3/4 mt-2 rounded bg-white/10" />
                </div>
            ))}
        </div>
    );
}
function SkeletonActors({ count = 8 }) {
    return (
        <div className="flex gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col items-center gap-2">
                    <div className="size-24 rounded-full bg-white/5 border border-white/10" />
                    <div className="h-3 w-20 rounded bg-white/10" />
                </div>
            ))}
        </div>
    );
}

/* -----------------------------
   Page Component
----------------------------- */
export default function HomePage() {
    const [allContent, setAllContent] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [topActors, setTopActors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [user, setUser] = useState(null);
    const [watchlist, setWatchlist] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const userWatchlist = await getWatchlist(firebaseUser.uid);
                setWatchlist(userWatchlist);
            } else {
                setUser(null);
                setWatchlist([]);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [content, trending, top] = await Promise.all([getMovies(), getTrendingMovies(), getTopPeople(12)]);
                setAllContent(content);

                // People: use top; if empty, fallback to recent
                let peopleToShow = top || [];
                if (!peopleToShow || peopleToShow.length === 0) {
                    peopleToShow = await getRecentPeople(12);
                }
                setTopActors(peopleToShow);

                // Trending movies: enrich with full movie details
                const trendingIds = trending.map((t) => t.movie_id).filter(Boolean);
                if (trendingIds.length > 0) {
                    const moviesData = content.length > 0 ? content : await getMovies();
                    const fullTrendingMovies = trending
                        .map((t) => {
                            const movieDetails = moviesData.find((m) => m.id === t.movie_id);
                            return movieDetails ? { ...t, ...movieDetails } : null;
                        })
                        .filter(Boolean);
                    setTrendingMovies(fullTrendingMovies);
                }
            } catch (err) {
                console.error(err);
                setErrorMessage("Failed to load movie data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const movies = useMemo(() => allContent.filter((c) => c.type !== "series").slice(0, 10), [allContent]);
    const series = useMemo(() => allContent.filter((c) => c.type === "series").slice(0, 10), [allContent]);

    return (
        <Shell>
            {!isLoading && !errorMessage && trendingMovies.length > 0 && (
                <HeroBanner items={trendingMovies.slice(0, 8)} user={user} watchlist={watchlist} setWatchlist={setWatchlist} />
            )}
            <main className="py-8">
                <Container>
                    {isLoading ? (
                        <div className="space-y-10">
                            <Card className="p-5">
                                <div className="h-6 w-40 rounded bg-white/10 mb-4" />
                                <SkeletonActors />
                            </Card>
                            <Card className="p-5">
                                <div className="h-6 w-40 rounded bg-white/10 mb-4" />
                                <SkeletonGrid rows={1} cols={5} />
                            </Card>
                        </div>
                    ) : errorMessage ? (
                        <Card className="p-8 text-center">
                            <p className="text-red-300">{errorMessage}</p>
                        </Card>
                    ) : (
                        <div className="space-y-10">
                            <Card className="p-5">
                                <TrendingRail items={trendingMovies.slice(0, 16)} />
                            </Card>

                            {/* Always render People card; TopActorsRail handles empty state */}
                            <Card className="p-5">
                                <TopActorsRail items={topActors} />
                            </Card>

                            <Card className="p-5">
                                <SectionHeader icon={Film} title="Movies" to="/movies" />
                                {movies.length > 0 ? (
                                    <motion.ul
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {movies.map((movie) => (
                                            <motion.li key={movie.id} variants={itemVariants}>
                                                <MovieCard movie={movie} />
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                ) : (
                                    <div className="text-center py-10 px-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/5">
                                        <p className="text-white/70">No movies have been shared yet.</p>
                                    </div>
                                )}
                            </Card>

                            <Card className="p-5">
                                <SectionHeader icon={Tv} title="TV Series" to="/series" />
                                {series.length > 0 ? (
                                    <motion.ul
                                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {series.map((item) => (
                                            <motion.li key={item.id} variants={itemVariants}>
                                                <MovieCard movie={item} />
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                ) : (
                                    <div className="text-center py-10 px-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/5">
                                        <p className="text-white/70">No TV series have been shared yet.</p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </Container>
            </main>
        </Shell>
    );
}