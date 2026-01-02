import React, { useState, useEffect } from 'react';
import { Search, Music, User, ArrowLeft, Loader2, PlayCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

const GlobalSearchView = ({ onBack, onSelectSong, onSelectProfile }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ songs: [], people: [] });
    const [searching, setSearching] = useState(false);
    const [tab, setTab] = useState('ALL'); // ALL, SONGS, PEOPLE

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                performSearch();
            } else {
                setResults({ songs: [], people: [] });
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async () => {
        setSearching(true);
        try {
            // 1. Search Songs (iTunes)
            const songRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15&country=us`);
            const songData = await songRes.json();
            const songs = (songData.results || []).map(t => ({
                id: t.trackId,
                song_name: t.trackName,
                artist_name: t.artistName,
                album_art_url: t.artworkUrl100.replace('100x100', '600x600'),
                preview_url: t.previewUrl,
                type: 'SONG'
            }));

            // 2. Search People (from posts/comments uniquely)
            // In a real app, you'd have a profiles table. For now, we'll query unique usernames from posts.
            let people = [];
            if (supabase) {
                const { data } = await supabase
                    .from('posts')
                    .select('user_id, user_name')
                    .ilike('user_name', `%${query}%`);

                if (data) {
                    // Unique people
                    const uniquePeople = {};
                    data.forEach(p => {
                        if (!uniquePeople[p.user_id]) {
                            uniquePeople[p.user_id] = {
                                id: p.user_id,
                                user_name: p.user_name,
                                type: 'PERSON'
                            };
                        }
                    });
                    people = Object.values(uniquePeople);
                }
            }

            setResults({ songs, people });
        } catch (e) {
            console.error("Search error:", e);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-300 min-h-screen bg-[#14181c] pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#14181c]/95 backdrop-blur-md border-b border-white/5 p-4 flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Songs, artists, or people..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-2xl mx-auto px-4 mt-4 flex gap-2">
                {['ALL', 'SONGS', 'PEOPLE'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition ${tab === t ? 'bg-lime-400 text-charcoal' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
                {searching ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-lime-400" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Songs Section */}
                        {(tab === 'ALL' || tab === 'SONGS') && results.songs.length > 0 && (
                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 px-2">Songs</h3>
                                <div className="space-y-2">
                                    {results.songs.map(song => (
                                        <div
                                            key={song.id}
                                            onClick={() => onSelectSong(song)}
                                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer group transition border border-transparent hover:border-white/5"
                                        >
                                            <div className="relative w-14 h-14 shrink-0">
                                                <img src={song.album_art_url} className="w-full h-full rounded-xl shadow-lg object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                                                    <PlayCircle size={24} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white truncate group-hover:text-lime-400 transition">{song.song_name}</h4>
                                                <p className="text-sm text-gray-500 truncate">{song.artist_name}</p>
                                            </div>
                                            <Music size={18} className="text-gray-700 group-hover:text-lime-400 transition" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* People Section */}
                        {(tab === 'ALL' || tab === 'PEOPLE') && results.people.length > 0 && (
                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 px-2">People</h3>
                                <div className="space-y-2">
                                    {results.people.map(person => (
                                        <div
                                            key={person.id}
                                            onClick={() => onSelectProfile(person)}
                                            className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer group transition border border-transparent hover:border-white/5"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 flex items-center justify-center text-xl font-black text-charcoal shadow-lg shrink-0">
                                                {person.user_name?.[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-white group-hover:text-lime-400 transition">{person.user_name}</h4>
                                                <p className="text-xs text-gray-500">View Profile</p>
                                            </div>
                                            <User size={18} className="text-gray-700 group-hover:text-lime-400 transition" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {query.length >= 2 && results.songs.length === 0 && results.people.length === 0 && (
                            <div className="text-center py-20">
                                <Search size={48} className="text-gray-800 mx-auto mb-4" />
                                <h3 className="text-gray-500 font-medium">No results found for "{query}"</h3>
                                <p className="text-gray-600 text-sm mt-1">Try searching for something else.</p>
                            </div>
                        )}

                        {query.length < 2 && (
                            <div className="text-center py-20">
                                <Search size={48} className="text-gray-800 mx-auto mb-4" />
                                <h3 className="text-gray-500 font-medium">Search grapevine</h3>
                                <p className="text-gray-600 text-sm mt-1">Find your favorite songs or fellow curators.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GlobalSearchView;
