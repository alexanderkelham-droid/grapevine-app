import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AuthScreen = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [mode, setMode] = useState('LOGIN');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'SIGNUP') {
                const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
                if (error) throw error;
                if (data.session) onLogin(data.session);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (data.session) onLogin(data.session);
            }
        } catch (e) { alert(e.message); } finally { setLoading(false); }
    };

    return (
        <div className="h-screen bg-charcoal flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center"><h1 className="text-5xl font-black text-white tracking-tighter">grape<span className="text-lime-400">vine</span></h1><p className="text-gray-400 mt-2 font-medium">Record. Share. Discover.</p></div>
                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'SIGNUP' && <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition" required />}
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition" required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition" required />
                    <button type="submit" disabled={loading} className="w-full bg-lime-400 text-charcoal font-black py-4 rounded-xl hover:bg-lime-500 transition disabled:opacity-50 flex items-center justify-center">{loading ? <Loader2 className="animate-spin" /> : mode === 'LOGIN' ? 'Log In' : 'Join Grapevine'}</button>
                </form>
                <div className="text-center text-sm text-gray-500">{mode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"} <button onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-lime-400 font-bold hover:underline ml-1">{mode === 'LOGIN' ? 'Sign Up' : 'Log In'}</button></div>
            </div>
        </div>
    );
};

export default AuthScreen;
