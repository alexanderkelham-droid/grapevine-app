import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Music, Headphones, X, User as UserIcon, Camera, Edit2, Check, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import PosterCard from './PosterCard';

const ProfileView = ({ user, currentUser, isOwnProfile, onLogout, onEditTop4, onSelectSong, onSelectProfile, onSelectPlaylist }) => {
    const [top4, setTop4] = useState([null, null, null, null]);
    const [userPosts, setUserPosts] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [userPlaylistItems, setUserPlaylistItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
    const [isFollowing, setIsFollowing] = useState(false);
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalType, setFollowModalType] = useState('followers'); // 'followers' or 'following'
    const [followList, setFollowList] = useState([]);
    const [loadingFollowList, setLoadingFollowList] = useState(false);
    const [profile, setProfile] = useState({ user_name: '', avatar_url: null });
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        // Reset state when user changes to prevent data leakage
        setProfile({ user_name: user.user_metadata?.full_name || user.user_name || 'Curator', avatar_url: null });
        setEditName(user.user_metadata?.full_name || user.user_name || 'Curator');
        setUserPosts([]);
        setUserPlaylists([]);
        setTop4([null, null, null, null]);
        setFollowStats({ followers: 0, following: 0 });

        fetchProfileData();
    }, [user.id]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            // Fetch Top 4
            const { data: favs } = await supabase
                .from('user_favorites')
                .select('*')
                .eq('user_id', user.id);

            if (favs) {
                const t = [null, null, null, null];
                favs.forEach(x => { if (x.slot_number >= 0 && x.slot_number < 4) t[x.slot_number] = x; });
                setTop4(t);
            }

            // Fetch User's Posts
            const { data: p } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (p) setUserPosts(p);

            // Fetch Follow Stats
            const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);
            const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id);
            setFollowStats({ followers: followers || 0, following: following || 0 });

            // Fetch User's Playlists
            const { data: playlists } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (playlists) {
                setUserPlaylists(playlists);
                // Fetch items for each playlist to show covers
                const itemsMap = {};
                for (const pl of playlists) {
                    const { data: items } = await supabase
                        .from('playlist_items')
                        .select('*')
                        .eq('playlist_id', pl.id)
                        .order('position', { ascending: true });
                    itemsMap[pl.id] = items || [];
                }
                setUserPlaylistItems(itemsMap);
            }

            // Fetch Profiles table data
            const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            if (prof) {
                setProfile({ user_name: prof.user_name, avatar_url: prof.avatar_url });
                setEditName(prof.user_name);
            } else {
                const fallbackName = user.user_metadata?.full_name || user.user_name || 'Curator';
                setProfile({ user_name: fallbackName, avatar_url: null });
                setEditName(fallbackName);
            }

            // Check if current user follows this profile
            if (!isOwnProfile && currentUser) {
                const { data: followDoc } = await supabase.from('follows').select('*').eq('follower_id', currentUser.id).eq('following_id', user.id).maybeSingle();
                setIsFollowing(!!followDoc);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetUserId, currentlyFollowing, listIndex = null) => {
        if (!currentUser) return;
        const isSelf = targetUserId === user.id;

        if (currentlyFollowing) {
            await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', targetUserId);
            if (isSelf) {
                setIsFollowing(false);
                setFollowStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
            }
            if (listIndex !== null) {
                setFollowList(prev => prev.map((item, i) => i === listIndex ? { ...item, is_following: false } : item));
            }
        } else {
            await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: targetUserId });
            if (isSelf) {
                setIsFollowing(true);
                setFollowStats(prev => ({ ...prev, followers: prev.followers + 1 }));
            }
            if (listIndex !== null) {
                setFollowList(prev => prev.map((item, i) => i === listIndex ? { ...item, is_following: true } : item));
            }
        }
    };

    const openFollowModal = async (type) => {
        setFollowModalType(type);
        setShowFollowModal(true);
        setLoadingFollowList(true);
        try {
            const column = type === 'followers' ? 'following_id' : 'follower_id';
            const joinColumn = type === 'followers' ? 'follower_id' : 'following_id';

            const { data } = await supabase
                .from('follows')
                .select(`id, ${joinColumn}`)
                .eq(column, user.id);

            if (data) {
                const userIds = data.map(f => f[joinColumn]);

                // Get names from posts
                const { data: names } = await supabase
                    .from('posts')
                    .select('user_id, user_name')
                    .in('user_id', userIds);

                const { data: myFollows } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', currentUser.id);

                const myFollowedIds = new Set(myFollows?.map(f => f.following_id) || []);

                const userMap = {};
                names?.forEach(n => userMap[n.user_id] = n.user_name);

                const list = userIds.map(id => ({
                    id,
                    user_name: userMap[id] || 'Unknown Curator',
                    is_following: myFollowedIds.has(id)
                }));
                setFollowList(list);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFollowList(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const updates = {
                id: user.id,
                user_name: editName,
                updated_at: new Date()
            };
            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            setProfile(prev => ({ ...prev, user_name: editName }));
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAvatarUpload = async (e) => {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

            await supabase.from('profiles').upsert({
                id: user.id,
                avatar_url: publicUrl,
                updated_at: new Date()
            });
            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
        } catch (e) {
            console.error(e);
            alert("Storage Error: Please ensure you've run the 'Storage Setup' SQL in Supabase. \n\nGo to the SQL Editor and run:\n\ninsert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);\n\ncreate policy \"Public Access\" on storage.objects for all using ( bucket_id = 'avatars' ) with check ( bucket_id = 'avatars' );");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-10">
                <div className="relative group/avatar">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 flex items-center justify-center text-4xl font-black text-charcoal shadow-xl shrink-0 overflow-hidden">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                            (profile.user_name || 'U')[0].toUpperCase()
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="animate-spin text-lime-400" size={24} />
                            </div>
                        )}
                    </div>
                    {isOwnProfile && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition cursor-pointer rounded-full">
                            <Camera className="text-white" size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                        </label>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="bg-white/5 border border-lime-400/50 rounded-lg px-3 py-1 text-2xl font-black text-white focus:outline-none w-full maxWidth-[300px]"
                                autoFocus
                            />
                            <button onClick={handleSaveProfile} className="p-2 bg-lime-400 text-charcoal rounded-lg"><Check size={20} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight truncate mb-1">
                                {profile.user_name}
                            </h1>
                            {isOwnProfile && (
                                <button onClick={() => setIsEditing(true)} className="text-gray-500 hover:text-white transition">
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-6 mb-4">
                        <div className="flex flex-col cursor-pointer hover:opacity-70 transition" onClick={() => openFollowModal('following')}>
                            <span className="text-xl font-black text-white">{followStats.following}</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Following</span>
                        </div>
                        <div className="flex flex-col cursor-pointer hover:opacity-70 transition" onClick={() => openFollowModal('followers')}>
                            <span className="text-xl font-black text-white">{followStats.followers >= 1000 ? (followStats.followers / 1000).toFixed(1) + 'k' : followStats.followers}</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Followers</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isOwnProfile ? (
                            <button
                                onClick={onLogout}
                                className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center gap-2"
                            >
                                <LogOut size={12} /> Sign Out
                            </button>
                        ) : (
                            <button
                                onClick={() => handleFollow(user.id, isFollowing)}
                                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-lg ${isFollowing ? 'bg-white/10 text-white border border-white/10 hover:bg-red-400/20 hover:text-red-400 hover:border-red-400/50' : 'bg-lime-400 text-charcoal hover:bg-lime-500 shadow-lime-400/20'}`}
                            >
                                {isFollowing ? 'Following' : 'Follow curator'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Top 4 Section */}
            <section className="mb-12">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-4 ml-1">Current Obsessions</h2>
                <div className="grid grid-cols-4 gap-3">
                    {top4.map((s, i) => (
                        <div
                            key={i}
                            onClick={() => isOwnProfile && onEditTop4(i)}
                            className={`aspect-square bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 ${isOwnProfile ? 'hover:border-lime-400 cursor-pointer' : ''} overflow-hidden relative group transition duration-300`}
                        >
                            {s ? (
                                <>
                                    <img src={s.image_url} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                                    {isOwnProfile && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                                            <Plus size={20} className="text-white" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                isOwnProfile && <Plus className="text-gray-700 group-hover:text-lime-400 transition" size={24} />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* User Playlists Section */}
            {userPlaylists.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 ml-1">Collections</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {userPlaylists.map(playlist => {
                            const items = userPlaylistItems[playlist.id] || [];
                            const covers = items.filter(item => item.album_art_url).map(item => item.album_art_url).slice(0, 4);
                            return (
                                <div
                                    key={playlist.id}
                                    onClick={() => onSelectPlaylist(playlist)}
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
                                                            <Music size={16} className="text-gray-800" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition duration-500"></div>
                                        {covers.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
                                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                    <Music size={24} className="text-gray-600" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                                            <Music size={12} className="text-lime-400" />
                                        </div>
                                    </div>
                                    <div className="px-1">
                                        <h3 className="font-bold text-white group-hover:text-lime-400 transition truncate text-sm">{playlist.title}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{items.length} TRACKS</span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-700"></span>
                                            <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">CURATED BY {profile.user_name || 'YOU'}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* User Posts Section */}
            <section>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 ml-1">Reviews</h2>
                {userPosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {userPosts.map(post => (
                            <PosterCard
                                key={post.id}
                                post={post}
                                onClick={onSelectSong}
                                showUser={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Headphones size={32} className="mx-auto text-gray-700 mb-2" />
                        <p className="text-gray-500 text-sm">No reviews yet</p>
                    </div>
                )}
            </section>

            {/* Follow List Modal */}
            {showFollowModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in transition-all">
                    <div className="bg-[#1a1a1a] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                                    {followModalType === 'followers' ? 'Followers' : 'Following'}
                                </h3>
                                <button onClick={() => setShowFollowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition text-gray-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto space-y-4 custom-scrollbar">
                                {loadingFollowList ? (
                                    <div className="py-10 text-center text-lime-400">Loading curators...</div>
                                ) : followList.length > 0 ? (
                                    followList.map((curator, idx) => (
                                        <div key={curator.id} className="flex items-center justify-between group">
                                            <div
                                                onClick={() => {
                                                    setShowFollowModal(false);
                                                    onSelectProfile(curator);
                                                }}
                                                className="flex items-center gap-3 cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 flex items-center justify-center text-sm font-black text-charcoal shadow-lg shrink-0">
                                                    {curator.user_name?.[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-white text-sm group-hover:text-lime-400 transition truncate">{curator.user_name}</h4>
                                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Curator</p>
                                                </div>
                                            </div>

                                            {curator.id !== currentUser.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFollow(curator.id, curator.is_following, idx);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${curator.is_following ? 'bg-white/5 text-gray-500 hover:bg-red-400/20 hover:text-red-400' : 'bg-lime-400 text-charcoal hover:bg-lime-500'}`}
                                                >
                                                    {curator.is_following ? 'Unfollow' : 'Follow'}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-gray-600 italic">No curators yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;
