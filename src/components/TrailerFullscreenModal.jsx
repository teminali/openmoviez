// src/components/TrailerFullscreenModal.jsx
import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Plyr from "plyr-react";
import "plyr/dist/plyr.css";
import { X, Volume2, VolumeX } from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

export default function TrailerFullscreenModal({
                                                   open,
                                                   onClose,
                                                   trailerYoutubeID,   // e.g. "dQw4w9WgXcQ"
                                                   trailerURL,         // e.g. "https://cdn.example.com/trailer.mp4"
                                                   title = "Trailer",
                                               }) {
    const containerRef = useRef(null);
    const plyrRef = useRef(null);

    // Build Plyr source from either YT id or direct URL
    const source = useMemo(() => {
        if (trailerYoutubeID) {
            return { type: "video", sources: [{ src: trailerYoutubeID, provider: "youtube" }] };
        }
        if (trailerURL) {
            return { type: "video", sources: [{ src: trailerURL }] };
        }
        return null;
    }, [trailerYoutubeID, trailerURL]);

    // Plyr options: autoplay, muted (to satisfy autoplay policies), no YouTube chrome
    const options = useMemo(() => ({
        autoplay: true,
        muted: true, // allow autoplay; user can unmute
        controls: [
            "play-large", "play", "progress", "current-time", "mute", "volume",
            "settings", "pip", "airplay", "fullscreen"
        ],
        ratio: "16:9",
        clickToPlay: true,
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true },
        youtube: {
            noCookie: true,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
    }), []);

    // Close on Escape
    const onKeyDown = useCallback((e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            onClose?.();
        }
    }, [onClose]);

    // Body scroll lock + focus trap-ish
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open, onKeyDown]);

    // Simple mute toggle helper
    const toggleMute = () => {
        const player = plyrRef.current?.plyr;
        if (player) player.muted = !player.muted;
    };

    if (!open) return null;

    return createPortal(
        <div
            ref={containerRef}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} fullscreen trailer`}
        >
            {/* Clickable backdrop to close */}
            <button
                type="button"
                className="absolute inset-0"
                onClick={onClose}
                aria-label="Close trailer"
            />

            {/* Player wrapper (stops propagation so clicks on video/controls don't close) */}
            <div
                className="absolute inset-0 max-w-7xl mx-auto p-4 md:p-6 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full">
                    {source ? (
                        <Plyr ref={plyrRef} source={source} options={options} />
                    ) : (
                        <div className="text-white text-center py-20">
                            Trailer unavailable.
                        </div>
                    )}
                </div>
            </div>

            {/* Top-right controls */}
            <div className="fixed top-4 right-4 flex items-center gap-2 z-[10001]">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 p-2"
                    aria-label="Toggle mute"
                >
                    {/* We can't easily read plyr state without extra state wiring; icon is just a hint */}
                    <Volume2 className="w-5 h-5 text-white" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 p-2"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>,
        document.body
    );
}