// src/components/MovieCard.jsx
import React, { useRef, useState } from "react";
import { Star, Plus } from "lucide-react";
import { usePreviewModal } from "../context/PreviewModalContext";

// In a real app, you would import this from your context file
// For this preview, we'll mock it if it's not provided.
const MockPreviewModalContext = React.createContext({
    showPreview: (movie) => console.log("Showing preview for:", movie.title),
});

const usePreviewModalContext = () => {
    return React.useContext(usePreviewModal ? MockPreviewModalContext : MockPreviewModalContext)
}


export default function MovieCard({ movie }) {
    const { showPreview } = usePreviewModal ? usePreviewModal() : usePreviewModalContext();
    const hoverTimeout = useRef(null);
    const cardRef = useRef(null);
    const [imgLoaded, setImgLoaded] = useState(false);

    const openCompactPreview = () => {
        showPreview(movie, cardRef.current /* anchor */, false);
    };

    const openExpandedPreview = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current); // Prevent hover action on click
        showPreview(movie, cardRef.current /* anchor */, true);
    };

    const handleEnter = () => {
        hoverTimeout.current = setTimeout(openCompactPreview, 1000); // 1-second delay
    };
    const handleLeave = () => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };

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
                {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-slate-800/60" />}
                <img
                    src={movie.posterURL}
                    alt={movie.title}
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-sm">{movie.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <h3 className="font-semibold text-base line-clamp-2">{movie.title}</h3>
            </div>
        </div>
    );
}