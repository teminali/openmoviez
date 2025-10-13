// src/pages/MovieDetailsPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Plyr from "plyr-react";
import "plyr/dist/plyr.css";
import { motion } from "framer-motion";
import {
    Play, Clock, Calendar, Users, ChevronDown, ChevronUp, Star, MessageSquare,
    Film, BadgeInfo, Loader2, ChevronLeft, Share2, Pencil, Languages, Globe2,
    Building2, Heart, User as UserIcon
} from "lucide-react";

import Spinner from "../components/Spinner.jsx";
import {
    getMovieById,
    getComments,
    addComment,
    addReply,
    getRatings,
    addRating,
    getPeopleByIds,
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updateMovie
} from "../firebase";
import { useAuth } from "../context/AuthContext";

// ------------------------------------------------------------
// Utility helpers
// ------------------------------------------------------------
const cx = (...xs) => xs.filter(Boolean).join(" ");
const formatDate = (ts) => {
    try {
        if (!ts) return "";
        if (typeof ts === "number") return new Date(ts).toLocaleDateString();
        if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
        return new Date(ts).toLocaleDateString();
    } catch {
        return "";
    }
};

// ------------------------------------------------------------
// Reusable UI primitives (Tailwind only)
// ------------------------------------------------------------
const Pill = ({ children }) => (
    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs border border-white/15">
    {children}
  </span>
);

const Card = ({ children, className = "" }) => (
    <div className={cx("rounded-2xl border border-white/10 bg-white/[0.03]", className)}>
        {children}
    </div>
);

const Section = ({ title, icon: Icon, children, right, id }) => (
    <section id={id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-white font-semibold">
                {Icon ? <Icon className="w-5 h-5 text-white/80" /> : null}
                <span>{title}</span>
            </h3>
            {right}
        </div>
        {children}
    </section>
);

const Skeleton = ({ className = "" }) => (
    <div className={cx("animate-pulse rounded bg-white/10", className)} />
);

// ------------------------------------------------------------
// Subcomponents
// ------------------------------------------------------------
function PersonCard({ person }) {
    return (
        <div className="flex items-center gap-3 p-2 rounded-xl border border-white/10 bg-white/[0.03]">
            <img
                src={person.photoURL || "/avatar_placeholder.png"}
                alt={person.name}
                className="w-12 h-14 rounded-md object-cover"
            />
            <div className="min-w-0">
                <div className="font-semibold text-white truncate">{person.name}</div>
                {person.character && (
                    <div className="text-sm text-white/60 truncate">as {person.character}</div>
                )}
            </div>
        </div>
    );
}

function ExpandablePeople({ title, people = [], max = 6 }) {
    const [open, setOpen] = useState(false);
    if (!people?.length) return null;
    const visible = open ? people : people.slice(0, max);
    return (
        <div className="mb-6">
            <h4 className="text-base font-semibold text-white/80 mb-3">{title}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visible.map((p, i) => (
                    <PersonCard key={`${title}-${i}-${p.name}`} person={p} />
                ))}
            </div>
            {people.length > max && (
                <button
                    onClick={() => setOpen(!open)}
                    className="mt-3 text-sm text-indigo-300 hover:text-indigo-200"
                >
                    {open ? "Show less" : `Show all ${people.length}`}
                </button>
            )}
        </div>
    );
}

function RatingStars({ value = 0, onRate, disabled, px = 20 }) {
    const rounded = Math.round(value);
    return (
        <div className="flex items-center gap-1" aria-label={`Average rating ${Number(value || 0).toFixed(1)} out of 10`}>
            {Array.from({ length: 10 }).map((_, i) => (
                <button
                    key={i}
                    type="button"
                    title={`Rate ${i + 1}`}
                    onClick={() => onRate && onRate(i + 1)}
                    disabled={disabled}
                    className={cx(
                        "transition-transform",
                        i < rounded ? "text-yellow-400" : "text-gray-500",
                        disabled ? "cursor-not-allowed" : "hover:scale-110"
                    )}
                    style={{ lineHeight: 0 }}
                >
                    <Star className="fill-current" style={{ width: px, height: px }} />
                </button>
            ))}
        </div>
    );
}

function RatingHistogram({ ratings = [] }) {
    const buckets = useMemo(() => {
        const counts = Array(10).fill(0);
        ratings.forEach((r) => {
            const v = Math.min(10, Math.max(1, Math.round(r.value)));
            counts[v - 1] += 1;
        });
        const total = Math.max(1, ratings.length);
        return counts.map((c) => ({ c, pct: (c / total) * 100 }));
    }, [ratings]);

    return (
        <div className="space-y-1" aria-label="Rating distribution">
            {buckets
                .map((b, idx) => ({ ...b, label: `${idx + 1}` }))
                .reverse()
                .map((b) => (
                    <div key={b.label} className="flex items-center gap-3 text-sm">
                        <span className="w-6 text-right text-gray-400">{b.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: `${b.pct}%` }} />
                        </div>
                        <span className="w-10 text-right text-gray-400">{b.c}</span>
                    </div>
                ))}
        </div>
    );
}

function EpisodePicker({ content, currentEpisode, onPick }) {
    const [expandedSeasons, setExpandedSeasons] = useState({});
    const groups = useMemo(() => {
        if (content?.type !== "series") return {};
        const bySeason = {};
        (content.episodes || []).forEach((ep) => {
            const s = ep.seasonNumber || 1;
            if (!bySeason[s]) bySeason[s] = [];
            bySeason[s].push(ep);
        });
        Object.values(bySeason).forEach((arr) =>
            arr.sort((a, b) => a.episodeNumber - b.episodeNumber)
        );
        return bySeason;
    }, [content]);

    const handleKey = useCallback(
        (e) => {
            if (!currentEpisode || !content?.episodes?.length) return;
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                const idx = content.episodes.findIndex((x) => x === currentEpisode);
                if (idx > 0) onPick(content.episodes[idx - 1]);
            }
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                const idx = content.episodes.findIndex((x) => x === currentEpisode);
                if (idx < content.episodes.length - 1) onPick(content.episodes[idx + 1]);
            }
        },
        [content, currentEpisode, onPick]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleKey]);

    return (
        <div className="space-y-3">
            {Object.keys(groups)
                .sort((a, b) => Number(a) - Number(b))
                .map((season) => {
                    const open = !!expandedSeasons[season];
                    return (
                        <div key={season} className="rounded-2xl border border-white/10 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setExpandedSeasons((s) => ({ ...s, [season]: !open }))}
                                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/10"
                            >
                                <div className="flex items-center gap-2">
                                    <Film className="w-4 h-4 text-white/70" />
                                    <span className="text-white font-medium">Season {season}</span>
                                </div>
                                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <div className={cx("grid gap-2 p-3 transition-all", open ? "grid-cols-1 sm:grid-cols-2" : "hidden")}>
                                {groups[season].map((ep, i) => {
                                    const active = currentEpisode && ep.id === currentEpisode.id;
                                    return (
                                        <button
                                            key={`${season}-${ep.episodeNumber}-${i}`}
                                            onClick={() => onPick(ep)}
                                            className={cx(
                                                "text-left rounded-xl border px-3 py-2",
                                                active
                                                    ? "bg-indigo-600/25 border-indigo-400/40"
                                                    : "bg-white/[0.03] hover:bg-white/10 border-white/10"
                                            )}
                                        >
                                            <div className="text-xs text-white/60 mb-0.5">
                                                S{ep.seasonNumber}:E{ep.episodeNumber}
                                            </div>
                                            <div className="text-white font-medium truncate">
                                                {ep.title || `Episode ${ep.episodeNumber}`}
                                            </div>
                                            {ep.runtime && (
                                                <div className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {ep.runtime}m
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}

function CommentComposer({ currentUser, onSubmit, placeholder = "Write a comment...", submitting }) {
    const [text, setText] = useState("");
    return (
        <div className="flex gap-3">
            <img
                src={currentUser?.photoURL || "/avatar_placeholder.png"}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
                <div className="flex items-center gap-3 mt-2">
                    <button
                        onClick={async () => {
                            const ok = text.trim().length > 0;
                            if (!ok) return;
                            await onSubmit(text);
                            setText("");
                        }}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white disabled:bg-gray-600"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {submitting ? "Posting..." : "Post"}
                    </button>
                    <span className="text-xs text-white/50">Be respectful. No spoilers without tags.</span>
                </div>
            </div>
        </div>
    );
}

function ReplyInline({ currentUser, onSubmit, onCancel, submitting }) {
    const [text, setText] = useState("");
    return (
        <div className="mt-2 flex items-start gap-2">
            <img src={currentUser?.photoURL || "/avatar_placeholder.png"} alt="avatar" className="w-8 h-8 rounded-full" />
            <div className="flex-1">
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Write a reply..."
            className="w-full p-2 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
                <div className="mt-2 flex items-center gap-2">
                    <button
                        onClick={async () => {
                            if (!text.trim()) return;
                            await onSubmit(text);
                            setText("");
                        }}
                        disabled={submitting}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 text-white disabled:bg-gray-600"
                    >
                        {submitting ? "Posting..." : "Post Reply"}
                    </button>
                    <button type="button" onClick={onCancel} className="text-white/70 hover:text-white text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
export default function MovieDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [content, setContent] = useState(null);
    const [currentEpisode, setCurrentEpisode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [comments, setComments] = useState([]);
    const [commentsSort, setCommentsSort] = useState("new");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [ratings, setRatings] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [isWatchlistLoading, setIsWatchlistLoading] = useState(true);
    const [shareText, setShareText] = useState("Share");

    // Fetch primary content
    useEffect(() => {
        window.scrollTo(0, 0);
        const run = async () => {
            setIsLoading(true);
            try {
                const doc = await getMovieById(id);
                if (!doc) throw new Error("Could not find the requested content.");

                const directorIds = doc.directors || [];
                const actorPersonIds = (doc.actors || []).map((a) => a.personId);
                const allPersonIds = [...new Set([...directorIds, ...actorPersonIds])];

                if (allPersonIds.length > 0) {
                    const peopleMap = await getPeopleByIds(allPersonIds);
                    doc.directors = directorIds
                        .map((personId) => {
                            const person = peopleMap[personId];
                            return person
                                ? { id: person.id, name: person.name, photoURL: person.profilePicURL }
                                : null;
                        })
                        .filter(Boolean);
                    doc.actors = (doc.actors || [])
                        .map((actor) => {
                            const person = peopleMap[actor.personId];
                            return person
                                ? {
                                    id: person.id,
                                    name: person.name,
                                    photoURL: person.profilePicURL,
                                    character: actor.characterName,
                                }
                                : null;
                        })
                        .filter(Boolean);
                }

                if (doc.type === "series" && Array.isArray(doc.episodes) && doc.episodes.length) {
                    const sorted = [...doc.episodes].sort(
                        (a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber
                    );
                    doc.episodes = sorted;
                    setCurrentEpisode(sorted[0]);
                }

                setContent(doc);
            } catch (e) {
                setErrorMessage(e.message || "Something went wrong");
            } finally {
                setIsLoading(false);
            }
        };
        if (id) run();
    }, [id]);

    // Derive player source
    const playerSource = useMemo(() => {
        if (!content) return null;
        let sourceItem = content;
        if (content.type === "series") {
            sourceItem = currentEpisode || content.episodes?.[0];
        }
        if (!sourceItem) return null;

        if (sourceItem.youtubeID) {
            return { type: "video", sources: [{ src: sourceItem.youtubeID, provider: "youtube" }] };
        }
        if (sourceItem.videoURL) {
            return { type: "video", sources: [{ src: sourceItem.videoURL }] };
        }
        return null;
    }, [content, currentEpisode]);

    // Fetch secondary data
    useEffect(() => {
        const runSecondaryFetches = async () => {
            if (!content) return;

            const [fetchedComments, fetchedRatings] = await Promise.all([
                getComments(content.id),
                getRatings(content.id),
            ]);

            const sortedComments = [...fetchedComments].sort((a, b) =>
                commentsSort === "new"
                    ? (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                    : (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
            );
            setComments(sortedComments);

            setRatings(fetchedRatings);
            const sum = fetchedRatings.reduce((acc, r) => acc + (r.value || 0), 0);
            setAvgRating(fetchedRatings.length ? sum / fetchedRatings.length : 0);
            if (currentUser) {
                const userRatingDoc = fetchedRatings.find((r) => r.userId === currentUser.uid);
                setUserRating(userRatingDoc?.value || 0);
            } else {
                setUserRating(0);
            }

            if (currentUser) {
                setIsWatchlistLoading(true);
                const list = await getWatchlist(currentUser.uid);
                setIsInWatchlist(list.includes(id));
                setIsWatchlistLoading(false);
            } else {
                setIsWatchlistLoading(false);
            }
        };
        runSecondaryFetches();
    }, [content, currentUser, commentsSort, id]);

    // Handlers
    const handleAddComment = async (text) => {
        if (!currentUser) return;
        setIsSubmittingComment(true);
        try {
            const payload = {
                text,
                userId: currentUser.uid,
                userName: currentUser.displayName || "Anonymous",
                userPhoto: currentUser.photoURL || "/avatar_placeholder.png",
                createdAt: new Date(),
            };
            const newId = await addComment(content.id, payload);
            setComments((prev) => [{ id: newId, ...payload, replies: [] }, ...prev]);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleAddReply = async (parentId, text) => {
        if (!currentUser) return;
        setIsSubmittingReply(true);
        try {
            const payload = {
                text,
                userId: currentUser.uid,
                userName: currentUser.displayName || "Anonymous",
                userPhoto: currentUser.photoURL || "/avatar_placeholder.png",
                createdAt: new Date(),
            };
            const replyId = await addReply(content.id, parentId, payload);
            setComments((prev) =>
                prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies || []), { id: replyId, ...payload }] } : c))
            );
        } finally {
            setIsSubmittingReply(false);
            setReplyingTo(null);
        }
    };

    const handleRate = async (value) => {
        if (!currentUser || isSubmittingRating) return;
        setIsSubmittingRating(true);
        try {
            await addRating(content.id, currentUser.uid, value);
            setUserRating(value);
            const updated = await getRatings(content.id);
            setRatings(updated);
            const sum = updated.reduce((acc, r) => acc + (r.value || 0), 0);
            const newAvg = updated.length ? sum / updated.length : 0;
            setAvgRating(newAvg);
            await updateMovie(content.id, { rating: newAvg });
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleWatchlistToggle = async () => {
        if (!currentUser || isWatchlistLoading) return;
        setIsWatchlistLoading(true);
        try {
            if (isInWatchlist) {
                await removeFromWatchlist(currentUser.uid, id);
                setIsInWatchlist(false);
            } else {
                await addToWatchlist(currentUser.uid, id);
                setIsInWatchlist(true);
            }
        } catch (err) {
            console.error("Failed to update watchlist:", err);
        } finally {
            setIsWatchlistLoading(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: content.title,
            text: `Check out "${content.title}" on MovieShare!`,
            url: window.location.href,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Share API failed:", err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                setShareText("Copied!");
                setTimeout(() => setShareText("Share"), 2000);
            });
        }
    };

    const canEdit = currentUser && (currentUser.uid === content?.uploaderId || currentUser.isAdmin);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 grid place-items-center">
                <Spinner />
            </div>
        );
    }
    if (errorMessage) {
        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
                <header className="mt-0 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
                    <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                            <UserIcon className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Movie</h1>
                            <p className="text-sm text-slate-400">We hit a snag loading this title.</p>
                        </div>
                        <div className="flex-1" />
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-12">
                    <Card className="p-8 text-center">
                        <h1 className="text-red-400 text-3xl font-bold">Error</h1>
                        <p className="text-slate-300 mt-4">{errorMessage}</p>
                        <Link
                            to="/"
                            className="mt-8 inline-block bg-indigo-500/90 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition"
                        >
                            &larr; Back to Home
                        </Link>
                    </Card>
                </main>
            </div>
        );
    }
    if (!content) return null;

    const backdrop = content.coverURL || content.posterURL;

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
            {/* Sticky header to match Dashboard */}
            <header className="mt-0 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
                <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
                    <Link
                        to="/"
                        className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10"
                        title="Back"
                    >
                        <ChevronLeft className="size-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">{content.title}</h1>
                        <p className="text-sm text-slate-400">{content.year ? `Released ${content.year}` : "Details"}</p>
                    </div>
                    <div className="flex-1" />
                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm font-medium inline-flex items-center gap-2"
                        >
                            <Share2 className="w-4 h-4" /> {shareText}
                        </button>
                        <button
                            onClick={handleWatchlistToggle}
                            disabled={!currentUser || isWatchlistLoading}
                            className={cx(
                                "rounded-xl px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border",
                                isInWatchlist
                                    ? "bg-pink-600 text-white border-pink-500 hover:bg-pink-700"
                                    : "bg-white/5 hover:bg-white/10 border-white/10",
                                (!currentUser || isWatchlistLoading) && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            <Heart className="w-4 h-4" />
                            {isWatchlistLoading ? "..." : (isInWatchlist ? "In Watchlist" : "Watchlist")}
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => navigate(`/share/${content.id}`)}
                                className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm font-medium inline-flex items-center gap-2"
                            >
                                <Pencil className="w-4 h-4" /> Edit
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* HERO */}
            <div className="relative w-full min-h-[40vh] md:min-h-[52vh] lg:min-h-[60vh] overflow-hidden">
                <img src={backdrop} alt="Backdrop" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
                <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-24 pb-10 flex flex-col lg:flex-row gap-8">
                    <div className="flex-shrink-0">
                        <img
                            src={content.posterURL}
                            alt={content.title}
                            className="w-40 md:w-48 lg:w-56 aspect-[2/3] object-cover rounded-2xl shadow-2xl border border-white/10"
                        />
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex items-center gap-2 mb-2">
                            {content.genres?.slice(0, 4).map((g) => (
                                <Pill key={g}>{g}</Pill>
                            ))}
                        </div>
                        {/*left aligned*/}
                        <div className="flex items-center gap-2 mb-2">
                            <li className="list-none">
                                <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
                                    {content.title}{" "}
                                    <span className="text-white/70 font-light">
                                {content.year ? `(${content.year})` : ""}
                            </span>
                                </h1>
                            </li>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-white/80">
                            {content.runtime && (
                                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {content.runtime} min
                </span>
                            )}
                            {content.releaseDate && (
                                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {formatDate(content.releaseDate)}
                </span>
                            )}
                            {content.language && (
                                <span className="inline-flex items-center gap-2">
                  <Languages className="w-4 h-4" /> {content.language}
                </span>
                            )}
                            {content.country && (
                                <span className="inline-flex items-center gap-2">
                  <Globe2 className="w-4 h-4" /> {content.country}
                </span>
                            )}
                            {content.uploaderName && (
                                <span className="inline-flex items-center gap-2">
                  <Users className="w-4 h-4" /> Shared by {content.uploaderName}
                </span>
                            )}
                        </div>
                        <div className="mt-5 flex flex-col md:flex-row md:items-center gap-4">
                            <a
                                href="#player"
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 font-medium"
                            >
                                <Play className="w-5 h-5" /> Play
                            </a>
                            {!currentUser && <span className="text-xs text-white/60 -ml-2">Login to save</span>}
                            <div className="flex items-center gap-3 ml-0 md:ml-auto">
                                <div className="flex items-center gap-2">
                                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                    <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                                    <span className="text-white/50">/ 10</span>
                                </div>
                                <div className="h-6 w-px bg-white/20" />
                                <RatingStars value={userRating || avgRating} onRate={handleRate} disabled={!currentUser || isSubmittingRating} px={18} />
                                {!currentUser && <span className="text-xs text-red-300">Login to rate</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN */}
            <main className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6 min-w-0">
                        <Section title="Watch" icon={Play} id="player">
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                                    {playerSource ? (
                                        <Plyr
                                            source={playerSource}
                                            options={{ youtube: { noCookie: true, rel: 0 } }}
                                        />
                                    ) : (
                                        <div className="w-full h-full grid place-items-center text-white/50">
                                            Video unavailable
                                        </div>
                                    )}
                                </div>
                                {content.type === "series" && currentEpisode && (
                                    <div className="mt-3 text-sm text-white/80">
                                        Now Playing:{" "}
                                        <span className="font-semibold">
                      S{currentEpisode.seasonNumber}:E{currentEpisode.episodeNumber}
                    </span>
                                        {currentEpisode.title ? ` — ${currentEpisode.title}` : ""}
                                    </div>
                                )}
                            </motion.div>
                        </Section>

                        <Section title="Overview" icon={BadgeInfo}>
                            <p className="text-white/80 leading-relaxed whitespace-pre-line">
                                {content.description}
                            </p>
                        </Section>

                        {(content.directors?.length > 0 || content.actors?.length > 0) && (
                            <Section title="Cast & Crew" icon={Users}>
                                <ExpandablePeople title="Directors" people={content.directors} />
                                <ExpandablePeople title="Cast" people={content.actors} />
                            </Section>
                        )}

                        <Section
                            title={`Comments (${comments.length})`}
                            icon={MessageSquare}
                            right={
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-white/60">Sort</span>
                                    <div className="flex rounded-lg border border-white/10 overflow-hidden">
                                        <button
                                            className={cx("px-3 py-1.5", commentsSort === "new" ? "bg-white/10" : "bg-transparent")}
                                            onClick={() => setCommentsSort("new")}
                                        >
                                            Newest
                                        </button>
                                        <button
                                            className={cx("px-3 py-1.5", commentsSort === "old" ? "bg-white/10" : "bg-transparent")}
                                            onClick={() => setCommentsSort("old")}
                                        >
                                            Oldest
                                        </button>
                                    </div>
                                </div>
                            }
                        >
                            {currentUser ? (
                                <CommentComposer
                                    currentUser={currentUser}
                                    submitting={isSubmittingComment}
                                    onSubmit={handleAddComment}
                                />
                            ) : (
                                <p className="text-white/70">
                                    Please <Link to="/login" className="text-indigo-300 underline">log in</Link> to comment.
                                </p>
                            )}

                            <div className="mt-6 space-y-5">
                                {comments.length === 0 && (
                                    <div className="text-white/60">No comments yet. Be the first!</div>
                                )}
                                {comments.map((c) => (
                                    <Card key={c.id} className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={c.userPhoto} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-white truncate">{c.userName}</span>
                                                    <span className="text-xs text-white/50">{formatDate(c.createdAt)}</span>
                                                </div>
                                                <p className="text-white/80 mt-1 whitespace-pre-line">{c.text}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            {currentUser ? (
                                                replyingTo === c.id ? (
                                                    <ReplyInline
                                                        onCancel={() => setReplyingTo(null)}
                                                        submitting={isSubmittingReply}
                                                        onSubmit={(text) => handleAddReply(c.id, text)}
                                                        currentUser={currentUser}
                                                    />
                                                ) : (
                                                    <button
                                                        className="text-indigo-300 text-sm hover:underline"
                                                        onClick={() => setReplyingTo(c.id)}
                                                    >
                                                        Reply
                                                    </button>
                                                )
                                            ) : null}
                                        </div>
                                        {c.replies?.length ? (
                                            <div className="mt-4 pl-6 border-l border-white/10 space-y-4">
                                                {c.replies.map((r) => (
                                                    <div key={r.id} className="flex items-start gap-3">
                                                        <img src={r.userPhoto} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-white">{r.userName}</span>
                                                                <span className="text-[11px] text-white/50">{formatDate(r.createdAt)}</span>
                                                            </div>
                                                            <p className="text-white/80 text-sm mt-1 whitespace-pre-line">{r.text}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : null}
                                    </Card>
                                ))}
                            </div>
                        </Section>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        {content.type === "series" && (
                            <Section title="Episodes" icon={Film}>
                                <EpisodePicker
                                    content={content}
                                    currentEpisode={currentEpisode}
                                    onPick={setCurrentEpisode}
                                />
                            </Section>
                        )}

                        <Section title="Info" icon={BadgeInfo}>
                            <div className="space-y-2 text-sm">
                                {content.status && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Status</span>
                                        <span className="text-white">{content.status}</span>
                                    </div>
                                )}
                                {content.production && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Production</span>
                                        <span className="text-white flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                                            {content.production}
                    </span>
                                    </div>
                                )}
                                {content.country && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Country</span>
                                        <span className="text-white">{content.country}</span>
                                    </div>
                                )}
                                {content.language && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Language</span>
                                        <span className="text-white">{content.language}</span>
                                    </div>
                                )}
                                {content.releaseDate && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Released</span>
                                        <span className="text-white">{formatDate(content.releaseDate)}</span>
                                    </div>
                                )}
                                {content.budget && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Budget</span>
                                        <span className="text-white">{content.budget}</span>
                                    </div>
                                )}
                                {content.revenue && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Box Office</span>
                                        <span className="text-white">{content.revenue}</span>
                                    </div>
                                )}
                                {content.ageRating && (
                                    <div className="flex justify-between">
                                        <span className="text-white/60">Age Rating</span>
                                        <span className="text-white">{content.ageRating}</span>
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section title="Audience Ratings" icon={Star}>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-4xl font-bold">{avgRating.toFixed(1)}</div>
                                    <div className="text-xs text-white/60">out of 10</div>
                                </div>
                                <div className="flex-1">
                                    <RatingHistogram ratings={ratings} />
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white">
                        <ChevronLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    {canEdit && (
                        <button
                            onClick={() => navigate(`/share/${content.id}`)}
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white"
                        >
                            <Pencil className="w-4 h-4" /> Edit Title
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}