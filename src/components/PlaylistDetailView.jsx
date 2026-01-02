import React from 'react';
import { ChevronDown, Music, Play, ExternalLink, Trash2, Plus } from 'lucide-react';

const PlaylistDetailView = ({ playlist, items, onBack, onPlaySong, onRemoveSong, onAddSong }) => {
    // Spotify-style cover mashup
    const covers = items.slice(0, 4).map(item => item.album_art_url).filter(Boolean);

    return (
        <div className="animate-in slide-in-from-right duration-300 min-h-screen bg-[#14181c] relative z-50 pb-20">
            {/* Header / Hero */}
            <div className="relative w-full h-80 overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110"
                    style={{ backgroundImage: `url(${items[0]?.album_art_url || ''})` }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#14181c] via-[#14181c]/60 to-transparent"></div>

                <button onClick={onBack} className="absolute top-12 left-6 z-20 p-2 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full text-white transition border border-white/10">
                    <ChevronDown className="rotate-90" size={24} />
                </button>

                <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col sm:flex-row items-center sm:items-end gap-6 max-w-2xl mx-auto z-10">
                    <div className="shrink-0 w-48 h-48 rounded-lg shadow-2xl overflow-hidden bg-gray-800 grid grid-cols-2 grid-rows-2 gap-0.5 border border-white/10">
                        {covers.length > 0 ? (
                            [0, 1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-700">
                                    {covers[i] && <img src={covers[i]} className="w-full h-full object-cover" />}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 row-span-2 flex items-center justify-center bg-lime-400">
                                <Music size={64} className="text-charcoal" />
                            </div>
                        )}
                    </div>
                    <div className="mb-2 text-center sm:text-left flex-1 relative">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-lime-400 mb-2 block">Playlist</span>
                        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tighter">{playlist.title}</h1>
                        <p className="text-gray-400 mt-2 font-medium">{items.length} songs • Created by you</p>
                    </div>
                    <button onClick={onAddSong} className="mb-2 p-4 bg-lime-400 rounded-full text-charcoal shadow-lg hover:bg-lime-500 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Song List */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="space-y-1">
                    {items.length > 0 ? items.map((song, index) => (
                        <div key={song.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 group transition border border-transparent hover:border-white/5">
                            <div className="w-6 text-center text-gray-500 font-bold text-sm group-hover:hidden">{index + 1}</div>
                            <div className="w-6 hidden group-hover:flex items-center justify-center text-lime-400 cursor-pointer" onClick={() => onPlaySong(song)}>
                                <Play size={16} fill="currentColor" />
                            </div>

                            <img src={song.album_art_url} className="w-12 h-12 rounded-md shadow-lg" />

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate text-sm">{song.song_name}</h4>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{song.artist_name}</p>
                            </div>

                            <button onClick={() => onRemoveSong(song.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Music size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-400">Your playlist is empty</h3>
                            <p className="text-gray-500 text-sm mt-1">Add some songs to get started!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistDetailView;
