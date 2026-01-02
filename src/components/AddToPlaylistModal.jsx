import React from 'react';
import { X, Plus, Music } from 'lucide-react';

const AddToPlaylistModal = ({ isOpen, onClose, song, playlists, onAddToPlaylist }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl flex flex-col border border-white/10 overflow-hidden shadow-2xl max-h-[70vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#202020]">
                    <h2 className="font-bold text-white">Add to Playlist</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
                </div>

                <div className="p-4 border-b border-white/10 bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <img src={song?.album_art_url} className="w-12 h-12 rounded-md object-cover shadow-lg" />
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-white truncate">{song?.song_name}</div>
                            <div className="text-xs text-gray-400 truncate">{song?.artist_name}</div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {playlists.length > 0 ? playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            onClick={() => { onAddToPlaylist(playlist.id, song); onClose(); }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition border border-transparent hover:border-white/10 group"
                        >
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-lime-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-md transition group-hover:scale-105">
                                <Music size={18} className="text-charcoal" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-white truncate group-hover:text-lime-400 transition">{playlist.title}</div>
                                <div className="text-xs text-gray-500 truncate">{playlist.description || 'Custom playlist'}</div>
                            </div>
                            <Plus size={16} className="text-gray-600 group-hover:text-lime-400 transition" />
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-500">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Music size={32} className="text-gray-700" />
                            </div>
                            <p className="font-medium mb-3">No playlists yet</p>
                            <button onClick={onClose} className="bg-lime-400 text-charcoal px-4 py-2 rounded-lg font-bold text-xs hover:bg-lime-500 transition">Create your first playlist</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
