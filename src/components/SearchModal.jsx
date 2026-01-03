import React, { useState, useEffect } from 'react';
import { Search, X, Star, Music, ExternalLink, Loader2 } from 'lucide-react';

const SearchModal = ({ isOpen, onClose, onSubmitReview, mode = 'REVIEW', preSelectedSong = null }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [soundcloudUrlFromSearch, setSoundcloudUrlFromSearch] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (preSelectedSong) {
                setSelected({
                    title: preSelectedSong.song_name || preSelectedSong.title,
                    artist: preSelectedSong.artist_name || preSelectedSong.artist,
                    albumCover: preSelectedSong.album_art_url || preSelectedSong.albumCover,
                    previewUrl: preSelectedSong.preview_url || preSelectedSong.previewUrl,
                    soundcloudUrl: preSelectedSong.soundcloud_url || preSelectedSong.soundcloudUrl
                });
                setRating(preSelectedSong.rating || 0);
                setComment(preSelectedSong.caption || '');
                setSoundcloudUrlFromSearch(preSelectedSong.soundcloud_url || null);
            } else { 
                setSelected(null); 
                setRating(0); 
                setComment(''); 
                setQuery(''); 
                setResults([]);
                setSoundcloudUrlFromSearch(null);
            }
        }
    }, [isOpen, preSelectedSong]);

    const handleSearch = async (e) => {
        const val = e.target.value;
        console.log('handleSearch called with value:', val);
        setQuery(val);
        if (val.length < 2) return;

        // Store SoundCloud URL immediately
        const isSoundCloudLink = val.includes('soundcloud.com/') || val.includes('on.soundcloud.com/');
        console.log('Is SoundCloud link?', isSoundCloudLink);
        if (isSoundCloudLink) {
            setSoundcloudUrlFromSearch(val);
            console.log('SoundCloud URL detected and stored:', val);
        } else {
            setSoundcloudUrlFromSearch(null);
        }

        setSearching(true);
        try {
            const isLocal = window.location.hostname === 'localhost';

            // If it's a SoundCloud link, we MUST use the API to avoid CORS
            const url = (isLocal && !isSoundCloudLink)
                ? `https://itunes.apple.com/search?term=${encodeURIComponent(val)}&media=music&entity=song&limit=10`
                : `/api/search?q=${encodeURIComponent(val)}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error(`API failed: ${res.status}`);
            const data = await res.json();

            if (data.results) {
                const mappedResults = data.results.map(t => ({
                    id: t.trackId,
                    title: t.trackName,
                    artist: t.artistName,
                    albumCover: t.soundcloud_data
                        ? (t.artworkUrl100 || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop')
                        : (t.artworkUrl100 || '').replace('100x100', '600x600'),
                    previewUrl: t.previewUrl,
                    soundcloudUrl: t.soundcloudUrl,
                    isSoundCloud: !!t.soundcloud_data
                }));
                console.log('Search results from API:', data.results);
                console.log('Mapped search results:', mappedResults);
                setResults(mappedResults);
            }
        } catch (err) {
            console.error("Search Error:", err);
        } finally { setSearching(false); }
    };

    const handleSelect = (s) => {
        console.log('Song selected:', s);
        setSelected(s);
    };
    const handleSubmit = () => {
        console.log('Selected song:', selected);
        console.log('SoundCloud URL from search:', soundcloudUrlFromSearch);
        if (mode === 'TOP_4' || mode === 'PLAYLIST_ADD') { onSubmitReview(selected); }
        else {
            const reviewData = {
                id: preSelectedSong?.id,
                song_name: selected.title,
                artist_name: selected.artist,
                album_art_url: selected.albumCover,
                preview_url: selected.previewUrl,
                soundcloud_url: soundcloudUrlFromSearch || selected.soundcloudUrl, // Use stored URL first
                rating,
                caption: comment
            };
            console.log('Submitting review:', reviewData);
            onSubmitReview(reviewData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in transition-all">
            <div className="bg-[#1a1a1a] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                            {mode === 'REVIEW' ? 'Review' : mode === 'TOP_4' ? 'Set Obsession' : 'Add to Playlist'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24} /></button>
                    </div>
                    {!selected ? (
                        <div className="space-y-4">
                            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} /><input type="text" autoFocus value={query} onChange={handleSearch} onPaste={(e) => { console.log('Pasted text:', e.clipboardData.getData('text')); }} placeholder="Search for a song..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition" /></div>
                            <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                                {searching ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-lime-400" size={32} /></div> : results.map(s => (<div key={s.id} onClick={() => handleSelect(s)} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition group border border-transparent hover:border-white/5"><img src={s.albumCover} className="w-14 h-14 rounded-xl shadow-lg" /><div className="flex-1 min-w-0"><h3 className="font-bold text-white truncate group-hover:text-lime-400 transition">{s.title}</h3><p className="text-sm text-gray-500 truncate">{s.artist}</p></div><Music size={18} className="text-gray-700 group-hover:text-lime-400" /></div>))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-4 bg-[#202020] p-4 rounded-2xl border border-white/5">
                                <img src={selected.albumCover} className="w-24 h-24 rounded-xl shadow-xl" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-xl text-white truncate">{selected.title}</h3>
                                    <p className="text-lime-400 font-bold">{selected.artist}</p>
                                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1"><ExternalLink size={12} /><span>{selected.isSoundCloud ? 'SoundCloud' : 'iTunes Store'}</span></div>
                                </div>
                            </div>
                            {mode === 'REVIEW' && (
                                <div className="space-y-6">
                                    <div className="flex justify-center gap-1">
                                        {[1, 2, 3, 4, 5].map(n => {
                                            const isFull = n <= rating;
                                            const isHalf = n - 0.5 === rating;
                                            return (
                                                <div key={n} className="relative group/star cursor-pointer transition-all hover:scale-110 active:scale-95">
                                                    {/* The Star Icon background */}
                                                    <Star
                                                        size={40}
                                                        className={`${isFull || isHalf ? 'text-lime-400' : 'text-gray-800'} ${isFull ? 'fill-lime-400' : ''}`}
                                                    />

                                                    {/* Half Star Overlay for display */}
                                                    {isHalf && (
                                                        <div className="absolute inset-0 overflow-hidden w-[50%]">
                                                            <Star size={40} className="text-lime-400 fill-lime-400" />
                                                        </div>
                                                    )}

                                                    {/* Click areas for half and full */}
                                                    <div className="absolute inset-0 flex">
                                                        <div
                                                            className="h-full w-1/2"
                                                            onClick={() => setRating(n - 0.5)}
                                                            onMouseEnter={() => !rating && setRating(n - 0.5)} // Pre-view effect optional
                                                        />
                                                        <div
                                                            className="h-full w-1/2"
                                                            onClick={() => setRating(n)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <textarea className="w-full h-32 bg-[#121212] p-4 rounded-2xl border border-white/10 text-white placeholder-gray-700 focus:outline-none focus:border-lime-400/50 transition resize-none font-medium" placeholder="What's the vibe? Tell them how it makes you feel..." value={comment} onChange={e => setComment(e.target.value)} />
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => setSelected(null)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition">Change</button>
                                <button onClick={handleSubmit} disabled={mode === 'REVIEW' && rating === 0} className="flex-[2] py-4 bg-lime-400 text-charcoal font-black rounded-2xl hover:bg-lime-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 uppercase tracking-widest">
                                    {mode === 'TOP_4' ? 'Update Top 4' : mode === 'PLAYLIST_ADD' ? 'Add Song' : 'Post Review'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
