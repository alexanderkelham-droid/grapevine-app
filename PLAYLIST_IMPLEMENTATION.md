# Playlist Features Implementation Guide

## Changes Needed:

### 1. Update PlaylistsView Component (Line 187)

**Replace the entire PlaylistsView component with:**

```javascript
const PlaylistsView = ({ playlists, onCreatePlaylist, onPlaylistClick, playlistItems }) => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">Your Collection</h2></div>
        <div className="grid grid-cols-2 gap-4">
             <button onClick={onCreatePlaylist} className="aspect-square bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:border-lime-400/50 transition cursor-pointer group text-gray-400 hover:text-lime-400">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-lime-400 group-hover:text-charcoal transition duration-300"><Plus size={28} /></div><span className="font-bold text-sm">Create Playlist</span>
             </button>
             {playlists.map(p => {
                 const items = playlistItems[p.id] || [];
                 const covers = items.slice(0, 4).map(item => item.album_art_url).filter(Boolean);
                 return (
                     <div key={p.id} onClick={() => onPlaylistClick(p)} className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 flex flex-col justify-end cursor-pointer group overflow-hidden border border-white/5 hover:border-lime-400 transition">
                          {covers.length > 0 ? (
                              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
                                  {[0,1,2,3].map(i => (
                                      <div key={i} className="bg-gray-700 rounded-sm overflow-hidden">
                                          {covers[i] ? <img src={covers[i]} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" /> : <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800"></div>}
                                      </div>
                                  ))}
                              </div>
                          ) : <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-lime-400 to-emerald-600"></div>}
                          <div className="relative z-10 bg-black/60 p-2 -m-2 rounded-lg backdrop-blur-md"><h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-lime-400 transition truncate">{p.title}</h3><p className="text-xs text-white/60 truncate">{items.length} songs</p></div>
                     </div>
                 );
             })}
