// src/components/ManageMoviesTab.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit3, Eye, Plus, Search, Trash2 } from "lucide-react";
import { deleteMovie } from "../firebase";

export default function ManageMoviesTab({ movies = [], refetchMovies }) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(new Set());

    const filtered = useMemo(() => movies.filter(row => {
        const q = query.trim().toLowerCase();
        return !q || [row.title, row.genres?.join(' '), String(row.year)].some(v => String(v).toLowerCase().includes(q));
    }), [movies, query]);

    const toggleSelect = (id) => setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const allSelected = filtered.length > 0 && filtered.every(row => selected.has(row.id));

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map(r => r.id)));
        }
    };

    const handleDeleteSelected = async () => {
        if (window.confirm(`Are you sure you want to delete ${selected.size} movie(s)? This action cannot be undone.`)) {
            await Promise.all(Array.from(selected).map(id => deleteMovie(id)));
            setSelected(new Set());
            await refetchMovies();
        }
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-100">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 justify-between">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search title, genre, year…"
                        className="w-full md:w-72 rounded-xl bg-white/5 border border-white/10 pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {selected.size > 0 && (
                        <button onClick={handleDeleteSelected} className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 px-3 py-2 text-sm flex items-center gap-2">
                            <Trash2 className="size-4" /> Delete ({selected.size})
                        </button>
                    )}
                    <Link
                        to="/share"
                        className="rounded-xl bg-indigo-500/90 hover:bg-indigo-500 transition px-4 py-2 text-sm font-medium flex items-center gap-2"
                    >
                        <Plus className="size-4" /> New Movie
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                <table className="min-w-full text-sm">
                    <thead className="bg-white/5">
                    <tr className="text-left">
                        <th className="px-4 py-3 w-10">
                            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-indigo-500"/>
                        </th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Year</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {filtered.map(row => (
                        <tr key={row.id} className="hover:bg-white/5">
                            <td className="px-4 py-3">
                                <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} className="accent-indigo-500" />
                            </td>
                            <td className="px-4 py-3 font-medium flex items-center gap-3">
                                <img src={row.posterURL} alt={row.title} className="size-10 rounded-md object-cover bg-white/10" />
                                <div>
                                    <div className="truncate max-w-[22ch]">{row.title}</div>
                                    <div className="text-xs text-slate-400">ID: {row.id.slice(0, 6)}...</div>
                                </div>
                            </td>
                            <td className="px-4 py-3">{row.year}</td>
                            <td className="px-4 py-3">{row.rating}</td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Link to={`/watch/${row.id}`} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"><Eye className="size-4"/></Link>
                                    <Link to={`/share/${row.id}`} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5"><Edit3 className="size-4"/></Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td className="px-4 py-10 text-center text-slate-400" colSpan={7}>
                                {movies.length === 0 ? "You haven't shared any movies yet." : "No movies match your search."}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (placeholder) */}
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <div>Showing <span className="text-slate-200">{filtered.length}</span> of {movies.length}</div>
                {/* Add actual pagination logic here if needed */}
            </div>
        </div>
    );
}