// src/pages/FullScreenPlayerPage.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';
import { motion, AnimatePresence } from 'framer-motion';
import { getMovieById } from '../firebase';
import {
    ArrowLeft,
    Info,
    ListVideo,
    Volume2,
    VolumeX,
    X,
    Loader2,
    AlertTriangle,
} from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(" ");

// --- Sub-components for Panels ---

const EpisodesPanel = ({ content, currentEpisode, onSelectEpisode, onClose }) => {
    const seasons = useMemo(() => {
        if (!content.episodes?.length) return {};
        return content.episodes.reduce((acc, ep) => {
            const season = ep.seasonNumber || 1;
            if (!acc[season]) acc[season] = [];
            acc[season].push(ep);
            return acc;
        }, {});
    }, [content.episodes]);

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-full max-w-md bg-black/80 backdrop-blur-md z-40"
        >
            <div className="p-4 flex items-center justify-between border-b border-white/10">
                <h2 className="text-xl font-bold">Episodes</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="h-[calc(100%-4.5rem)] overflow-y-auto">
                {Object.keys(seasons).sort((a,b) => Number(a) - Number(b)).map(seasonNumber => (
                    <div key={seasonNumber}>
                        <h3 className="p-4 text-lg font-semibold text-slate-300">Season {seasonNumber}</h3>
                        <ul>
                            {seasons[seasonNumber].map(ep => {
                                const isCurrent = ep.youtubeID === currentEpisode.youtubeID;
                                return (
                                    <li key={ep.youtubeID || `${ep.seasonNumber}-${ep.episodeNumber}`}>
                                        <button
                                            onClick={() => onSelectEpisode(ep)}
                                            className={cx(
                                                "w-full text-left px-4 py-3 flex gap-4 items-center transition-colors",
                                                isCurrent ? "bg-indigo-500/30" : "hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-slate-400 font-mono text-sm">{ep.episodeNumber}</span>
                                            <span className={cx("font-medium", isCurrent ? "text-white" : "text-slate-200")}>
                                                {ep.title}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const InfoPanel = ({ content, onClose }) => (
    <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-0 right-0 h-full w-full max-w-md bg-black/80 backdrop-blur-md z-40"
    >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
            <h2 className="text-xl font-bold">{content.title}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
            </button>
        </div>
        <div className="p-4 space-y-4 text-slate-300">
            <div className="flex items-center gap-4 text-sm">
                <span>{content.year}</span>
                <span className="px-2 py-0.5 border border-white/20 rounded-md text-xs">{content.type}</span>
            </div>
            <p className="leading-relaxed">{content.description}</p>
            <div className="flex flex-wrap gap-2">
                {content.genres?.map(g => <span key={g} className="text-xs px-2 py-1 bg-white/10 rounded-full">{g}</span>)}
            </div>
        </div>
    </motion.div>
);


// --- Main Player Component ---

export default function FullScreenPlayerPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const plyrRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    // Data state
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentEpisode, setCurrentEpisode] = useState(null);

    // UI state
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [isEpisodesPanelOpen, setIsEpisodesPanelOpen] = useState(false);
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            setError('');
            try {
                const data = await getMovieById(id);
                if (!data) {
                    setError("Content not found.");
                } else {
                    setContent(data);
                    if (data.type === 'series' && data.episodes?.length > 0) {
                        // Sort and set the first episode
                        const sortedEpisodes = [...data.episodes].sort((a, b) =>
                            a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
                        );
                        data.episodes = sortedEpisodes;
                        setCurrentEpisode(sortedEpisodes[0]);
                    }
                }
            } catch (err) {
                setError("Failed to load content.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [id]);

    // --- Player Source ---
    const playerSource = useMemo(() => {
        const sourceItem = content?.type === 'series' ? currentEpisode : content;
        if (!sourceItem) return null;

        if (sourceItem.youtubeID) {
            return { type: 'video', sources: [{ src: sourceItem.youtubeID, provider: 'youtube' }] };
        }
        if (sourceItem.videoURL) {
            return { type: 'video', sources: [{ src: sourceItem.videoURL }] };
        }
        return null;
    }, [content, currentEpisode]);

    // --- Plyr Options ---
    const plyrOptions = useMemo(() => ({
        autoplay: true,
        muted: isMuted,
        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
        settings: [],
        youtube: {
            noCookie: true,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            origin: window.location.origin
        },
    }), [isMuted]);

    // --- Control Visibility Logic ---
    const showControls = useCallback(() => {
        clearTimeout(controlsTimeoutRef.current);
        setIsControlsVisible(true);
        controlsTimeoutRef.current = setTimeout(() => {
            setIsControlsVisible(false);
        }, 3000);
    }, []);

    useEffect(() => {
        showControls(); // Show on mount
        return () => clearTimeout(controlsTimeoutRef.current);
    }, [showControls]);

    // --- Handlers ---
    const handleSelectEpisode = (episode) => {
        setCurrentEpisode(episode);
        setIsEpisodesPanelOpen(false); // Close panel on selection
    };

    const toggleMute = () => {
        const player = plyrRef.current?.plyr;
        if (player) {
            player.muted = !player.muted;
            setIsMuted(player.muted);
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="w-screen h-screen bg-black grid place-items-center text-white">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-screen h-screen bg-black grid place-items-center text-white text-center p-4">
                <div>
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Playback Error</h1>
                    <p className="text-slate-400 mt-2">{error}</p>
                    <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-indigo-500 rounded-lg font-semibold">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-screen h-screen bg-black text-white overflow-hidden"
            onMouseMove={showControls}
            onClick={showControls}
            onMouseLeave={() => setIsControlsVisible(false)}
        >
            {playerSource ? (
                <Plyr
                    ref={plyrRef}
                    source={playerSource}
                    options={plyrOptions}
                />
            ) : (
                <div className="w-full h-full grid place-items-center">
                    <p className="text-slate-400">No video source available for this content.</p>
                </div>
            )}

            {/* Custom Controls Overlay */}
            <AnimatePresence>
                {isControlsVisible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-black/50 via-transparent to-black/50"
                    >
                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center gap-4 pointer-events-auto">
                            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-xl md:text-2xl font-bold truncate">{content.title}</h1>
                                {content.type === 'series' && currentEpisode && (
                                    <p className="text-sm text-slate-300 truncate">
                                        S{currentEpisode.seasonNumber}:E{currentEpisode.episodeNumber} "{currentEpisode.title}"
                                    </p>
                                )}
                            </div>
                            <div className="flex-grow" />
                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10" aria-label={isMuted ? "Unmute" : "Mute"}>
                                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                </button>
                                <button onClick={() => setIsInfoPanelOpen(true)} className="p-2 rounded-full hover:bg-white/10" aria-label="More Info">
                                    <Info className="w-6 h-6" />
                                </button>
                                {content.type === 'series' && content.episodes?.length > 0 && (
                                    <button onClick={() => setIsEpisodesPanelOpen(true)} className="p-2 rounded-full hover:bg-white/10" aria-label="Episodes">
                                        <ListVideo className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panels */}
            <AnimatePresence>
                {isInfoPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsInfoPanelOpen(false)}
                            className="absolute inset-0 bg-black/60 z-30"
                        />
                        <InfoPanel content={content} onClose={() => setIsInfoPanelOpen(false)} />
                    </>
                )}
                {isEpisodesPanelOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEpisodesPanelOpen(false)}
                            className="absolute inset-0 bg-black/60 z-30"
                        />
                        <EpisodesPanel
                            content={content}
                            currentEpisode={currentEpisode}
                            onSelectEpisode={handleSelectEpisode}
                            onClose={() => setIsEpisodesPanelOpen(false)}
                        />
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}