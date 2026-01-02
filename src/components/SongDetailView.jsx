import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, PlayCircle, Star, Plus, Headphones, Music } from 'lucide-react';
import CommentSection from './CommentSection';

const SongDetailView = ({ post, onBack, allPosts, currentUser, onRate, onAddToPlaylist }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(post.preview_url);
    const [extraInfo, setExtraInfo] = useState({
        year: '----',
        genre: 'Music',
        duration: '--:--',
        album: 'their latest project',
        appleMusicUrl: null,
        spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(post.artist_name + ' ' + post.song_name)}`
    });

    useEffect(() => {
        const fetchExtra = async () => {
            const query = encodeURIComponent(`${post.artist_name} ${post.song_name}`);
            const isLocal = window.location.hostname === 'localhost';
            const url = isLocal
                ? `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`
                : `/api/search?q=${query}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.results?.[0]) {
                const track = data.results[0];
                if (track.previewUrl && !previewUrl) setPreviewUrl(track.previewUrl);

                const minutes = Math.floor(track.trackTimeMillis / 60000);
                const seconds = ((track.trackTimeMillis % 60000) / 1000).toFixed(0);

                setExtraInfo(prev => ({
                    ...prev,
                    year: track.releaseDate ? new Date(track.releaseDate).getFullYear() : '----',
                    genre: track.primaryGenreName || 'Music',
                    duration: `${minutes}:${seconds.padStart(2, '0')}`,
                    album: track.collectionName || 'their latest project',
                    appleMusicUrl: track.trackViewUrl
                }));
            }
        };
        fetchExtra();
    }, [post]);

    useEffect(() => {
        if (previewUrl) {
            audioRef.current = new Audio(previewUrl);
            audioRef.current.onended = () => setIsPlaying(false);
        }
        return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
    }, [previewUrl]);

    const togglePlay = () => {
        if (!previewUrl || !audioRef.current) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play().catch(() => { });
        setIsPlaying(!isPlaying);
    };

    const songReviews = allPosts.filter(p => p.song_name === post.song_name && p.artist_name === post.artist_name);
    const averageRating = songReviews.length > 0
        ? (songReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / songReviews.length).toFixed(1)
        : '0.0';

    // Calculate rating distribution (1-5 stars)
    const distribution = [0, 0, 0, 0, 0];
    songReviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
    });
    const maxDist = Math.max(...distribution, 1);

    const userReview = currentUser ? songReviews.find(r => r.user_id === currentUser.id) : null;
    const hasLogged = !!userReview;

    return (
        <div className="animate-in fade-in slide-in-from-right-12 duration-500 min-h-screen bg-[#14181c] relative z-50 pb-32 overflow-x-hidden">
            {/* Cinematic Backdrop */}
            <div className="relative w-full min-h-[70vh] md:h-[60vh] overflow-hidden flex flex-col">
                <div className="absolute inset-0 z-0">
                    <img src={post.album_art_url} className="w-full h-full object-cover blur-md opacity-40 scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#14181c]/80 to-[#14181c]"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto w-full h-full px-6 flex flex-col pt-24 pb-12 flex-1 justify-center md:justify-end">
                    <button onClick={() => { if (audioRef.current) audioRef.current.pause(); onBack(); }} className="absolute top-6 left-6 z-20 p-2 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-full text-white transition border border-white/10"><ChevronDown className="rotate-90" size={24} /></button>

                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-end w-full">
                        {/* Poster Card */}
                        <div className="w-56 aspect-[2/3] md:w-48 bg-[#202020] rounded-lg shadow-2xl overflow-hidden border border-white/10 shrink-0 transform md:rotate-2 hover:rotate-0 transition duration-500 group relative">
                            <img src={post.album_art_url} className="w-full h-full object-cover" />
                            <div onClick={togglePlay} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                                {isPlaying ? <Headphones className="text-lime-400 animate-pulse" size={48} /> : <PlayCircle className="text-white" size={48} />}
                            </div>
                            {/* Mobile Play Indicator */}
                            <div className="absolute inset-0 flex items-center justify-center md:hidden pointer-events-none">
                                {isPlaying ? <Headphones className="text-lime-400 animate-pulse" size={40} /> : <PlayCircle className="text-white/60" size={40} />}
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter mb-4">{post.song_name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm">
                                <span>{extraInfo.year}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span className="text-white">{post.artist_name}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span>{extraInfo.duration}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 mt-8">
                {/* Left Column: Stats & Reviews */}
                <div className="md:col-span-2 space-y-12">
                    {/* Logged Status Bar */}
                    {hasLogged && (
                        <div className="bg-[#202830] border border-lime-400/20 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-left duration-700">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 flex items-center justify-center text-charcoal font-black text-xs">
                                {currentUser.user_metadata?.full_name?.[0]}
                            </div>
                            <span className="text-sm font-bold text-gray-300">You've logged this song</span>
                            <div className="ml-auto text-lime-400 flex gap-0.5">
                                {[...Array(5)].map((_, i) => {
                                    const rating = songReviews.find(r => r.user_id === currentUser.id)?.rating || 0;
                                    const starValue = i + 1;
                                    const isFull = starValue <= rating;
                                    const isHalf = !isFull && starValue - 0.5 === rating;
                                    return (
                                        <div key={i} className="relative">
                                            <Star size={12} className={`${isFull || isHalf ? 'text-lime-400' : 'text-gray-700'} ${isFull ? 'fill-lime-400' : ''}`} />
                                            {isHalf && (
                                                <div className="absolute inset-0 overflow-hidden w-[50%]">
                                                    <Star size={12} className="text-lime-400 fill-lime-400" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Description */}
                    <div className="text-gray-400 leading-relaxed italic text-lg line-clamp-4">
                        '{post.song_name}' is a standout {extraInfo.genre.toLowerCase()} track by {post.artist_name},
                        featured on the project <span className="text-white">"{extraInfo.album}"</span>.
                        Released in {extraInfo.year}, the song spans {extraInfo.duration} and has been
                        sparking conversation across the Grapevine community with {songReviews.length} curated reviews.
                    </div>

                    {/* Ratings Section */}
                    <section className="border-t border-white/5 pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Ratings</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-white">{averageRating}</span>
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < Math.round(averageRating) ? 'text-lime-400 fill-lime-400' : 'text-gray-800'} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Histogram */}
                        <div className="flex items-end gap-1 h-24 mb-2">
                            {distribution.map((count, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-[#2c3440] hover:bg-lime-400 transition-colors rounded-t-sm relative group cursor-help"
                                    style={{ height: `${(count / maxDist) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-charcoal text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-bold">
                                        {count} reviews
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-gray-600 tracking-widest px-1">
                            <span>1 STAR</span>
                            <span>5 STARS</span>
                        </div>

                        {/* Concise Music Links */}
                        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Listen on Services</span>
                            <div className="flex gap-3">
                                {extraInfo.appleMusicUrl && (
                                    <a
                                        href={`${extraInfo.appleMusicUrl}&app=music`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex items-center justify-center gap-3 transition group active:scale-95"
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Apple_Music_logo.svg" alt="Apple Music" className="w-5 h-5 invert" />
                                        <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-lime-400">Apple Music</span>
                                    </a>
                                )}
                                <a
                                    href={window.innerWidth < 768 ? `spotify:search:${encodeURIComponent(post.artist_name + ' ' + post.song_name)}` : extraInfo.spotifyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/20 rounded-xl p-4 flex items-center justify-center gap-3 transition group active:scale-95"
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1DB954]" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.49 17.3c-.21.346-.66.452-1.006.242-2.73-1.668-6.17-2.047-10.218-1.122-.396.09-.796-.165-.887-.56-.09-.396.165-.797.56-.888 4.437-1.015 8.237-.585 11.29 1.282.35.213.457.66.247 1.006zm1.465-3.264c-.266.432-.825.572-1.257.306-3.13-1.92-7.9-2.476-11.603-1.353-.487.147-1.005-.13-1.152-.616-.148-.487.13-1.005.617-1.152 4.25-1.29 9.516-.673 13.088 1.52.433.266.574.825.308 1.257zm.126-3.41c-3.754-2.23-9.962-2.435-13.56-.75-.576.176-1.19-.153-1.366-.73-.176-.577.152-1.192.73-1.368 4.14-1.258 11.01-1.015 15.337 1.55.518.307.688.976.38 1.493-.306.52-.975.69-1.49.382z" />
                                    </svg>
                                    <span className="text-xs font-black uppercase tracking-widest text-white group-hover:text-[#1DB954]">Spotify</span>
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Reviews Feed */}
                    <section className="space-y-6">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 pb-2 border-b border-white/5">Reviews from friends</h2>
                        {songReviews.length > 0 ? (
                            <div className="space-y-6">
                                {songReviews.map(r => (
                                    <div key={r.id} className="border-b border-white/5 pb-8">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 flex items-center justify-center text-charcoal font-black">
                                                {r.user_name?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white uppercase text-xs tracking-widest">{r.user_name}</span>
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => {
                                                            const starValue = i + 1;
                                                            const isFull = starValue <= r.rating;
                                                            const isHalf = !isFull && starValue - 0.5 === r.rating;
                                                            return (
                                                                <div key={i} className="relative">
                                                                    <Star size={8} className={`${isFull || isHalf ? 'text-lime-400' : 'text-gray-800'} ${isFull ? 'fill-lime-400' : ''}`} />
                                                                    {isHalf && (
                                                                        <div className="absolute inset-0 overflow-hidden w-[50%]">
                                                                            <Star size={8} className="text-lime-400 fill-lime-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Logged Recently</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed mb-4">{r.caption}</p>
                                        <CommentSection postId={r.id} currentUser={currentUser} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <p className="text-gray-500 italic">No one has reviewed this yet.</p>
                                <button onClick={() => { const { id, ...cleanPost } = post; onRate(cleanPost); }} className="mt-4 text-lime-400 font-bold hover:underline">Log your review</button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Sidebar Actions */}
                <div className="space-y-6">
                    <button
                        onClick={() => {
                            if (hasLogged) {
                                onRate(userReview);
                            } else {
                                // Strip the ID so it's treated as a new post by this user
                                const { id, ...cleanPost } = post;
                                onRate(cleanPost);
                            }
                        }}
                        className="w-full bg-lime-400 hover:bg-lime-500 text-charcoal font-black py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xl shadow-lime-400/10 uppercase tracking-widest text-xs"
                    >
                        <Plus size={18} strokeWidth={3} />
                        {hasLogged ? 'Edit Review' : 'Log Review'}
                    </button>

                    <button
                        onClick={() => onAddToPlaylist(post)}
                        className="w-full bg-[#202830] hover:bg-[#2c3440] text-gray-300 font-black py-4 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition uppercase tracking-widest text-xs"
                    >
                        <Plus size={18} />
                        Add to list
                    </button>



                    <div className="bg-[#1a1f26] rounded-2xl p-6 border border-white/5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Song Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">Reviews</span>
                                <span className="text-xs font-black text-white">{songReviews.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">Average</span>
                                <span className="text-xs font-black text-lime-400">{averageRating}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400">Popularity</span>
                                <span className="text-xs font-black text-white">#4 this week</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SongDetailView;
