import React from 'react'; // Removed useRef as it's no longer needed for hoverTimeout
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Play, Info } from 'lucide-react';

export default function ModalLessMovieCard({ movie }) {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate(`/watch/${movie.id}`);
    };

    // A placeholder function for trailer if not available
    const playTrailer = (e) => {
        e.stopPropagation();
        if (movie.trailerYoutubeID) {
            window.open(`https://www.youtube.com/watch?v=${movie.trailerYoutubeID}`, '_blank');
        } else {
            // You can add a toast notification here
            console.log("No trailer available.");
        }
    };

    return (
        <div
            className="bg-[#1A1A1A] rounded-lg overflow-hidden text-white flex flex-col h-full cursor-pointer group"
            onClick={handleNavigate} // Navigation now only happens on click
        >
            <div className="relative">
                <img src={movie.posterURL} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
                <button
                    onClick={(e) => {e.stopPropagation(); console.log('Add to library')}}
                    className="absolute top-2 left-2 bg-black/60 p-1.5 rounded-md hover:bg-black/80 transition-colors"
                    aria-label="Add to library"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="p-3 flex-grow flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-sm">{movie.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <h3 className="font-semibold text-base mb-3 line-clamp-2 flex-grow">{movie.title}</h3>
                <button
                    onClick={(e) => {e.stopPropagation(); console.log('Add to watchlist')}}
                    className="w-full bg-[#2C2C2C] hover:bg-[#3C3C3C] text-white font-bold py-2 px-4 rounded-md text-sm transition-colors mb-2"
                >
                    + Watchlist
                </button>
                <div className="flex items-center justify-between text-sm text-gray-400">
                    <button onClick={playTrailer} className="flex items-center gap-2 hover:text-white">
                        <Play className="w-4 h-4" />
                        <span>Trailer</span>
                    </button>
                    <button onClick={(e) => {e.stopPropagation(); console.log('More info')}} className="hover:text-white">
                        <Info className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}