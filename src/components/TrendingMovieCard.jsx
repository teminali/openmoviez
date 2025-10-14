// src/components/TrendingMovieCard.jsx
import React, { useRef } from "react";
import { usePreviewModal } from "../context/PreviewModalContext"; // Assuming context is in this path

export default function TrendingMovieCard({ movie, index }) {
    const { showPreview } = usePreviewModal();
    const hoverTimeout = useRef(null);
    const cardRef = useRef(null);

    const openCompactPreview = () => {
        showPreview(movie, cardRef.current /* anchor */, false);
    };

    const openExpandedPreview = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current); // Prevent hover action on click
        showPreview(movie, cardRef.current /* anchor */, true);
    };

    const handleEnter = () => {
        hoverTimeout.current = setTimeout(openCompactPreview, 1000); // Changed to 1-second delay
    };

    const handleLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };

    return (
        <li
            ref={cardRef}
            className="relative min-w-[200px] max-w-[200px] cursor-pointer"
            onPointerEnter={handleEnter}
            onPointerLeave={handleLeave}
            onClick={openExpandedPreview}
            tabIndex={0}
            onFocus={handleEnter}
        >
            <div className="pointer-events-none absolute -left-7 top-1/2 -translate-y-1/2 select-none">
                <span
                    className="block leading-none font-extrabold tracking-tight text-[110px] md:text-[150px]"
                    style={{
                        WebkitTextStroke: "6px rgba(255,255,255,0.18)",
                        color: "transparent",
                        textShadow: "0 0 22px rgba(0,0,0,0.45)",
                    }}
                >
                    {index + 1}
                </span>
            </div>
            <div className="group block relative z-10">
                <div className="ml-6 aspect-[11/16] rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
                    <img
                        src={movie.posterURL}
                        alt={movie.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <div className="mt-2 ml-6 text-sm text-white/90 truncate group-hover:text-indigo-300">
                    {movie.title}
                </div>
            </div>
        </li>
    );
}