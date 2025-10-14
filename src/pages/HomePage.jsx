// src/pages/HomePage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Film, Flame, Tv, ChevronLeft, ChevronRight, Play, Check, Plus
} from "lucide-react";

// --- Firebase Imports ---
import {
    getMovies,
    getTrendingMovies,
    onAuthChange,
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist
} from "../firebase.js";

// --- Component Imports ---
import MovieCard from "../components/MovieCard.jsx";
import TrendingMovieCard from "../components/TrendingMovieCard.jsx";
import { APP_NAME } from "../data.js";

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
    <div className={cx("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur", className)}>
        {children}
    </div>
);
const SectionHeader = ({ icon: Icon, title, to }) => (
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-semibold flex items-center gap-2">
            {Icon && <Icon className="size-5" />} {title}
        </h2>
        {to && (
            <Link
                to={to}
                className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
            >
                View All
            </Link>
        )}
    </div>
);

/* -----------------------------
   Animations & Hooks
----------------------------- */
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } };

function useReducedMotion() {
    const [pref, setPref] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const apply = () => setPref(!!mq.matches);
        apply();
        mq.addEventListener?.("change", apply);
        return () => mq.removeEventListener?.("change", apply);
    }, []);
    return pref;
}

function useVisibility() {
    const [hidden, setHidden] = useState(document.hidden);
    useEffect(() => {
        const onVis = () => setHidden(document.hidden);
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);
    return hidden;
}

/* -----------------------------
   HERO BANNER
----------------------------- */
function truncate(str = "", n = 160) {
    if (str.length <= n) return str;
    const cut = str.slice(0, n);
    const last = cut.lastIndexOf(" ");
    return (last > 80 ? cut.slice(0, last) : cut) + "…";
}

const MAX_SLIDES = 5;

const useCarousel = ({ itemCount, autoplayDelay = 5500, reducedMotion }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const pageHidden = useVisibility();
    const navigate = useNavigate();
    const goTo = useCallback((index) => setActiveIndex((current) => (index + itemCount) % itemCount), [itemCount]);
    const goToNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
    const goToPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
    useEffect(() => {
        if (reducedMotion || isPaused || pageHidden || !autoplayDelay) return;
        const timer = setInterval(goToNext, autoplayDelay);
        return () => clearInterval(timer);
    }, [goToNext, autoplayDelay, isPaused, pageHidden, reducedMotion]);
    const swipeRef = useRef({ startX: 0, isDragging: false });
    const onPointerDown = (e) => { swipeRef.current = { isDragging: true, startX: e.clientX ?? e.touches?.[0]?.clientX ?? 0 }; };
    const onPointerUp = (e) => {
        if (!swipeRef.current.isDragging) return;
        swipeRef.current.isDragging = false;
        const endX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
        const deltaX = endX - swipeRef.current.startX;
        if (Math.abs(deltaX) > 50) { deltaX > 0 ? goToPrev() : goToNext(); }
    };
    const handleKeyDown = useCallback((e) => {
        const keyMap = { ArrowLeft: goToPrev, ArrowRight: goToNext, Home: () => goTo(0), End: () => goTo(itemCount - 1) };
        if (keyMap[e.key]) { e.preventDefault(); keyMap[e.key](); }
    }, [goToPrev, goToNext, goTo, itemCount]);
    return { activeIndex, goTo, goToNext, goToPrev, pause: () => setIsPaused(true), resume: () => setIsPaused(false), eventHandlers: { onKeyDown: handleKeyDown, onPointerDown, onPointerUp, onTouchStart: onPointerDown, onTouchEnd: onPointerUp } };
};

export function HeroBanner({ items = [], user, watchlist = [], setWatchlist }) {
    const navigate = useNavigate();
    const reducedMotion = useReducedMotion();
    const slides = useMemo(() => items.slice(0, MAX_SLIDES), [items]);
    const { activeIndex, goTo, goToNext, goToPrev, pause, resume, eventHandlers } = useCarousel({ itemCount: slides.length, reducedMotion });

    if (!slides.length) return null;
    const currentSlide = slides[activeIndex];
    const isInList = user && watchlist.includes(currentSlide.id);

    const handleToggleWatchlist = async (e) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login'); // Redirect to login if not authenticated
            return;
        }

        try {
            if (isInList) {
                await removeFromWatchlist(user.uid, currentSlide.id);
                setWatchlist(prev => prev.filter(id => id !== currentSlide.id)); // Update UI instantly
            } else {
                await addToWatchlist(user.uid, currentSlide.id);
                setWatchlist(prev => [...prev, currentSlide.id]); // Update UI instantly
            }
        } catch (error) {
            console.error("Failed to update watchlist:", error);
        }
    };

    const bg = currentSlide.coverURL || currentSlide.backdropURL || currentSlide.posterURL || "";
    const slideVariants = { enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }) };

    return (
        <section
            className="relative w-full overflow-hidden select-none group focus:outline-none"
            aria-roledescription="carousel" aria-label="Trending content" tabIndex={0}
            onFocus={pause} onBlur={resume} onMouseEnter={pause} onMouseLeave={resume} {...eventHandlers}
        >
            <title>{APP_NAME} | Find & Stream Your Favorite Movies</title>
            <meta name="description" content="Search for top-rated movies, discover trending films, and stream them directly from your browser." />
            <div className="relative w-full min-h-[600px] h-[30vw] max-h-[400px]">
                <AnimatePresence initial={false} custom={1}>
                    <motion.div key={activeIndex} className="absolute inset-0 h-full w-full" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}>
                        {bg ? <img src={bg} alt={`Promotional image for ${currentSlide.title}`} loading="eager" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />}
                    </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end text-white py-4 sm:py-6 md:py-8">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
                    <div className="max-w-3xl">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mb-2">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/10 border border-white/15 tracking-wide">TRENDING</span>
                            {currentSlide.year && <span className="text-xs text-white/70">{currentSlide.year}</span>}
                            {currentSlide.runtime && <span className="text-xs text-white/70">{currentSlide.runtime} min</span>}
                        </div>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight drop-shadow-lg">{currentSlide.title || "Untitled"}</p>
                        {currentSlide.description && <p className="mt-2 text-sm text-white/80 max-w-[500px] line-clamp-2 sm:line-clamp-3">{truncate(currentSlide.description, 1000)}</p>}
                        <div className="mt-5 mb-[120px]">
                            <button onClick={() => navigate(`/watch/${currentSlide.id}`)} className="mr-5 inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold shadow-lg shadow-black/30">
                                <Play className="w-5 h-5" /> <p>Watch Now</p>
                            </button>
                            {user && (
                                <button onClick={handleToggleWatchlist} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border font-semibold shadow-lg shadow-black/30 transition-colors ${isInList ? 'bg-white/90 text-black' : 'bg-transparent text-white hover:bg-white hover:text-black'}`}>
                                    {isInList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    <p>{isInList ? 'In List' : 'Add List'}</p>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {slides.length > 1 && (
                <>
                    <button onClick={goToPrev} aria-label="Previous slide" className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={goToNext} aria-label="Next slide" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"><ChevronRight className="w-6 h-6" /></button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {slides.map((_, index) => (<button key={index} onClick={() => goTo(index)} aria-label={`Go to slide ${index + 1}`} className={`h-2 w-2 rounded-full transition-colors ${activeIndex === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`} />))}
                    </div>
                </>
            )}
            <div className="sr-only" aria-live="polite" aria-atomic="true">Slide {activeIndex + 1} of {slides.length}: {currentSlide.title}</div>
        </section>
    );
}

/* -----------------------------
   Horizontal Rail with controls
----------------------------- */
function useRailControls(ref) {
    const scrollBy = (amt) => { if (ref.current) ref.current.scrollBy({ left: amt, behavior: "smooth" }); };
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
                <button onClick={prev} className="hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10" aria-label="Previous"><ChevronLeft className="size-5" /></button>
                <button onClick={next} className="hidden md:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10" aria-label="Next"><ChevronRight className="size-5" /></button>
                <div ref={listRef} className="hide-scrollbar overflow-x-auto pr-2">
                    <ul className="flex gap-8">
                        {items.map((m, index) => <TrendingMovieCard key={m.id} movie={m} index={index} />)}
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

/* -----------------------------
   Page Component
----------------------------- */
export default function HomePage() {
    const [allContent, setAllContent] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [user, setUser] = useState(null);
    const [watchlist, setWatchlist] = useState([]);

    // --- Authentication Effect ---
    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch watchlist when user logs in
                const userWatchlist = await getWatchlist(firebaseUser.uid);
                setWatchlist(userWatchlist);
            } else {
                setUser(null);
                setWatchlist([]); // Clear watchlist on logout
            }
        });
        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [content, trending] = await Promise.all([ getMovies(), getTrendingMovies() ]);
                setAllContent(content);
                const trendingIds = trending.map((t) => t.movie_id).filter(Boolean);
                if (trendingIds.length > 0) {
                    const moviesData = content.length > 0 ? content : await getMovies();
                    const fullTrendingMovies = trending.map((t) => {
                        const movieDetails = moviesData.find((m) => m.id === t.movie_id);
                        // FIX: Ensure the unique `id` from the trending document (`t`) is used for the key.
                        // By spreading movieDetails first, then t, `t.id` will overwrite `movieDetails.id`.
                        return movieDetails ? { ...movieDetails, ...t } : null;
                    }).filter(Boolean);
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
                            <Card className="p-5"><div className="h-6 w-40 rounded bg-white/10 mb-4" /><SkeletonGrid rows={1} cols={5} /></Card>
                            <Card className="p-5"><div className="h-6 w-40 rounded bg-white/10 mb-4" /><SkeletonGrid rows={1} cols={5} /></Card>
                        </div>
                    ) : errorMessage ? (
                        <Card className="p-8 text-center"><p className="text-red-300">{errorMessage}</p></Card>
                    ) : (
                        <div className="space-y-10">
                            <Card className="p-5"><TrendingRail items={trendingMovies.slice(0, 16)} /></Card>
                            <Card className="p-5">
                                <SectionHeader icon={Film} title="Movies" to="/movies" />
                                {movies.length > 0 ? (
                                    <motion.ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                                        {movies.map((movie) => <motion.li key={movie.id} variants={itemVariants}><MovieCard movie={movie} /></motion.li>)}
                                    </motion.ul>
                                ) : (
                                    <div className="text-center py-10 px-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/5"><p className="text-white/70">No movies have been shared yet.</p></div>
                                )}
                            </Card>
                            <Card className="p-5">
                                <SectionHeader icon={Tv} title="TV Series" to="/series" />
                                {series.length > 0 ? (
                                    <motion.ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6" variants={containerVariants} initial="hidden" animate="visible">
                                        {series.map((item) => <motion.li key={item.id} variants={itemVariants}><MovieCard movie={item} /></motion.li>)}
                                    </motion.ul>
                                ) : (
                                    <div className="text-center py-10 px-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/5"><p className="text-white/70">No TV series have been shared yet.</p></div>
                                )}
                            </Card>
                        </div>
                    )}
                </Container>
            </main>
        </Shell>
    );
}