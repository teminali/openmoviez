// src/pages/ShareMoviePage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { shareNewMovie } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {GENRE_LIST} from "../data.js";

/**
 * Tailwind-only UI primitives (match Dashboard/Admin styling)
 */
const cx = (...cls) => cls.filter(Boolean).join(" ");
const Shell = ({ children }) => (
    <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">{children}</div>
);
const Container = ({ children }) => (
    <div className="mx-auto max-w-6xl px-4">{children}</div>
);
const Card = ({ className = "", children }) => (
    <div className={cx("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur", className)}>{children}</div>
);
const CardHeader = ({ className = "", children }) => (
    <div className={cx("border-b border-white/10 px-5 py-4", className)}>{children}</div>
);
const CardTitle = ({ className = "", children }) => (
    <h3 className={cx("text-base font-medium", className)}>{children}</h3>
);
const CardDescription = ({ className = "", children }) => (
    <p className={cx("text-sm text-slate-400", className)}>{children}</p>
);
const CardContent = ({ className = "", children }) => (
    <div className={cx("p-5", className)}>{children}</div>
);
const Label = ({ className = "", children }) => (
    <label className={cx("block text-xs font-medium text-slate-300", className)}>{children}</label>
);
const Input = ({ className = "", ...props }) => (
    <input
        {...props}
        className={cx(
            "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-white/20",
            className
        )}
    />
);
const Textarea = ({ className = "", ...props }) => (
    <textarea
        {...props}
        className={cx(
            "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-white/20",
            className
        )}
    />
);
const Button = ({ className = "", variant = "primary", ...props }) => {
    const base = "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition";
    const variants = {
        primary: "bg-indigo-500/90 text-white hover:bg-indigo-500",
        secondary: "bg-white/5 border border-white/10 text-slate-100 hover:bg-white/10",
        ghost: "text-slate-300 hover:text-white hover:bg-white/10",
        danger: "bg-red-500/90 text-white hover:bg-red-500",
    };
    return <button {...props} className={cx(base, variants[variant], className)} />;
};
const Badge = ({ className = "", children }) => (
    <span className={cx("inline-flex items-center rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-slate-200", className)}>{children}</span>
);
const Progress = ({ value = 0, className = "" }) => (
    <div className={cx("h-2 w-full rounded-full bg-white/5", className)}>
        <div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} className="h-full rounded-full bg-white/40"></div>
    </div>
);

/**
 * Helpers / constants
 */

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function getYoutubeId(url) {
    if (!url) return null;
    const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}
// Helper to format a Date object into a string for `datetime-local` input
function formatDateForInput(date) {
    if (!date) return "";
    const d = new Date(date);
    // Adjust for timezone offset to display local time correctly in the input
    const timezoneOffset = d.getTimezoneOffset() * 60000;
    const localDate = new Date(d.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
}

/**
 * Genre selector (chips + search)
 */
function GenreSelector({ selected, onChange }) {
    const [query, setQuery] = useState("");
    const filtered = GENRE_LIST.filter(g => g.toLowerCase().includes(query.toLowerCase()));
    const toggle = (g) => {
        if (selected.includes(g)) onChange(selected.filter(x => x !== g));
        else if (selected.length < 5) onChange([...selected, g]);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Genres</CardTitle>
                <CardDescription>Select up to 5 genres.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {selected.length === 0 && <span className="text-xs text-slate-400">No genres selected</span>}
                    {selected.map(g => (
                        <Badge key={g} className="cursor-pointer hover:bg-white/10" onClick={() => toggle(g)}>{g}</Badge>
                    ))}
                </div>
                <Input placeholder="Search genres…" value={query} onChange={(e) => setQuery(e.target.value)} />
                <div className="max-h-40 overflow-auto rounded-xl border border-white/10">
                    {filtered.map(g => {
                        const active = selected.includes(g);
                        const disabled = !active && selected.length >= 5;
                        return (
                            <button
                                type="button"
                                key={g}
                                className={cx(
                                    "w-full px-3 py-2 text-left text-sm hover:bg-white/5",
                                    active && "bg-white/[0.06]",
                                    disabled && "opacity-50 cursor-not-allowed"
                                )}
                                onClick={() => !disabled && toggle(g)}
                                disabled={disabled}
                            >
                                {g}
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Image uploader (drag & drop + preview)
 */
function ImageUploader({ file, onChange, title = "Poster Image", altText = "Poster preview", previewClassName = "h-28 w-20" }) {
    const [drag, setDrag] = useState(false);
    const [preview, setPreview] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!file) { setPreview(null); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const onDrop = (e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f && ["image/jpeg","image/png"].includes(f.type)) onChange(f);
    };

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cx(
                "rounded-2xl border-2 p-4 bg-white/[0.03]",
                drag ? "border-indigo-400" : "border-dashed border-white/15"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cx("overflow-hidden rounded-lg bg-white/5 border border-white/10 flex items-center justify-center", previewClassName)}>
                    {preview ? (
                        <img src={preview} alt={altText} className="h-full w-full object-cover" />
                    ) : (
                        <div className="text-xs text-slate-400">No Image</div>
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-slate-200">
                        {title} <span className="text-slate-500">(JPG or PNG)</span>
                    </p>
                    <div className="mt-2 flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>Upload</Button>
                        {file && (
                            <Button type="button" variant="ghost" onClick={() => onChange(null)}>Remove</Button>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Drag & drop an image here, or click Upload.</p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                        className="hidden"
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * People editor (directors / cast)
 */
function PeopleEditor({ label, items, onChange, type }) {
    const add = () => onChange([...items, { id: crypto.randomUUID?.() || Date.now(), name: "", ...(type === "actor" ? { character: "" } : {}), file: null }]);
    const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
    const update = (idx, key, value) => {
        const next = [...items];
        next[idx][key] = value;
        onChange(next);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">{label}</CardTitle>
                <CardDescription>Optional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((p, idx) => (
                    <div key={p.id} className="rounded-xl border border-white/10 p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <Label>Full Name</Label>
                                <Input value={p.name} onChange={(e) => update(idx, "name", e.target.value)} placeholder={type === "actor" ? "Actor name" : "Director name"} />
                            </div>
                            {type === "actor" && (
                                <div>
                                    <Label>Character</Label>
                                    <Input value={p.character} onChange={(e) => update(idx, "character", e.target.value)} placeholder="e.g., John Wick" />
                                </div>
                            )}
                            <div>
                                <Label>Profile Photo</Label>
                                <Input type="file" accept="image/jpeg,image/png" onChange={(e) => update(idx, "file", e.target.files?.[0] ?? null)} />
                            </div>
                        </div>
                        {items.length > 1 && (
                            <div className="mt-2 flex justify-end">
                                <Button type="button" variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => remove(idx)}>Remove</Button>
                            </div>
                        )}
                    </div>
                ))}
                <Button type="button" variant="secondary" onClick={add}>Add {type === "actor" ? "Actor" : "Director"}</Button>
            </CardContent>
        </Card>
    );
}

/**
 * Episodes editor
 */
function EpisodesEditor({ episodes, setEpisodes }) {
    const add = () => setEpisodes([...episodes, { seasonNumber: "", episodeNumber: "", title: "", videoLink: "" }]);
    const remove = (idx) => setEpisodes(episodes.filter((_, i) => i !== idx));
    const update = (idx, key, value) => {
        const next = [...episodes];
        next[idx][key] = value;
        setEpisodes(next);
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Episodes</CardTitle>
                <CardDescription>Provide unlisted YouTube links for each episode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {episodes.map((ep, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-400">Episode {idx + 1}</div>
                            {episodes.length > 1 && (
                                <Button type="button" variant="ghost" className="text-red-300 hover:text-red-200" onClick={() => remove(idx)}>Remove</Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <Label>Season #</Label>
                                <Input type="number" value={ep.seasonNumber} onChange={(e) => update(idx, "seasonNumber", e.target.value)} />
                            </div>
                            <div>
                                <Label>Episode #</Label>
                                <Input type="number" value={ep.episodeNumber} onChange={(e) => update(idx, "episodeNumber", e.target.value)} />
                            </div>
                            <div className="sm:col-span-2">
                                <Label>Title</Label>
                                <Input value={ep.title} onChange={(e) => update(idx, "title", e.target.value)} placeholder="Episode title" />
                            </div>
                        </div>
                        <div>
                            <Label>YouTube URL</Label>
                            <Input type="url" value={ep.videoLink} onChange={(e) => update(idx, "videoLink", e.target.value)} placeholder="https://youtu.be/… or https://youtube.com/watch?v=…" />
                        </div>
                    </div>
                ))}
                <Button type="button" variant="secondary" onClick={add}>Add Episode</Button>
            </CardContent>
        </Card>
    );
}

/**
 * Page
 */
export default function ShareMoviePage() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Edit mode: read optional :id from URL
    const [movieId, setMovieId] = useState(() => {
        try {
            const m = window?.location?.pathname?.match(/\/share\/(.+)$/);
            return m ? decodeURIComponent(m[1]) : null;
        } catch { return null; }
    });

    const [loadingInit, setLoadingInit] = useState(false);

    const [contentType, setContentType] = useState("movie"); // movie | series
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [year, setYear] = useState("");
    const [releaseDate, setReleaseDate] = useState("");
    const [genres, setGenres] = useState([]);

    const [videoType, setVideoType] = useState("youtube"); // youtube | direct
    const [videoLink, setVideoLink] = useState("");

    const [posterFile, setPosterFile] = useState(null);
    const [posterURL, setPosterURL] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverURL, setCoverURL] = useState(null);

    const [episodes, setEpisodes] = useState([{ seasonNumber: 1, episodeNumber: 1, title: "", videoLink: "" }]);

    const [directors, setDirectors] = useState([{ id: crypto.randomUUID?.() || Date.now(), name: "", file: null }]);
    const [actors, setActors] = useState([{ id: crypto.randomUUID?.() || Date.now() + 1, name: "", character: "", file: null }]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Init (Edit)
    useEffect(() => {
        async function boot() {
            if (!movieId) return;
            try {
                setLoadingInit(true);
                const { getMovieById, getPeopleByIds } = await import("../firebase");
                const doc = await getMovieById(movieId);
                if (!doc) { setError("Title not found or access denied."); return; }

                setContentType(doc.type === "series" ? "series" : "movie");
                setTitle(doc.title || "");
                setDescription(doc.description || "");
                setYear(String(doc.year || ""));
                setReleaseDate(doc.releaseDate ? formatDateForInput(doc.releaseDate.toDate()) : "");
                setGenres(Array.isArray(doc.genres) ? doc.genres : []);

                if (doc.type === "movie") {
                    if (doc.youtubeID) {
                        setVideoType("youtube");
                        setVideoLink(`https://youtu.be/${doc.youtubeID}`);
                    } else if (doc.videoURL) {
                        setVideoType("direct");
                        setVideoLink(doc.videoURL);
                    }
                } else if (Array.isArray(doc.episodes)) {
                    setEpisodes(doc.episodes.map(e => ({
                        seasonNumber: e.seasonNumber ?? "",
                        episodeNumber: e.episodeNumber ?? "",
                        title: e.title ?? "",
                        videoLink: e.youtubeID ? `https://youtu.be/${e.youtubeID}` : (e.videoURL || ""),
                    })));
                }

                if (doc.posterURL) setPosterURL(doc.posterURL);
                if (doc.coverURL) setCoverURL(doc.coverURL);

                // Map people
                const directorIds = doc.directors || [];
                const actorObjects = doc.actors || [];
                const actorPersonIds = actorObjects.map(a => a.personId);
                const allPersonIds = [...new Set([...directorIds, ...actorPersonIds])];

                if (allPersonIds.length > 0) {
                    const peopleMap = await getPeopleByIds(allPersonIds);

                    const directorData = directorIds
                        .map(id => peopleMap[id])
                        .filter(Boolean)
                        .map(p => ({ id: crypto.randomUUID?.() || Date.now(), name: p.name || "", file: null }));
                    if (directorData.length > 0) setDirectors(directorData);

                    const actorData = actorObjects
                        .map(a => {
                            const personDetails = peopleMap[a.personId];
                            if (!personDetails) return null;
                            return {
                                id: crypto.randomUUID?.() || Date.now(),
                                name: personDetails.name || "",
                                character: a.characterName || "",
                                file: null
                            };
                        })
                        .filter(Boolean);
                    if (actorData.length > 0) setActors(actorData);
                }
            } catch (e) {
                setError(e?.message || "Failed to load title.");
            } finally {
                setLoadingInit(false);
            }
        }
        boot();
    }, [movieId]);

    const progress = useMemo(() => {
        let p = 0;
        if (title) p += 15;
        if (description) p += 10;
        if (year) p += 5;
        if (releaseDate) p += 5;
        if (genres.length) p += 10;
        if (posterFile || posterURL) p += 10;
        if (coverFile || coverURL) p += 5;
        if (contentType === "movie" && videoLink) p += 35;
        if (contentType === "series" && episodes.length) p += clamp(episodes.filter(e => e.title && e.videoLink).length * 10, 0, 35);
        return clamp(p, 0, 100);
    }, [title, description, year, releaseDate, genres, posterFile, posterURL, coverFile, coverURL, contentType, videoLink, episodes]);

    const canSubmit = useMemo(() => {
        if (!posterFile && !posterURL) return false;
        if (!title || !description || !year || !releaseDate || genres.length === 0) return false;
        if (contentType === "movie") return !!videoLink;
        return episodes.length > 0 && episodes.every(e => e.seasonNumber && e.episodeNumber && e.title && e.videoLink);
    }, [posterFile, posterURL, title, description, year, releaseDate, genres, contentType, videoLink, episodes]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError("");
        if (!posterFile && !posterURL) { setError("Please provide a poster image."); return; }

        try {
            setSubmitting(true);

            const payload = {
                title,
                description,
                year: parseInt(year),
                releaseDate: new Date(releaseDate),
                rating: 0,
                genres,
                type: contentType,
            };

            if (contentType === "movie") {
                if (videoType === "youtube") {
                    const id = getYoutubeId(videoLink);
                    if (!id) throw new Error("Invalid YouTube URL. Use a valid unlisted link.");
                    payload.youtubeID = id; payload.videoURL = null;
                } else {
                    if (!/^https?:\/\//.test(videoLink)) throw new Error("Direct video link must be a valid URL.");
                    payload.videoURL = videoLink; payload.youtubeID = null;
                }
            } else {
                const processed = episodes.map((ep) => {
                    const id = getYoutubeId(ep.videoLink);
                    if (!id) throw new Error("One or more episode links are not valid YouTube URLs.");
                    return {
                        seasonNumber: parseInt(ep.seasonNumber),
                        episodeNumber: parseInt(ep.episodeNumber),
                        title: ep.title,
                        videoType: "youtube",
                        youtubeID: id,
                        videoURL: null
                    };
                });
                payload.episodes = processed;
            }

            if (movieId) {
                const { updateMovie } = await import("../firebase");
                await updateMovie(movieId, payload, posterFile, coverFile, actors, directors, currentUser);
            } else {
                await shareNewMovie(payload, posterFile, coverFile, actors, directors, currentUser);
            }

            navigate("/dashboard?tab=manage");
        } catch (err) {
            setError(err.message || "Failed to submit. Try again.");
        } finally {
            setSubmitting(false);
        }
    }, [movieId, title, description, year, releaseDate, genres, contentType, videoType, videoLink, episodes, posterFile, coverFile, actors, directors, currentUser, navigate, posterURL]);

    return (
        <Shell>
            {/* Sticky glass header (matches Dashboard/Admin) */}
            <header className="mt-0 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-white/10">
                <Container>
                    <div className="py-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">🎬</div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                                    {movieId ? "Edit Title" : "Share Your Title"}
                                </h1>
                                <p className="text-sm text-slate-400">
                                    {movieId ? "Update your film or TV series metadata and assets." : "Submit a film or TV series with industry-standard metadata."}
                                </p>
                            </div>
                        </div>
                        <div className="w-full sm:w-72">
                            <Progress value={loadingInit ? 0 : progress} />
                            <div className="mt-1 text-right text-xs text-slate-400">
                                {loadingInit ? "Loading…" : `Completion: ${progress}%`}
                            </div>
                        </div>
                    </div>
                </Container>
            </header>

            <main className="py-8">
                <Container>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Content type + source */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle>Content Type</CardTitle>
                                    <CardDescription>Choose whether this is a movie or TV series.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                                        {(["movie","series"]).map(tab => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setContentType(tab)}
                                                className={cx(
                                                    "px-4 py-1.5 text-sm rounded-lg",
                                                    contentType === tab ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                                                )}
                                            >
                                                {tab === "movie" ? "Movie" : "TV Series"}
                                            </button>
                                        ))}
                                    </div>

                                    {contentType === "movie" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label>Video Source</Label>
                                                <select
                                                    value={videoType}
                                                    onChange={(e) => setVideoType(e.target.value)}
                                                    className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
                                                >
                                                    <option value="youtube">Unlisted YouTube</option>
                                                    <option value="direct">Direct .mp4 URL</option>
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label>{videoType === "youtube" ? "YouTube URL" : "Direct Video URL"}</Label>
                                                <Input
                                                    required
                                                    type="url"
                                                    value={videoLink}
                                                    onChange={(e) => setVideoLink(e.target.value)}
                                                    placeholder={videoType === "youtube" ? "https://youtube.com/watch?v=…" : "https://cdn.example.com/movie.mp4"}
                                                />
                                                <p className="mt-2 text-xs text-slate-500">Tip: Set YouTube visibility to <em>Unlisted</em>.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <EpisodesEditor episodes={episodes} setEpisodes={setEpisodes} />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Core metadata */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle>Title & Details</CardTitle>
                                    <CardDescription>Used across discovery and recommendations.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Title</Label>
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Dune: Part Two" required />
                                    </div>
                                    <div>
                                        <Label>Synopsis</Label>
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short, compelling synopsis" required className="min-h-[110px]" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Year</Label>
                                            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" required />
                                        </div>
                                        <div>
                                            <Label>Release Date</Label>
                                            <Input type="datetime-local" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required />
                                        </div>
                                    </div>
                                    <GenreSelector selected={genres} onChange={setGenres} />
                                </CardContent>
                            </Card>

                            {/* People */}
                            <PeopleEditor label="Directors" items={directors} onChange={setDirectors} type="director" />
                            <PeopleEditor label="Cast" items={actors} onChange={setActors} type="actor" />

                            {/* Submit */}
                            <div className="flex items-center justify-between">
                                {error ? (
                                    <div className="text-red-300 text-sm">{error}</div>
                                ) : (
                                    <div className="text-xs text-slate-500">All submissions are reviewed for quality and compliance.</div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
                                    <Button type="submit" disabled={!canSubmit || submitting} className="min-w-32">
                                        {submitting ? (movieId ? "Saving…" : "Submitting…") : (movieId ? "Save Changes" : "Share")}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Poster Image</CardTitle>
                                    <CardDescription>Required. Vertical, 2:3 ratio recommended.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ImageUploader file={posterFile} onChange={setPosterFile} />
                                    {posterURL && !posterFile && (
                                        <div className="mt-4">
                                            <div className="text-xs text-slate-400 mb-1.5">Current Poster</div>
                                            <img src={posterURL} alt="Current poster" className="h-40 w-28 rounded-lg object-cover border border-white/10" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Cover Image</CardTitle>
                                    <CardDescription>Optional. Horizontal, 16:9 ratio recommended.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ImageUploader
                                        file={coverFile}
                                        onChange={setCoverFile}
                                        title="Cover Image"
                                        altText="Cover preview"
                                        previewClassName="w-32 aspect-video"
                                    />
                                    {coverURL && !coverFile && (
                                        <div className="mt-4">
                                            <div className="text-xs text-slate-400 mb-1.5">Current Cover</div>
                                            <img src={coverURL} alt="Current cover" className="w-full aspect-video rounded-lg object-cover border border-white/10" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="sticky top-24">
                                <CardHeader className="pb-2">
                                    <CardTitle>{movieId ? "Edit Summary" : "Submission Summary"}</CardTitle>
                                    <CardDescription>Quick review</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span className="text-slate-400">Mode</span><span className="font-medium">{movieId ? "Edit" : "Create"}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Type</span><span className="font-medium">{contentType === "movie" ? "Movie" : "TV Series"}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Title</span><span className="font-medium truncate max-w-[160px]" title={title}>{title || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Year</span><span className="font-medium">{year || "—"}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-400">Release Date</span><span className="font-medium">{releaseDate ? new Date(releaseDate).toLocaleString() : "—"}</span></div>
                                    <div>
                                        <div className="text-slate-400">Genres</div>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {genres.length ? genres.map(g => <Badge key={g}>{g}</Badge>) : <span className="text-slate-500">—</span>}
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10 my-2" />
                                    <div className="text-xs text-slate-500">Tip: Keep synopses under 600 characters for best in-app display.</div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </Container>
            </main>
        </Shell>
    );
}