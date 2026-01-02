import React from 'react';
import { X, Plus, Music } from 'lucide-react';

const AddToPlaylistModal = ({ isOpen, onClose, song, playlists, onAddToPlaylist, onCreatePlaylist }) => {
    const [isCreating, setIsCreating] = React.useState(false);
    const [newTitle, setNewTitle] = React.useState('');

    if (!isOpen) return null;

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        await onCreatePlaylist(newTitle);
        setNewTitle('');
        setIsCreating(false);
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl flex flex-col border border-white/10 overflow-hidden shadow-2xl max-h-[80vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#202020]">
                    <h2 className="font-bold text-white uppercase tracking-widest text-[10px]">Add to Playlist</h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition text-gray-500"><X size={20} /></button>
                </div>

                {song && (
                    <div className="p-4 border-b border-white/10 bg-[#161616]">
                        <div className="flex items-center gap-3">
                            <img src={song?.album_art_url} className="w-12 h-12 rounded-lg object-cover shadow-lg" />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-white truncate">{song?.song_name}</div>
                                <div className="text-[10px] text-gray-500 uppercase font-black truncate">{song?.artist_name}</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {/* Create New Playlist Action */}
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-lime-400/5 border border-lime-400/20 hover:bg-lime-400/10 transition group mb-4"
                        >
                            <div className="w-10 h-10 rounded-lg bg-lime-400 flex items-center justify-center shrink-0">
                                <Plus size={20} className="text-charcoal" />
                            </div>
                            <span className="font-bold text-sm text-lime-400 uppercase tracking-widest">Create New Playlist</span>
                        </button>
                    ) : (
                        <form onSubmit={handleCreate} className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10 animate-in slide-in-from-top-2">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Playlist name..."
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-lime-400 transition mb-2"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-lime-400 text-charcoal font-black py-2 rounded-lg text-[10px] uppercase tracking-widest">Create</button>
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 bg-white/5 text-gray-400 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancel</button>
                            </div>
                        </form>
                    )}

                    {playlists.length > 0 ? playlists.map(playlist => (
                        <div
                            key={playlist.id}
                            onClick={() => { onAddToPlaylist(playlist.id, song); onClose(); }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition border border-transparent hover:border-white/10 group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-[#252525] border border-white/5 flex items-center justify-center shrink-0 shadow-md transition group-hover:scale-105 group-hover:border-lime-400/30">
                                <Music size={18} className="text-gray-500 group-hover:text-lime-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-white truncate group-hover:text-lime-400 transition">{playlist.title}</div>
                                <div className="text-[10px] text-gray-500 uppercase font-black truncate">{playlist.description || 'Custom collection'}</div>
                            </div>
                            <Plus size={16} className="text-gray-700 group-hover:text-lime-400 transition" />
                        </div>
                    )) : !isCreating && (
                        <div className="text-center py-12 text-gray-600">
                            <p className="text-sm font-black uppercase tracking-widest opacity-50">Build your first collection</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
