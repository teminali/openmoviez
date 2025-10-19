// src/components/HeroBanner.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Check, Plus, ChevronLeft, ChevronRight, VolumeX, Volume2, Pause } from "lucide-react";
import { addToWatchlist, removeFromWatchlist } from "../firebase.js";
import { APP_NAME } from "../data.js";

// --- Hooks and Helpers (No Changes) ---
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

const useCarousel = ({ itemCount, reducedMotion }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const goTo = useCallback((index) => setActiveIndex((current) => (index + itemCount) % itemCount), [itemCount]);
    const goToNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
    const goToPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

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
    return { activeIndex, goTo, goToNext, goToPrev, eventHandlers: { onKeyDown: handleKeyDown, onPointerDown, onPointerUp, onTouchStart: onPointerDown, onTouchEnd: onPointerUp } };
};

function truncate(str = "", n = 160) {
    if (str.length <= n) return str;
    const cut = str.slice(0, n);
    const last = cut.lastIndexOf(" ");
    return (last > 80 ? cut.slice(0, last) : cut) + "…";
}

const MAX_SLIDES = 5;

// --- Main Component ---
export default function HeroBanner({ items = [], user, watchlist = [], setWatchlist }) {
    const navigate = useNavigate();
    const reducedMotion = useReducedMotion();
    const slides = useMemo(() => items.slice(0, MAX_SLIDES), [items]);
    const { activeIndex, goTo, goToNext, goToPrev, eventHandlers } = useCarousel({ itemCount: slides.length, reducedMotion });

    const [isMuted, setIsMuted] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const playerRef = useRef(null);
    const playerContainerRef = useRef(null);

    const currentSlide = slides.length > 0 ? slides[activeIndex] : null;
    const videoId = currentSlide?.trailerYoutubeID;

    // Effect to load the YouTube IFrame API
    useEffect(() => {
        if (!document.getElementById('youtube-iframe-api')) {
            const tag = document.createElement('script');
            tag.id = 'youtube-iframe-api';
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // Effect to create and destroy the YouTube player
    useEffect(() => {
        setIsVideoPlaying(false);
        setIsPaused(false);

        const createPlayer = () => {
            if (!playerContainerRef.current) return;
            playerRef.current = new window.YT.Player(playerContainerRef.current, {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    mute: 1,
                    loop: 1,
                    playlist: videoId,
                    controls: 0,
                    showinfo: 0,
                    autohide: 1,
                    modestbranding: 1,
                    playsinline: 1
                },
                events: {
                    onReady: (event) => {
                        event.target.mute();
                        setIsMuted(true);
                        setIsPaused(false);
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.PLAYING) {
                            setIsVideoPlaying(true);
                            setIsPaused(false);
                        } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                            setIsPaused(true);
                        }
                    }
                }
            });
        };

        if (videoId && !reducedMotion) {
            if (typeof window.YT !== 'undefined' && window.YT.Player) {
                createPlayer();
            } else {
                window.onYouTubeIframeAPIReady = createPlayer;
            }
        }

        return () => {
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId, reducedMotion]);

    // Effect to control mute/unmute state
    useEffect(() => {
        if (playerRef.current?.mute) { // Check if function exists
            if (isMuted) {
                playerRef.current.mute();
            } else {
                playerRef.current.unMute();
            }
        }
    }, [isMuted]);

    // Effect to control play/pause state
    useEffect(() => {
        if (playerRef.current?.playVideo) { // Check if function exists
            if (isPaused) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        }
    }, [isPaused]);


    if (!currentSlide) return null;

    const isInList = user && watchlist.includes(currentSlide.id);

    const handleToggleWatchlist = async (e) => {
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            if (isInList) {
                await removeFromWatchlist(user.uid, currentSlide.id);
                setWatchlist(prev => prev.filter(id => id !== currentSlide.id));
            } else {
                await addToWatchlist(user.uid, currentSlide.id);
                setWatchlist(prev => [...prev, currentSlide.id]);
            }
        } catch (error) {
            console.error("Failed to update watchlist:", error);
        }
    };

    const bgImage = currentSlide.coverURL || currentSlide.backdropURL || currentSlide.posterURL || "";
    const slideVariants = { enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 }) };

    return (
        <section
            className="relative w-full overflow-hidden select-none group focus:outline-none bg-black"
            aria-roledescription="carousel" aria-label="Trending content" tabIndex={0}
            {...eventHandlers}
        >
            <title>{APP_NAME} | Find & Stream Your Favorite Movies</title>
            <meta name="description" content="Search for top-rated movies, discover trending films, and stream them directly from your browser." />
            <div className="relative w-full min-h-[600px] h-[30vw] max-h-[400px]">
                <AnimatePresence initial={false} custom={1}>
                    <motion.div key={activeIndex} className="absolute inset-0 h-full w-full" custom={1} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}>
                        {bgImage && (
                            <img
                                src={bgImage}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                        {videoId && !reducedMotion && (
                            <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: '177.77vh', height: '100vw' }}>
                                    <div ref={playerContainerRef} className="w-full h-full" />
                                </div>
                            </div>
                        )}
                        {!bgImage && !videoId && (
                            <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900" />
                        )}
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
                    <button onClick={goToPrev} aria-label="Previous slide" className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={goToNext} aria-label="Next slide" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-white"><ChevronRight className="w-6 h-6" /></button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {slides.map((_, index) => (<button key={index} onClick={() => goTo(index)} aria-label={`Go to slide ${index + 1}`} className={`h-2 w-2 rounded-full transition-colors ${activeIndex === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`} />))}
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        {videoId && !reducedMotion && (
                            <>
                                <button
                                    onClick={() => setIsPaused(prev => !prev)}
                                    aria-label={isPaused ? "Play video" : "Pause video"}
                                    className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                                >
                                    {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => setIsMuted(prev => !prev)}
                                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                                    className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
            <div className="sr-only" aria-live="polite" aria-atomic="true">Slide {activeIndex + 1} of {slides.length}: {currentSlide.title}</div>
        </section>
    );
}