import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Plyr from "plyr-react";
import "plyr/dist/plyr.css";
import {
    X, Play, Plus, Check, ChevronDown, VolumeX, Volume2,
    ThumbsUp, Clock, Loader2
} from "lucide-react";

import {
    getMovieById, getPeopleByIds, getMovies,
    addToWatchlist, removeFromWatchlist, getWatchlist,
    likeMovie, unlikeMovie
} from "../firebase";
import { useAuth } from "../context/AuthContext";
import ModalLessMovieCard from "./ModalLessMovieCard.jsx";

const cx = (...c) => c.filter(Boolean).join(" ");
const formatDate = (ts) => {
    try {
        if (!ts) return "";
        const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch { return ""; }
};

// ------- Compact, industry-standard people UI -------

const initials = (name = "") =>
    name.trim().split(/\s+/).slice(0,2).map(s => s[0]?.toUpperCase()).join("") || "?";

const PersonAvatar = ({ person, size = 32, title }) => {
    const src = person.photoURL || person.profilePicURL;
    return (
        <div
            className="relative shrink-0 rounded-full border border-white/15 bg-white/5 overflow-hidden"
            style={{ width: size, height: size }}
            title={title || person.name}
            aria-label={title || person.name}
        >
            {src ? (
                <img src={src} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
                <div className="w-full h-full grid place-items-center text-[11px] font-semibold text-white/80">
                    {initials(person.name)}
                </div>
            )}
        </div>
    );
};

const FacePile = ({ people = [], max = 6, size = 28 }) => {
    const shown = people.slice(0, max);
    const extra = Math.max(0, people.length - shown.length);
    return (
        <div className="flex -space-x-2">
            {shown.map((p, i) => (
                <div key={`${p.id || p.name}-${i}`} className="inline-block">
                    <PersonAvatar person={p} size={size} title={p.character ? `${p.name} — ${p.character}` : p.name} />
                </div>
            ))}
            {extra > 0 && (
                <div
                    className="inline-grid place-items-center rounded-full border border-white/15 bg-white/10 text-[11px] text-white/80"
                    style={{ width: size, height: size }}
                    title={`+${extra} more`}
                >
                    +{extra}
                </div>
            )}
        </div>
    );
};

const PeopleRow = ({ label, people = [], renderRight, maxAvatars = 6 }) => {
    if (!people?.length) return null;
    return (
        <div className="flex items-center justify-between py-2">
            <div className="min-w-0">
                <div className="text-[13px] text-white/60">{label}</div>
                <div className="mt-1 flex items-center gap-3">
                    <FacePile people={people} max={maxAvatars} size={28} />
                    <div className="min-w-0 text-sm text-white/80 truncate">
                        {/* show compact comma-separated names (first few) */}
                        {people.slice(0, 3).map(p => p.name).filter(Boolean).join(", ")}
                        {people.length > 3 && " …"}
                    </div>
                </div>
            </div>
            {renderRight}
        </div>
    );
};

const PeopleCollapsible = ({ title, people = [] }) => {
    const [open, setOpen] = useState(false);
    if (!people?.length) return null;

    return (
        <div className="border-t border-white/10">
            <div className="flex items-center justify-between py-3">
                <h4 className="text-sm font-semibold text-white/90">{title}</h4>
                <button
                    className="text-xs text-indigo-300 hover:text-indigo-200"
                    onClick={() => setOpen(o => !o)}
                >
                    {open ? "Show less" : `Show all (${people.length})`}
                </button>
            </div>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2"
                    >
                        {people.map((p, i) => (
                            <div
                                key={`${title}-${p.id || p.name}-${i}`}
                                className="flex items-center gap-3 p-2 rounded-lg border border-white/10 bg-white/5"
                            >
                                <PersonAvatar person={p} size={40} />
                                <div className="min-w-0">
                                    <div className="font-medium text-white truncate">{p.name}</div>
                                    {p.character && <div className="text-xs text-white/60 truncate">as {p.character}</div>}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ------------------------------------------------------------

export default function MoviePreviewModal({
                                              movie,
                                              onClose,
                                              onRecommendationClick,
                                              startExpanded = false,
                                              anchorRect,
                                              getAnchorRect = () => null,

                                              // Hover-preview provider hooks
                                              __onCompactPointerEnter = () => {},
                                              __onCompactPointerLeave = () => {},
                                              __cancelHide = () => {},
                                              __onExpand = () => {},
                                          }) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // UI State
    const [isExpanded, setIsExpanded] = useState(!!startExpanded);
    const [isMuted, setIsMuted] = useState(true);

    // Data State
    const [details, setDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [recommendations, setRecommendations] = useState([]);

    // My List State
    const [isInList, setIsInList] = useState(false);
    const [isListBusy, setIsListBusy] = useState(false);

    // Likes State
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLikeBusy, setIsLikeBusy] = useState(false);

    // Refs
    const backdropRef = useRef(null);
    const closeBtnRef = useRef(null);
    const lastFocusedRef = useRef(null);
    const plyrRef = useRef(null);

    const displayMovie = details || movie;

    // Trailer source
    const trailerSource = useMemo(() => {
        const sourceMovie = displayMovie || movie;
        if (!sourceMovie) return null;
        if (sourceMovie.trailerYoutubeID) {
            return { type: "video", sources: [{ src: sourceMovie.trailerYoutubeID, provider: "youtube" }] };
        }
        if (sourceMovie.trailerURL) {
            return { type: "video", sources: [{ src: sourceMovie.trailerURL }] };
        }
        return null;
    }, [displayMovie, movie]);

    const plyrOptions = useMemo(() => ({
        autoplay: true,
        muted: true,
        clickToPlay: false,
        ratio: "16:9",
        controls: [],
        loop: { active: true },
        keyboard: { focused: false, global: false },
        tooltips: { controls: false, seek: false },
        youtube: {
            noCookie: true,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            origin: window.location.origin
        },
        settings: []
    }), []);

    // Handlers
    const toggleMute = useCallback(() => {
        const player = plyrRef.current?.plyr;
        if (player) {
            player.muted = !player.muted;
            setIsMuted(player.muted);
        }
    }, []);

    // This function handles dismissing the modal and navigating
    const handlePlay = () => {
        onClose?.();
        navigate(`/watch/${movie.id}`);
    };

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape") { e.preventDefault(); onClose?.(); }
    }, [onClose]);

    const handleListToggle = async () => {
        if (!currentUser || isListBusy) return;
        setIsListBusy(true);
        try {
            if (isInList) {
                await removeFromWatchlist(currentUser.uid, movie.id);
                setIsInList(false);
            } else {
                await addToWatchlist(currentUser.uid, movie.id);
                setIsInList(true);
            }
        } catch (error) {
            console.error("Failed to update watchlist:", error);
        } finally {
            setIsListBusy(false);
        }
    };

    const handleLikeToggle = async () => {
        if (!currentUser || isLikeBusy) return;
        setIsLikeBusy(true);
        try {
            if (isLiked) {
                await unlikeMovie(movie.id, currentUser.uid);
                setIsLiked(false);
                setLikeCount(c => c - 1);
            } else {
                await likeMovie(movie.id, currentUser.uid);
                setIsLiked(true);
                setLikeCount(c => c + 1);
            }
        } catch (error) {
            console.error("Failed to update like status:", error);
        } finally {
            setIsLikeBusy(false);
        }
    };

    // Effects
    useEffect(() => { // Player cleanup
        return () => { try { plyrRef.current?.plyr?.destroy(); } catch {} };
    }, []);

    useEffect(() => { // Fetch details, recommendations, and user-specific data
        let alive = true;
        const run = async () => {
            if (!isExpanded || !movie?.id) return;
            if (details) return; // Fetch only once

            setIsLoadingDetails(true);
            try {
                const promises = [getMovieById(movie.id), getMovies()];
                if (currentUser) promises.push(getWatchlist(currentUser.uid));
                const [full, recs, watchlist] = await Promise.all(promises);

                if (full && alive) {
                    const directorIds = full.directors || [];
                    const actorIds = (full.actors || []).map(a => a.personId);
                    const ids = [...new Set([...directorIds, ...actorIds])];

                    if (ids.length) {
                        const peopleMap = await getPeopleByIds(ids);
                        full.directors = directorIds.map(id => peopleMap[id]).filter(Boolean);
                        full.actors = (full.actors || [])
                            .map(a => ({ ...(peopleMap[a.personId] || {}), character: a.characterName }))
                            .filter(p => p?.id || p?.name);
                    }
                    if (full.type === "series" && Array.isArray(full.episodes)) {
                        full.episodes = [...full.episodes].sort((a, b) =>
                            a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
                        );
                    }
                    setDetails(full);

                    const likes = full.likes || [];
                    setLikeCount(likes.length);
                    if (currentUser) setIsLiked(likes.includes(currentUser.uid));
                }

                if (recs && alive) {
                    setRecommendations(recs.filter(r => r.id !== movie.id).slice(0, 6)); // cap to 6
                }

                if (watchlist && alive) setIsInList(watchlist.includes(movie.id));
            } catch (e) {
                console.error("Failed to load modal details:", e);
            } finally {
                if (alive) setIsLoadingDetails(false);
            }
        };
        run();
        return () => { alive = false; };
    }, [isExpanded, movie?.id, details, currentUser]);

    // Body scroll lock & focus + inert background while expanded
    useEffect(() => {
        if (!isExpanded) return;
        lastFocusedRef.current = document.activeElement;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        const appRoot =
            document.getElementById("root") ||
            document.querySelector("#root, #app, main");
        const prevPointerEvents = appRoot?.style.pointerEvents;
        appRoot?.setAttribute("inert", "");
        if (appRoot) appRoot.style.pointerEvents = "none";

        // focus the close btn
        closeBtnRef.current?.focus();

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
            appRoot?.removeAttribute("inert");
            if (appRoot) appRoot.style.pointerEvents = prevPointerEvents || "";
            lastFocusedRef.current?.focus();
        };
    }, [isExpanded, handleKeyDown]);

    // Compact anchoring geometry (for hover state)
    const [liveRect, setLiveRect] = useState(anchorRect || null);
    useEffect(() => {
        if (isExpanded) return;
        const update = () => setLiveRect(getAnchorRect?.() || null);
        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update, { passive: true });
        return () => {
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, [isExpanded, getAnchorRect]);

    // Compact layout + metadata
    const compactMeta = useMemo(() => {
        const r = liveRect;
        const padding = 2; // tiny gap
        const width = r ? Math.min(Math.max(r.width, 420), 560) : 480;
        const height = (width * 9) / 16 + 160;

        let top, left, openAbove = false;
        if (r) {
            const spaceAbove = r.top;
            const spaceBelow = window.innerHeight - (r.top + r.height);
            openAbove = spaceAbove > height + 24 && spaceAbove > spaceBelow;
            top = openAbove ? r.top - height - padding : r.top + r.height + padding;
            left = r.left + r.width / 2 - width / 2;
            left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
            if (!openAbove && top + height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - height - 8);
            if (openAbove && top < 8) top = 8;
        } else {
            top = Math.max(8, (window.innerHeight - height) / 2);
            left = Math.max(8, (window.innerWidth - width) / 2);
        }
        return {
            style: { position: "fixed", top: Math.round(top), left: Math.round(left), width: Math.round(width), zIndex: 60 },
            openAbove,
            height: Math.round(height),
            width: Math.round(width),
        };
    }, [liveRect]);

    // Expand handler that cancels any pending hide first (prevents immediate close)
    const expandNow = useCallback(() => {
        try { __cancelHide(); } catch {}
        try { __onExpand(); } catch {}
        setIsExpanded(true);
    }, [__cancelHide, __onExpand]);

    // --- Hover Bridge between card and compact modal (handles portal gap) ---
    const bridgeStyle = useMemo(() => {
        if (isExpanded || !liveRect || !compactMeta) return null;
        const { top: cardTop, left: cardLeft, width: cardW, height: cardH } = liveRect;
        const modalTop = compactMeta.style.top;
        const modalLeft = compactMeta.style.left;
        const modalW = compactMeta.width;
        const openAbove = compactMeta.openAbove;

        const bridgeWidth = Math.max(24, Math.min(cardW, modalW) * 0.8);
        const bridgeX = Math.max(
            Math.min(cardLeft + cardW / 2 - bridgeWidth / 2, modalLeft + modalW - bridgeWidth - 4),
            modalLeft + 4
        );

        const gap = openAbove
            ? (cardTop - (modalTop + compactMeta.height))
            : (modalTop - (cardTop + cardH));
        const bridgeHeight = Math.max(12, Math.min(48, gap + 10)); // cushioned
        const bridgeY = openAbove
            ? modalTop + compactMeta.height
            : cardTop + cardH;

        return {
            position: "fixed",
            left: Math.round(bridgeX),
            top: Math.round(bridgeY),
            width: Math.round(bridgeWidth),
            height: Math.round(bridgeHeight),
            zIndex: 61,
        };
    }, [isExpanded, liveRect, compactMeta]);

    return createPortal(
        <div ref={backdropRef} className="fixed inset-0 z-50">
            {/* Backdrop for expanded mode */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.button
                        type="button"
                        aria-label="Close preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto z-50"
                        onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                    />
                )}
            </AnimatePresence>

            {/* HOVER BRIDGE */}
            {!isExpanded && bridgeStyle && (
                <div
                    style={bridgeStyle}
                    className="bg-transparent pointer-events-auto"
                    onPointerEnter={__onCompactPointerEnter}
                    onPointerLeave={__onCompactPointerLeave}
                />
            )}

            <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                    key={isExpanded ? "expanded" : "compact"}
                    layout
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={cx(
                        "relative border border-white/10 shadow-2xl focus:outline-none pointer-events-auto",
                        isExpanded
                            ? "fixed inset-0 z-60 w-screen h-screen overflow-y-auto rounded-none"
                            : "z-60 rounded-xl overflow-hidden"
                    )}
                    style={isExpanded ? undefined : compactMeta.style}
                    onClick={(e) => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${movie?.title} preview`}
                    // Keep also on the wrapper (helps if child misses it)
                    onPointerEnter={!isExpanded ? __onCompactPointerEnter : undefined}
                    onPointerLeave={!isExpanded ? __onCompactPointerLeave : undefined}
                >
                    {/* Transparent interaction veil over media area while COMPACT (to catch iframe gaps) */}
                    {!isExpanded && (
                        <div className="absolute inset-0 rounded-t-xl" style={{ zIndex: 5, pointerEvents: "none" }}>
                            <div
                                className="absolute inset-x-0 top-0"
                                style={{
                                    height: `${(compactMeta.width * 9) / 16}px`, // aspect-video
                                    pointerEvents: "auto",
                                    zIndex: 6,
                                }}
                                onPointerEnter={__onCompactPointerEnter}
                                onPointerLeave={__onCompactPointerLeave}
                            />
                        </div>
                    )}

                    {/* Fixed Close (expanded) */}
                    {isExpanded && (
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                            className="fixed top-4 right-4 z-[10000] inline-flex items-center justify-center rounded-full bg-slate-900/70 hover:bg-slate-800 border border-white/10 p-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    )}

                    {/* Width constraint on expanded */}
                    <div className={cx("relative bg-slate-900 mx-auto w-full", isExpanded ? "max-w-6xl" : "max-w-none")}>
                        {/* Header Media */}
                        <div
                            className={cx(
                                "relative w-full bg-black flex-shrink-0 overflow-hidden",
                                isExpanded ? "aspect-video" : "aspect-video rounded-t-xl"
                            )}
                        >
                            <div className="absolute inset-0 z-0">
                                {trailerSource ? (
                                    <Plyr ref={plyrRef} source={trailerSource} options={plyrOptions} />
                                ) : (
                                    <img
                                        src={displayMovie?.coverURL || displayMovie?.posterURL}
                                        alt={displayMovie?.title}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Bottom gradient */}
                            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-10" />

                            {/* Expanded hero content */}
                            {isExpanded && (
                                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end z-20 pointer-events-auto">
                                    <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white tracking-tighter">
                                        {displayMovie?.title}
                                    </h1>
                                    <div className="mt-6 flex items-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                                            className="px-6 py-2.5 text-lg rounded-lg bg-white text-black font-bold inline-flex items-center gap-2 hover:bg-slate-200"
                                        >
                                            <Play className="w-6 h-6 fill-black" /> Play
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleListToggle(); }}
                                            disabled={isListBusy || !currentUser}
                                            className={cx(
                                                "size-11 rounded-full grid place-items-center border-2 transition",
                                                isInList ? "border-green-400/70 hover:border-green-300" : "border-white/60 hover:border-white",
                                                !currentUser && "opacity-50 cursor-not-allowed"
                                            )}
                                            aria-label={isInList ? "Remove from My List" : "Add to My List"}
                                        >
                                            {isListBusy
                                                ? <Loader2 className="w-6 h-6 animate-spin" />
                                                : (isInList
                                                    ? <Check className="w-6 h-6 text-green-300" />
                                                    : <Plus className="w-6 h-6 text-white" />)}
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleLikeToggle(); }}
                                            disabled={isLikeBusy || !currentUser}
                                            className={cx(
                                                "size-11 rounded-full grid place-items-center border-2 transition",
                                                isLiked ? "border-indigo-400/80 hover:border-indigo-300" : "border-white/60 hover:border-white",
                                                !currentUser && "opacity-50 cursor-not-allowed"
                                            )}
                                            aria-label="Rate"
                                        >
                                            {isLikeBusy
                                                ? <Loader2 className="w-6 h-6 animate-spin" />
                                                : <ThumbsUp className={cx("w-6 h-6 text-white", isLiked && "fill-current text-indigo-400")} />}
                                        </button>

                                        <div className="flex-1" />

                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                            className="size-11 rounded-full grid place-items-center border-2 border-white/60 hover:border-white"
                                            aria-label={isMuted ? "Unmute" : "Mute"}
                                        >
                                            {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <AnimatePresence initial={false} mode="wait">
                            {isExpanded ? (
                                <motion.div
                                    key="expanded-content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="px-6 md:px-8 py-6"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2">
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
                                                <span className="font-bold text-green-400">97% Match</span>
                                                <span>{displayMovie?.year}</span>
                                                {!!displayMovie?.runtime && (
                                                    <span className="inline-flex items-center gap-2">
                            <Clock className="w-4 h-4" /> {displayMovie.runtime} min
                          </span>
                                                )}
                                                {displayMovie?.type === "series" && (
                                                    <span>{new Set((displayMovie.episodes || []).map((e) => e.seasonNumber)).size} Seasons</span>
                                                )}
                                                <div className="flex items-center gap-1 text-white/60">
                                                    <ThumbsUp className="w-4 h-4" /> {likeCount}
                                                </div>
                                            </div>
                                            <p className="mt-4 text-white/80 leading-relaxed text-base">
                                                {displayMovie?.description}
                                            </p>
                                        </div>
                                        <div className="text-sm">
                                            <p className="text-white/60"><span className="text-white">Genres: </span>{displayMovie?.genres?.join(", ")}</p>
                                            {!!displayMovie?.releaseDate && (
                                                <p className="mt-1 text-white/60">
                                                    <span className="text-white">Released: </span>{formatDate(displayMovie.releaseDate)}
                                                </p>
                                            )}
                                            {/* Compact, world-standard people rows */}
                                            <div className="mt-4 space-y-2">
                                                <PeopleRow
                                                    label="Starring"
                                                    people={details?.actors || []}
                                                    maxAvatars={6}
                                                    renderRight={
                                                        (details?.actors?.length || 0) > 0 && (
                                                            <button
                                                                className="text-xs text-indigo-300 hover:text-indigo-200"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const el = document.getElementById("all-cast");
                                                                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                                }}
                                                            >
                                                                View all
                                                            </button>
                                                        )
                                                    }
                                                />
                                                <PeopleRow
                                                    label="Directors"
                                                    people={(details?.directors || []).map(d => ({ ...d }))}
                                                    maxAvatars={4}
                                                    renderRight={null}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Full lists in collapsibles (take no space unless opened) */}
                                    <div className="mt-6" id="all-cast">
                                        <PeopleCollapsible title="Full Cast" people={details?.actors || []} />
                                        <PeopleCollapsible title="All Directors" people={details?.directors || []} />
                                    </div>

                                    {recommendations.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-white/10">
                                            <h3 className="text-2xl font-bold text-white mb-4">More Like This</h3>
                                            <div
                                                className="flex gap-3 overflow-x-auto no-scrollbar"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {recommendations.slice(0, 6).map((rec) => (
                                                    <div
                                                        key={rec.id}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => onRecommendationClick?.(rec)}
                                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRecommendationClick?.(rec)}
                                                        className="w-40 shrink-0 origin-top-left scale-95 hover:scale-100 transition-transform text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-indigo-500 cursor-pointer"
                                                        aria-label={`View details for ${rec.title}`}
                                                    >
                                                        <ModalLessMovieCard movie={rec} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="compact-actions"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 12 }}
                                    transition={{ duration: 0.18 }}
                                    className="p-4 md:p-5"
                                    onClick={(e) => e.stopPropagation()}
                                    // IMPORTANT: make the actions area hold the hover (fixes disappearing)
                                    onPointerEnter={__onCompactPointerEnter}
                                    onPointerLeave={__onCompactPointerLeave}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handlePlay}
                                                className="px-5 py-2.5 text-base rounded-lg bg-white text-black font-semibold inline-flex items-center gap-2 hover:bg-slate-200"
                                            >
                                                <Play className="w-5 h-5 fill-black" /> Play
                                            </button>
                                            <button
                                                onClick={handleListToggle}
                                                disabled={!currentUser || isListBusy}
                                                className={cx(
                                                    "size-11 rounded-full grid place-items-center border-2 transition",
                                                    isInList ? "border-green-400/70" : "border-white/60 hover:border-white",
                                                    !currentUser && "opacity-50 cursor-not-allowed"
                                                )}
                                                aria-label="Add to List"
                                                onPointerEnter={__onCompactPointerEnter}
                                                onPointerLeave={__onCompactPointerLeave}
                                            >
                                                {isListBusy
                                                    ? <Loader2 className="w-6 h-6 animate-spin" />
                                                    : (isInList
                                                        ? <Check className="w-6 h-6 text-green-300" />
                                                        : <Plus className="w-6 h-6 text-white" />)}
                                            </button>
                                            <button
                                                onClick={handleLikeToggle}
                                                disabled={!currentUser || isLikeBusy}
                                                className={cx(
                                                    "size-11 rounded-full grid place-items-center border-2 transition",
                                                    isLiked ? "border-indigo-400/80" : "border-white/60 hover:border-white",
                                                    !currentUser && "opacity-50 cursor-not-allowed"
                                                )}
                                                aria-label="Rate"
                                                onPointerEnter={__onCompactPointerEnter}
                                                onPointerLeave={__onCompactPointerLeave}
                                            >
                                                {isLikeBusy
                                                    ? <Loader2 className="w-6 h-6 animate-spin" />
                                                    : <ThumbsUp className={cx("w-6 h-6 text-white", isLiked && "fill-current text-indigo-400")} />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={toggleMute}
                                                className="size-11 rounded-full grid place-items-center border-2 border-white/60 hover:border-white"
                                                aria-label={isMuted ? "Unmute" : "Mute"}
                                                onPointerEnter={__onCompactPointerEnter}
                                                onPointerLeave={__onCompactPointerLeave}
                                            >
                                                {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                                            </button>
                                            <button
                                                onClick={expandNow}
                                                className="size-11 rounded-full grid place-items-center border-2 border-white/60 hover:border-white"
                                                aria-label="More Details"
                                                onPointerEnter={__onCompactPointerEnter}
                                                onPointerLeave={__onCompactPointerLeave}
                                            >
                                                <ChevronDown className="w-6 h-6 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>,
        document.body
    );
}