import React, { useEffect } from 'react';

const Toast = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClose(), 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10002] bg-lime-400 text-charcoal px-8 py-4 rounded-2xl font-black shadow-[0_8px_32px_rgba(163,230,53,0.3)] animate-in slide-in-from-top-12 fade-in duration-500 flex items-center gap-3">

            {message}
        </div>
    );
};

export default Toast;
