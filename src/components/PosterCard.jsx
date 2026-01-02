import { Star } from 'lucide-react';

const PosterCard = ({ post, onClick, showUser = true }) => {
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => {
            const starValue = i + 1;
            const isFull = starValue <= rating;
            const isHalf = !isFull && starValue - 0.5 === rating;

            return (
                <div key={i} className="relative">
                    <Star size={10} className={`${isFull || isHalf ? 'text-lime-400' : 'text-gray-600'} ${isFull ? 'fill-lime-400' : ''}`} />
                    {isHalf && (
                        <div className="absolute inset-0 overflow-hidden w-[50%]">
                            <Star size={10} className="text-lime-400 fill-lime-400" />
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col gap-2 group cursor-pointer" onClick={() => onClick(post)}>
            <div className="relative aspect-[2/3] bg-[#202020] rounded-md overflow-hidden hover:ring-2 hover:ring-lime-400 transition-all active:scale-95 shadow-md">
                <img
                    src={post.album_art_url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop'}
                    alt={post.song_name}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop'; }}
                />
            </div>

            {showUser && (
                <div className="px-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 flex items-center justify-center text-[10px] font-bold text-charcoal overflow-hidden shrink-0">
                            {post.avatar_url ? (
                                <img src={post.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                                post.user_name?.[0].toUpperCase()
                            )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 truncate hover:text-white transition">{post.user_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                            {renderStars(post.rating)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosterCard;
