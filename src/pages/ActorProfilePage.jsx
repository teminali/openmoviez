// src/pages/ActorProfilePage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPersonById, getMoviesByPersonId } from '../firebase';
import { Calendar, MapPin, User } from 'lucide-react';
import MovieCard from '../components/MovieCard'; // Re-use your existing movie card

const cx = (...c) => c.filter(Boolean).join(" ");

const Shell = ({ children }) => (
    <div className="min-h-screen text-slate-100 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">{children}</div>
);
const Container = ({ children, className = "" }) => (
    <div className={cx("mx-auto max-w-6xl px-4 md:px-6", className)}>{children}</div>
);

const SkeletonProfile = () => (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <div className="md:col-span-1 lg:col-span-1">
            <div className="aspect-[3/4] rounded-2xl bg-white/10"></div>
            <div className="mt-4 space-y-3">
                <div className="h-4 w-3/4 rounded bg-white/10"></div>
                <div className="h-4 w-1/2 rounded bg-white/10"></div>
            </div>
        </div>
        <div className="md:col-span-2 lg:col-span-3 space-y-6">
            <div className="h-8 w-1/3 rounded bg-white/10"></div>
            <div className="space-y-2">
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-4 w-full rounded bg-white/10"></div>
                <div className="h-4 w-5/6 rounded bg-white/10"></div>
            </div>
            <div className="h-6 w-1/4 rounded bg-white/10 mt-8"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                        <div className="aspect-[11/16] rounded-xl bg-white/5 border border-white/10" />
                        <div className="h-3 w-3/4 mt-2 rounded bg-white/10" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);


export default function ActorProfilePage() {
    const { personId } = useParams();
    const [person, setPerson] = useState(null);
    const [filmography, setFilmography] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!personId) {
            setError('No actor ID provided.');
            setIsLoading(false);
            return;
        }

        const fetchActorData = async () => {
            setIsLoading(true);
            try {
                const [personData, moviesData] = await Promise.all([
                    getPersonById(personId),
                    getMoviesByPersonId(personId)
                ]);

                if (!personData) {
                    setError('Actor not found.');
                    setPerson(null);
                } else {
                    setPerson(personData);
                }
                setFilmography(moviesData);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch actor details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchActorData();
    }, [personId]);

    const filteredFilmography = useMemo(() => {
        if (activeTab === 'movie') {
            return filmography.filter(m => m.type !== 'series');
        }
        if (activeTab === 'series') {
            return filmography.filter(m => m.type === 'series');
        }
        return filmography;
    }, [filmography, activeTab]);

    const birthDate = person?.birthDate ? new Date(person.birthDate.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : null;

    return (
        <Shell>
            <main className="py-12">
                <Container>
                    {isLoading ? (
                        <SkeletonProfile />
                    ) : error ? (
                        <div className="text-center text-red-300">{error}</div>
                    ) : person && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {/* Left Column: Actor Info */}
                            <aside className="md:col-span-1 lg:col-span-1">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 grid place-items-center">
                                    {person.profilePicURL ? (
                                        <img src={person.profilePicURL} alt={person.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="size-24 text-slate-500" />
                                    )}
                                </div>
                                <div className="mt-6 border-t border-white/10 pt-6">
                                    <h3 className="text-lg font-semibold mb-3">Personal Info</h3>
                                    <ul className="space-y-3 text-sm text-slate-300">
                                        {birthDate && (
                                            <li className="flex items-center gap-2">
                                                <Calendar className="size-4 text-slate-500" />
                                                <div>
                                                    <p className="font-medium text-slate-200">Birthday</p>
                                                    <p>{birthDate}</p>
                                                </div>
                                            </li>
                                        )}
                                        {person.birthPlace && (
                                            <li className="flex items-center gap-2">
                                                <MapPin className="size-4 text-slate-500" />
                                                <div>
                                                    <p className="font-medium text-slate-200">Place of Birth</p>
                                                    <p>{person.birthPlace}</p>
                                                </div>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </aside>

                            {/* Right Column: Bio & Filmography */}
                            <div className="md:col-span-2 lg:col-span-3">
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{person.name}</h1>
                                {person.bio && (
                                    <div className="mt-6">
                                        <h2 className="text-xl font-semibold mb-2">Biography</h2>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{person.bio}</p>
                                    </div>
                                )}
                                <div className="mt-10">
                                    <h2 className="text-xl font-semibold mb-4">Known For</h2>
                                    <div className="border-b border-white/10 mb-6">
                                        <nav className="flex gap-4">
                                            <button onClick={() => setActiveTab('all')} className={cx("py-2 px-1 text-sm font-medium", activeTab === 'all' ? 'text-indigo-300 border-b-2 border-indigo-300' : 'text-slate-400 hover:text-white')}>All</button>
                                            <button onClick={() => setActiveTab('movie')} className={cx("py-2 px-1 text-sm font-medium", activeTab === 'movie' ? 'text-indigo-300 border-b-2 border-indigo-300' : 'text-slate-400 hover:text-white')}>Movies</button>
                                            <button onClick={() => setActiveTab('series')} className={cx("py-2 px-1 text-sm font-medium", activeTab === 'series' ? 'text-indigo-300 border-b-2 border-indigo-300' : 'text-slate-400 hover:text-white')}>TV Series</button>
                                        </nav>
                                    </div>

                                    {filteredFilmography.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {filteredFilmography.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400">No {activeTab}s found for this person.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Container>
            </main>
        </Shell>
    );
}