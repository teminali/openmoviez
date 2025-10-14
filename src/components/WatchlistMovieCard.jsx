// src/components/WatchlistMovieCard.jsx
import React, { useRef } from "react";
import { CheckSquare, Square, Star, Trash2 } from "lucide-react";
import { usePreviewModal } from "../context/PreviewModalContext";

const cx = (...xs) => xs.filter(Boolean).join(" ");

export default function WatchlistMovieCard({ movie, onRemove, selectable, selected, onToggleSelect }) {
    const { showPreview } = usePreviewModal();
    const hoverTimeout = useRef(null);
    const cardRef = useRef(null);

    const openCompactPreview = () => {
        showPreview(movie, cardRef.current, false);
    };

    const openExpandedPreview = () => {
        if (selectable) {
            onToggleSelect();
            return;
        }
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        showPreview(movie, cardRef.current, true);
    };

    const handleEnter = () => {
        if (selectable) return;
        hoverTimeout.current = setTimeout(openCompactPreview, 2000);
    };

    const handleLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        onRemove(movie);
    };

    const rating = movie.rating || movie.avgRating || 0;

    return (
        <div
            ref={cardRef}
            className="bg-[#1A1A1A] rounded-lg overflow-hidden text-white flex flex-col h-full cursor-pointer group"
            onPointerEnter={handleEnter}
            onPointerLeave={handleLeave}
            onClick={openExpandedPreview}
            tabIndex={0}
            onFocus={handleEnter}
        >
            <div className="relative">
                <img
                    src={movie.posterURL}
                    alt={movie.title}
                    loading="lazy"
                    className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* --- Overlaid Buttons --- */}
                {selectable && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect();
                        }}
                        className={cx(
                            "absolute z-10 top-2 left-2 rounded-md p-1.5 text-xs border transition-colors",
                            selected
                                ? "bg-indigo-500/90 border-indigo-400"
                                : "bg-black/60 border-white/20 hover:bg-black/80"
                        )}
                        aria-label={selected ? "Deselect" : "Select"}
                    >
                        {selected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                    </button>
                )}

                <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Remove from watchlist"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* --- Content Area --- */}
            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-sm">{Number(rating).toFixed(1)}</span>
                </div>
                <h3 className="font-semibold text-base line-clamp-2">{movie.title}</h3>
            </div>
        </div>
    );
}