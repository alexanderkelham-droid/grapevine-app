import React, { useState, useEffect } from 'react';
import { Plus, Loader2, LogOut, Search, Home, Library, User, Music } from 'lucide-react';
import { supabase } from './supabaseClient';

// Import refactored components
import AuthScreen from './components/AuthScreen';
import SearchModal from './components/SearchModal';
import SongDetailView from './components/SongDetailView';
import PlaylistsView from './components/PlaylistsView';
import PlaylistDetailView from './components/PlaylistDetailView';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import PosterCard from './components/PosterCard';
import Toast from './components/Toast';
import GlobalSearchView from './components/GlobalSearchView';
import ProfileView from './components/ProfileView';

/* --- SAMPLE DATA --- */
const SAMPLE_POSTS = [
    {
        id: 'sample-1',
        song_name: "Blinding Lights",
        artist_name: "The Weeknd",
        album_art_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/08/11/d2/0811d2b3-b7d7-693c-cf64-1da881cba10d/20UMGIM05375.rgb.jpg/600x600bb.jpg",
        rating: 5,
        caption: "Iconic 80s synth vibes. Never gets old.",
        user_name: "Alex",
        created_at: new Date().toISOString()
    }
];

function App() {
    const [session, setSession] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);
    const [view, setView] = useState('HOME');

    // Data State
    const [posts, setPosts] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [playlistItems, setPlaylistItems] = useState({});
    const [topFour, setTopFour] = useState([null, null, null, null]);
    const [followingIds, setFollowingIds] = useState([]);

    // Modal & View State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('REVIEW');
    const [modalPreSelectedSong, setModalPreSelectedSong] = useState(null);
    const [activeSlotIndex, setActiveSlotIndex] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);
    const [activeSong, setActiveSong] = useState(null);
    const [activePlaylist, setActivePlaylist] = useState(null);
    const [targetProfile, setTargetProfile] = useState(null);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [songToAdd, setSongToAdd] = useState(null);

    useEffect(() => {
        if (!supabase) { setLoadingSession(false); return; }
        supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoadingSession(false); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session || !supabase) {
            fetchPosts();
            fetchPlaylists();
            fetchTopFour();
            fetchFollowing();

            if (supabase) {
                const pSub = supabase.channel('public:posts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, fetchPosts).subscribe();
                const plSub = supabase.channel('public:playlists').on('postgres_changes', { event: '*', schema: 'public', table: 'playlists' }, fetchPlaylists).subscribe();
                const pliSub = supabase.channel('public:playlist_items').on('postgres_changes', { event: '*', schema: 'public', table: 'playlist_items' }, () => {
                    fetchPlaylists(); // Refresh covers
                    if (activePlaylist) fetchPlaylistItems(activePlaylist.id);
                }).subscribe();
                return () => { supabase.removeChannel(pSub); supabase.removeChannel(plSub); supabase.removeChannel(pliSub); };
            }
        }
    }, [session]);

    const fetchPosts = async () => {
        if (!supabase) { setPosts(SAMPLE_POSTS); return; }
        const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (data) setPosts(data);
    };

    const fetchFollowing = async () => {
        if (!supabase || !session?.user?.id) return;
        const { data } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
        if (data) setFollowingIds(data.map(f => f.following_id));
    };

    const fetchPlaylists = async () => {
        if (!supabase || !session?.user?.id) return;
        const { data: pls } = await supabase.from('playlists').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        if (pls) {
            setPlaylists(pls);
            // Fetch items for all playlists to build cover grids
            const { data: items } = await supabase.from('playlist_items').select('*').in('playlist_id', pls.map(p => p.id));
            if (items) {
                const grouped = {};
                items.forEach(item => {
                    if (!grouped[item.playlist_id]) grouped[item.playlist_id] = [];
                    grouped[item.playlist_id].push(item);
                });
                setPlaylistItems(grouped);
            }
        }
    };

    const fetchPlaylistItems = async (playlistId) => {
        if (!supabase) return;
        const { data } = await supabase.from('playlist_items').select('*').eq('playlist_id', playlistId).order('added_at', { ascending: true });
        if (data) {
            setPlaylistItems(prev => ({ ...prev, [playlistId]: data }));
        }
    };

    const fetchTopFour = async () => {
        if (!session?.user?.id || !supabase) return;
        const { data } = await supabase.from('user_favorites').select('*').eq('user_id', session.user.id);
        if (data) {
            const t = [null, null, null, null];
            data.forEach(x => { if (x.slot_number >= 0 && x.slot_number < 4) t[x.slot_number] = x; });
            setTopFour(t);
        }
    };

    const handleCreatePlaylist = async (title) => {
        if (!title || !title.trim()) return;
        if (!supabase) return;
        await supabase.from('playlists').insert([{
            user_id: session.user.id,
            title: title.trim(),
            description: "Custom collection"
        }]);
        setToastMessage("Playlist created!");
        fetchPlaylists();
    };

    const handleRateFromSong = (song) => {
        setModalPreSelectedSong(song);
        setModalMode('REVIEW');
        setIsModalOpen(true);
    };

    const handleOpenPlaylistModal = (song) => {
        setSongToAdd(song);
        setIsPlaylistModalOpen(true);
    };

    const handleAddSongToPlaylist = async (playlistId, song) => {
        if (!supabase) return;
        await supabase.from('playlist_items').insert([{
            playlist_id: playlistId,
            song_name: song.song_name,
            artist_name: song.artist_name,
            album_art_url: song.album_art_url,
            preview_url: song.preview_url
        }]);
        setToastMessage("Added to playlist!");
        fetchPlaylists();
    };

    const handleRemoveSong = async (songId) => {
        if (!supabase) return;
        await supabase.from('playlist_items').delete().eq('id', songId);
        if (activePlaylist) fetchPlaylistItems(activePlaylist.id);
        fetchPlaylists();
        setToastMessage("Removed from playlist");
    };

    const handleModalSubmit = async (data) => {
        if (!session) return;
        if (modalMode === 'TOP_4') {
            const entry = { user_id: session.user.id, slot_number: activeSlotIndex, track_name: data.title, artist_name: data.artist, image_url: data.albumCover };
            setTopFour(prev => { const n = [...prev]; n[activeSlotIndex] = entry; return n; });
            if (supabase) await supabase.from('user_favorites').upsert(entry, { onConflict: 'user_id, slot_number' });
            setToastMessage("Obsession updated!");
        } else if (modalMode === 'PLAYLIST_ADD') {
            await handleAddSongToPlaylist(activePlaylist.id, {
                song_name: data.title,
                artist_name: data.artist,
                album_art_url: data.albumCover,
                preview_url: data.previewUrl
            });
            if (activePlaylist) fetchPlaylistItems(activePlaylist.id);
        } else {
            const p = { ...data, user_id: session.user.id, user_name: session.user.user_metadata.full_name || 'User' };
            if (supabase) await supabase.from('posts').upsert(p, { onConflict: 'user_id, song_name, artist_name' });
            setToastMessage(data.id ? "Review updated!" : "Review posted!");
            fetchPosts();
        }
        setIsModalOpen(false);
    };

    const handleGoHome = () => {
        setView('HOME');
        setActiveSong(null);
        setActivePlaylist(null);
        setTargetProfile(null);
        setModalPreSelectedSong(null);
        setIsModalOpen(false);
        fetchFollowing();
    };

    const handleSelectPerson = (person) => {
        setTargetProfile(person);
        setView('PROFILE');
    };

    const handleSelectSearchSong = (song) => {
        setActiveSong(song);
        // We stay in whatever view we were in, or go to detail
    };

    if (loadingSession) return <div className="h-screen bg-[#14181c] flex items-center justify-center text-lime-400"><Loader2 className="animate-spin" size={48} /></div>;
    if (!session) return <AuthScreen onLogin={setSession} />;

    // Render logic
    const modals = (
        <>
            <SearchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmitReview={handleModalSubmit} mode={modalMode} preSelectedSong={modalPreSelectedSong} />
            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                song={songToAdd}
                playlists={playlists}
                onAddToPlaylist={handleAddSongToPlaylist}
                onCreatePlaylist={handleCreatePlaylist}
            />
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </>
    );

    if (activeSong) {
        return (
            <>
                <SongDetailView
                    post={activeSong}
                    onBack={() => setActiveSong(null)}
                    allPosts={posts}
                    currentUser={session.user}
                    onRate={handleRateFromSong}
                    onAddToPlaylist={handleOpenPlaylistModal}
                    onSelectProfile={handleSelectPerson}
                />
                {modals}
            </>
        );
    }

    if (activePlaylist) {
        return (
            <>
                <PlaylistDetailView
                    playlist={activePlaylist}
                    items={playlistItems[activePlaylist.id] || []}
                    onBack={() => setActivePlaylist(null)}
                    onRemoveSong={handleRemoveSong}
                    onPlaySong={(s) => setActiveSong(s)}
                    onAddSong={() => {
                        setModalMode('PLAYLIST_ADD');
                        setModalPreSelectedSong(null);
                        setIsModalOpen(true);
                    }}
                />
                {modals}
            </>
        );
    }

    if (view === 'SEARCH') {
        return (
            <>
                <GlobalSearchView
                    onBack={() => setView('HOME')}
                    onSelectSong={(s) => setActiveSong(s)}
                    onSelectProfile={handleSelectPerson}
                />
                {modals}
            </>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#14181c] text-white font-sans pb-20 overflow-x-hidden">
            <nav className="sticky top-0 z-40 bg-[#14181c]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="text-2xl font-black tracking-tighter cursor-pointer flex items-center gap-1" onClick={handleGoHome}>
                            <div className="flex gap-1 mr-1">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            grape<span className="text-white">vine</span>
                        </div>

                        <div className="hidden md:flex items-center gap-6">
                            <button
                                onClick={() => setView('PLAYLISTS')}
                                className={`text-[10px] font-black tracking-[0.2em] transition uppercase ${view === 'PLAYLISTS' ? 'text-lime-400' : 'text-gray-400 hover:text-white'}`}
                            >
                                PLAYLISTS
                            </button>
                            <button
                                className="text-[10px] font-black tracking-[0.2em] text-gray-400 hover:text-white transition uppercase"
                            >
                                FESTIVALS
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('SEARCH')} className="p-2 text-gray-400 hover:text-white transition">
                            <Search size={20} />
                        </button>

                        <div onClick={() => { setTargetProfile(null); setView('PROFILE'); }} className="flex items-center gap-2 cursor-pointer group">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 border border-white/10 flex items-center justify-center font-bold text-charcoal text-[10px] overflow-hidden group-hover:ring-2 group-hover:ring-lime-400 transition">
                                {session.user.user_metadata?.full_name?.substring(0, 1).toUpperCase() || 'U'}
                            </div>
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">
                                {session.user.user_metadata?.full_name?.split(' ')[0]}
                            </span>
                        </div>

                    </div>
                </div>
            </nav>

            {view === 'HOME' && (
                <div className="max-w-2xl mx-auto px-4 pt-10 pb-6 border-b border-white/5">
                    <h1 className="text-3xl font-light text-white leading-tight">
                        Welcome back, <span className="font-bold border-b-2 border-lime-400 pb-0.5">{session.user.user_metadata?.full_name?.split(' ')[0] || 'Curator'}</span>. Here's what your friends have been listening to...
                    </h1>
                </div>
            )}

            <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
                {view === 'HOME' && (
                    <div className="space-y-12">
                        {/* New from Friends Section */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">New from Friends</h2>
                                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition">All Activity</button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {posts
                                    .filter(post => followingIds.includes(post.user_id))
                                    .slice(0, 6)
                                    .map(post => (
                                        <PosterCard key={post.id} post={post} onClick={setActiveSong} />
                                    ))}
                                {followingIds.length === 0 && (
                                    <div className="col-span-full py-10 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center">
                                        <p className="text-gray-500 text-sm">Follow some curators to see their reviews here!</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Popular Content Section */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Popular this week</h2>
                                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition">More</button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {[...posts]
                                    .filter(p => !String(p.id).startsWith('sample-'))
                                    .reverse()
                                    .slice(0, 6)
                                    .map(post => (
                                        <PosterCard key={post.id} post={post} onClick={setActiveSong} showUser={false} />
                                    ))}
                            </div>
                        </section>

                        {/* Playlists Preview */}
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                            <div className="flex items-center justify-between mb-6 px-1">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Your Recent Collections</h2>
                                <button onClick={() => { /* maybe a playlists tab later */ }} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 hover:text-white transition">View All</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {playlists.slice(0, 2).map(playlist => {
                                    const items = playlistItems[playlist.id] || [];
                                    const covers = items.filter(item => item.album_art_url).map(item => item.album_art_url).slice(0, 4);
                                    return (
                                        <div
                                            key={playlist.id}
                                            onClick={() => setActivePlaylist(playlist)}
                                            className="group flex flex-col gap-3 cursor-pointer"
                                        >
                                            <div className="relative aspect-square bg-[#202020] rounded-2xl overflow-hidden border border-white/5 group-hover:border-lime-400/50 transition shadow-2xl">
                                                <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5">
                                                    {[...Array(4)].map((_, i) => (
                                                        <div key={i} className="bg-white/5 overflow-hidden">
                                                            {covers[i] ? (
                                                                <img src={covers[i]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                                    <Music size={14} className="text-gray-800" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-500"></div>
                                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                                                    <Music size={10} className="text-lime-400" />
                                                </div>
                                            </div>
                                            <div className="px-1">
                                                <h3 className="font-bold text-white group-hover:text-lime-400 transition truncate text-xs">{playlist.title}</h3>
                                                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">{items.length} TRACKS</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}
                {view === 'SEARCH' && (
                    <GlobalSearchView
                        onBack={handleGoHome}
                        onSelectSong={(s) => setActiveSong(s)}
                        onSelectProfile={handleSelectPerson}
                    />
                )}
                {view === 'PLAYLISTS' && (
                    <PlaylistsView
                        playlists={playlists}
                        playlistItems={playlistItems}
                        onCreatePlaylist={handleCreatePlaylist}
                        onPlaylistClick={(p) => setActivePlaylist(p)}
                    />
                )}
                {view === 'PROFILE' && (
                    <ProfileView
                        user={targetProfile || session.user}
                        currentUser={session.user}
                        isOwnProfile={!targetProfile || targetProfile.id === session.user.id}
                        onLogout={() => supabase.auth.signOut()}
                        onEditTop4={(slot) => {
                            setActiveSlotIndex(slot);
                            setModalMode('TOP_4');
                            setIsModalOpen(true);
                        }}
                        onSelectSong={(s) => setActiveSong(s)}
                        onSelectProfile={handleSelectPerson}
                        onSelectPlaylist={(p) => setActivePlaylist(p)}
                    />
                )}
            </main>

            {modals}

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1f26]/95 backdrop-blur-xl border-t border-white/5 py-4 px-8 flex justify-between items-center z-[60] pb-safe">
                <button onClick={handleGoHome} className={`flex flex-col items-center gap-1 ${view === 'HOME' ? 'text-lime-400' : 'text-gray-500'}`}>
                    <Home size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                </button>
                <button onClick={() => setView('SEARCH')} className={`flex flex-col items-center gap-1 ${view === 'SEARCH' ? 'text-lime-400' : 'text-gray-500'}`}>
                    <Search size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Search</span>
                </button>
                <button onClick={() => setView('PLAYLISTS')} className={`flex flex-col items-center gap-1 ${view === 'PLAYLISTS' ? 'text-lime-400' : 'text-gray-500'}`}>
                    <Library size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Library</span>
                </button>
                <button onClick={() => { setTargetProfile(null); setView('PROFILE'); }} className={`flex flex-col items-center gap-1 ${view === 'PROFILE' ? 'text-lime-400' : 'text-gray-500'}`}>
                    <User size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
                </button>
            </nav>
        </div >
    );
}

export default App;
