import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Play, Info, Check, Loader2 } from 'lucide-react';

// --- Added imports for authentication and Firebase functions ---
import { useAuth } from '../context/AuthContext';
import {
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
} from '../firebase';

// --- Utility for conditional classes ---
const cx = (...c) => c.filter(Boolean).join(" ");

export default function ModalLessMovieCard({ movie }) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // --- State for watchlist functionality ---
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [isListBusy, setIsListBusy] = useState(false);

    // --- Effect to check if the movie is in the user's watchlist ---
    useEffect(() => {
        if (!currentUser) {
            setIsInWatchlist(false);
            return;
        }

        let isMounted = true;
        const checkWatchlist = async () => {
            try {
                // Fetch the entire watchlist once
                const watchlist = await getWatchlist(currentUser.uid);
                if (isMounted) {
                    // Check if the current movie's ID is in the list
                    setIsInWatchlist(watchlist.includes(movie.id));
                }
            } catch (error) {
                console.error("Failed to check watchlist status:", error);
            }
        };

        checkWatchlist();

        return () => {
            isMounted = false; // Cleanup to prevent state updates on unmounted components
        };
    }, [currentUser, movie.id]);

    // --- Handler to add or remove the movie from the watchlist ---
    const handleWatchlistToggle = async (e) => {
        e.stopPropagation(); // Prevents the card's navigate function from firing
        if (!currentUser || isListBusy) return;

        setIsListBusy(true);
        try {
            if (isInWatchlist) {
                await removeFromWatchlist(currentUser.uid, movie.id);
                setIsInWatchlist(false);
            } else {
                await addToWatchlist(currentUser.uid, movie.id);
                setIsInWatchlist(true);
            }
        } catch (error) {
            console.error("Failed to update watchlist:", error);
        } finally {
            setIsListBusy(false);
        }
    };

    const handleNavigate = () => {
        navigate(`/watch/${movie.id}`);
    };

    const playTrailer = (e) => {
        e.stopPropagation();
        if (movie.trailerYoutubeID) {
            window.open(`https://www.youtube.com/watch?v=${movie.trailerYoutubeID}`, '_blank');
        } else {
            console.log("No trailer available.");
        }
    };

    return (
        <div
            className="bg-[#1B1A29] rounded-lg overflow-hidden text-white flex flex-col h-full cursor-pointer group"
            onClick={handleNavigate}
        >
            <div className="relative">
                <img src={movie.posterURL} alt={movie.title} className="w-full aspect-[2/3] object-cover" />

            </div>
            <div className="p-3 flex-grow flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-sm">{movie.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <h3 className="font-semibold text-base mb-3 line-clamp-2 flex-grow">{movie.title}</h3>

                {/* --- FULLY FUNCTIONAL WATCHLIST BUTTON --- */}
                <button
                    onClick={handleWatchlistToggle}
                    disabled={!currentUser || isListBusy}
                    className={cx(
                        "w-full flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-md text-sm transition-colors mb-2",
                        !currentUser && "bg-gray-500/50 cursor-not-allowed",
                        isInWatchlist
                            ? "bg-green-600/20 text-green-300 hover:bg-green-600/30"
                            : "bg-[#2C2C2C] hover:bg-[#3C3C3C] text-white"
                    )}
                >
                    {isListBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isInWatchlist ? (
                        <>
                            <Check className="w-4 h-4" />
                            <span>Listed</span>
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            <span>Watchlist</span>
                        </>
                    )}
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