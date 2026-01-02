import React, { useState, useEffect } from 'react';
import { Send, CornerDownRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

const CommentSection = ({ postId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => { fetchComments(); }, [postId]);
    const fetchComments = async () => {
        const { data } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
        if (data) setComments(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        const { data } = await supabase.from('comments').insert({ post_id: postId, user_id: currentUser.id, user_name: currentUser.user_metadata.full_name || 'User', content: newComment }).select();
        if (data) { setComments([...comments, data[0]]); setNewComment(''); }
    };

    return (
        <div className="mt-4 pt-4 border-t border-white/5">
            <div className="space-y-4 mb-4">
                {comments.map(c => (
                    <div key={c.id} className="flex gap-2">
                        <CornerDownRight size={16} className="text-gray-600 mt-1 shrink-0" />
                        <div className="bg-white/5 p-2 rounded-lg flex-1">
                            <div className="text-[10px] font-bold text-lime-400 mb-1">{c.user_name}</div>
                            <div className="text-xs text-gray-300">{c.content}</div>
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime-400/50" />
                <button type="submit" className="p-1.5 bg-lime-400 text-charcoal rounded-lg hover:bg-lime-500 transition"><Send size={14} /></button>
            </form>
        </div>
    );
};

export default CommentSection;
