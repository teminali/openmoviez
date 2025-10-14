// src/components/Navbar.jsx
import React, {useEffect, useMemo, useRef, useState} from "react";
import {Link, NavLink, useLocation, useNavigate} from "react-router-dom";
import {
    ChevronDown,
    Film,
    Heart,
    LayoutGrid,
    LogIn,
    LogOut,
    Menu,
    Search as SearchIcon,
    ShieldCheck,
    Sparkles,
    Star,
    Tv2,
    User,
    X
} from "lucide-react";
import {useDebounce} from "react-use";
import {getMovies, updateSearchCount} from "../firebase";
import {GENRE_LIST} from "../data.js";

const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function Navbar({ currentUser, onLogout }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [genresOpen, setGenresOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [qDebounced, setQDebounced] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useDebounce(() => setQDebounced(query.trim()), 300, [query]);

    const searchRef = useRef(null);
    const searchWrapRef = useRef(null);
    const profileRef = useRef(null);
    const genresRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Visual: elevate on scroll
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setMobileOpen(false);
        setProfileOpen(false);
        setGenresOpen(false);
        setDropdownOpen(false);
    }, [location.pathname]);

    // Search fetch
    useEffect(() => {
        let cancel = false;
        (async () => {
            if (!qDebounced) { setResults([]); setLoading(false); return; }
            setLoading(true);
            try {
                const movies = await getMovies(qDebounced);
                if (!cancel) setResults(movies.slice(0, 8));
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => { cancel = true; };
    }, [qDebounced]);

    // Outside clicks
    useEffect(() => {
        const handler = (e) => {
            if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (genresOpen && genresRef.current && !genresRef.current.contains(e.target)) setGenresOpen(false);
            if (dropdownOpen && searchWrapRef.current && !searchWrapRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [dropdownOpen, profileOpen, genresOpen]);

    // Keyboard nav for results + quick search focus with "/"
    useEffect(() => {
        const onKey = (e) => {
            // Focus search on "/" (but not when typing in an input/textarea)
            if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const tag = document.activeElement?.tagName?.toLowerCase();
                if (tag !== "input" && tag !== "textarea") {
                    e.preventDefault();
                    searchRef.current?.focus();
                }
            }
            if (!dropdownOpen) return;
            if (e.key === "Escape") setDropdownOpen(false);
            if (!results.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % results.length); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => (i - 1 + results.length) % results.length); }
            if (e.key === "Enter" && activeIndex >= 0) {
                e.preventDefault();
                const r = results[activeIndex];
                selectResult(r);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dropdownOpen, results, activeIndex]);

    const selectResult = (m) => {
        setDropdownOpen(false);
        setQuery("");
        navigate(`/watch/${m.id}`);
        updateSearchCount(qDebounced || m.title, m);
    };

    const submitSearch = () => {
        if (!qDebounced) return;
        setDropdownOpen(false);
        navigate(`/movies?q=${encodeURIComponent(qDebounced)}`);
    };

    const navItems = useMemo(
        () => ([
            { to: "/movies", label: "Movies", icon: Film },
            { to: "/series", label: "Series", icon: Tv2 },
            { to: "/movies?sort=rating", label: "Top Rated", icon: Star },
        ]),
        []
    );

    return (
        <header
            className={cx(
                "mt-0 sticky top-0 z-50 backdrop-blur transition-colors duration-300",
                scrolled
                    ? "bg-black shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]"
                    : "bg-transparent"
            )}
        >
            <div className="mx-auto max-w-7xl px-4 md:px-6">
                <div className="h-16 flex items-center gap-3 text-slate-100">
                    {/* Mobile burger */}
                    <button
                        className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl hover:bg-white/5 border border-white/10"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Brand (matches dashboard avatar style) */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                            <LayoutGrid className="w-5 h-5 text-white/80" />
                        </div>
                        <span className="hidden sm:block font-bold tracking-tight group-hover:opacity-90">
              MovieShare
            </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-1 ml-4">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    cx(
                                        "relative px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition",
                                        isActive
                                            ? "bg-white/10 text-white"
                                            : "text-white/70 hover:text-white hover:bg-white/5"
                                    )
                                }
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                                {/* Active underline */}
                                <span
                                    className={cx(
                                        "absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full transition-opacity",
                                        location.pathname.startsWith(item.to) ? "bg-indigo-400/80 opacity-100" : "opacity-0"
                                    )}
                                />
                            </NavLink>
                        ))}

                        {/* Genres dropdown */}
                        <div className="relative" ref={genresRef}>
                            <button
                                onClick={() => setGenresOpen((v) => !v)}
                                className="px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 inline-flex items-center gap-2"
                            >
                                Genres <ChevronDown className="w-4 h-4" />
                            </button>
                            {genresOpen && (
                                <div className="absolute z-50 left-0 mt-2 w-72 p-3 rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl">
                                    <div className="grid grid-cols-2 gap-2">
                                        {GENRE_LIST.map((g) => (
                                            <Link
                                                key={g}
                                                to={`/movies?genre=${encodeURIComponent(g.toLowerCase())}`}
                                                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80"
                                            >
                                                {g}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>

                    <div className="flex-1" />

                    {/* Search */}
                    <div ref={searchWrapRef} className="relative hidden md:block w-full max-w-md">
                        <div className="relative">
                            <SearchIcon className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                ref={searchRef}
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); setActiveIndex(-1); }}
                                onFocus={() => { if (query) setDropdownOpen(true); }}
                                onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
                                type="search"
                                placeholder="Find something to watch…"
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                                aria-label="Search"
                            />
                        </div>

                        {dropdownOpen && qDebounced && (
                            <div className="absolute z-50 mt-2 w-full rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl overflow-hidden">
                                <h4 className="px-4 pt-3 pb-2 text-xs font-semibold tracking-wide text-white/50">
                                    MOVIES & SERIES
                                </h4>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {loading ? (
                                        <div className="py-8 text-center text-white/60">Searching…</div>
                                    ) : results.length === 0 ? (
                                        <div className="py-8 text-center text-white/60">No results for “{qDebounced}”.</div>
                                    ) : (
                                        <ul className="divide-y divide-white/5">
                                            {results.map((m, idx) => (
                                                <li key={m.id}>
                                                    <button
                                                        onMouseEnter={() => setActiveIndex(idx)}
                                                        onClick={() => selectResult(m)}
                                                        className={cx(
                                                            "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left",
                                                            idx === activeIndex && "bg-white/10"
                                                        )}
                                                    >
                                                        <img src={m.posterURL} alt={m.title} className="w-10 h-14 rounded-md object-cover" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate font-medium text-white">{m.title}</div>
                                                            <div className="text-xs text-white/60 truncate">
                                                                {m.type === "series" ? "TV Series" : "Movie"}{m.year ? ` • ${m.year}` : ""}
                                                            </div>
                                                        </div>
                                                        <Sparkles className="w-4 h-4 text-white/30" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button
                                    onClick={submitSearch}
                                    className="w-full text-left px-4 py-2 text-sm text-indigo-300 hover:bg-white/5"
                                >
                                    See all results for “{qDebounced}” »
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Auth / Profile */}
                    <div className="flex items-center gap-2 ml-2">
                        {currentUser ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen((v) => !v)}
                                    className="inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                                    aria-haspopup="menu"
                                    aria-expanded={profileOpen}
                                >
                                    <img
                                        src={currentUser.photoURL || "/avatar_placeholder.png"}
                                        alt="avatar"
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <span className="hidden md:block text-sm text-white/80">
                    {currentUser.displayName || "Account"}
                  </span>
                                    <ChevronDown className="w-4 h-4 text-white/70" />
                                </button>

                                {profileOpen && (
                                    <div
                                        role="menu"
                                        className="absolute z-50 right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl p-2"
                                    >
                                        {currentUser?.isAdmin && (
                                            <Link
                                                to="/admin"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300"
                                                role="menuitem"
                                            >
                                                <ShieldCheck className="w-4 h-4" /> Admin Panel
                                            </Link>
                                        )}

                                        <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/90" role="menuitem">
                                            <User className="w-4 h-4" /> Dashboard
                                        </Link>
                                        <Link to="/share" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/90" role="menuitem">
                                            <Film className="w-4 h-4" /> Share a Movie
                                        </Link>
                                        <Link to="/watchlist" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-white/90" role="menuitem">
                                            <Heart className="w-4 h-4" /> Watchlist
                                        </Link>

                                        <div className="h-px bg-white/10 my-1" />

                                        <button
                                            onClick={onLogout}
                                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-red-300"
                                            role="menuitem"
                                        >
                                            <LogOut className="w-4 h-4" /> Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white text-sm border border-indigo-400/30"
                            >
                                <LogIn className="w-4 h-4" /> Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-slate-950 border-r border-white/10 p-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                                <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                                    <LayoutGrid className="w-5 h-5 text-white/80" />
                                </div>
                                <span className="font-bold text-white">MovieShare</span>
                            </Link>
                            <button className="p-2 rounded-xl hover:bg-white/5 border border-white/10" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <div className="relative mb-4">
                                <SearchIcon className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") { submitSearch(); setMobileOpen(false); }
                                    }}
                                    placeholder="Search…"
                                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/80"
                                />
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={({ isActive }) =>
                                        cx(
                                            "flex items-center gap-3 px-3 py-2 rounded-xl",
                                            isActive ? "bg-white/10 text-white" : "text-white/80 hover:text-white hover:bg-white/5"
                                        )
                                    }
                                >
                                    <item.icon className="w-4 h-4" /> {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        <div className="mt-6 border-t border-white/10 pt-4">
                            {currentUser ? (
                                <div className="space-y-1">
                                    {currentUser?.isAdmin && (
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-300"
                                        >
                                            <ShieldCheck className="w-4 h-4" /> Admin Panel
                                        </Link>
                                    )}
                                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/90">
                                        <User className="w-4 h-4" /> Dashboard
                                    </Link>
                                    <Link to="/share" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/90">
                                        <Film className="w-4 h-4" /> Share a Movie
                                    </Link>
                                    <Link to="/watchlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-white/90">
                                        <Heart className="w-4 h-4" /> Watchlist
                                    </Link>
                                    <button onClick={onLogout} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-red-300">
                                        <LogOut className="w-4 h-4" /> Log out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white"
                                >
                                    <LogIn className="w-4 h-4" /> Sign in
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}