
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export function Toast({ message, type = 'error', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const colors = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    };

    const icons = {
        success: <CheckCircle2 size={20} className="text-white" />,
        error: <AlertCircle size={20} className="text-white" />,
        info: <AlertCircle size={20} className="text-white" />
    };

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white ${colors[type] || colors.error} animate-bounce-in transition-all`}>
            {icons[type] || icons.error}
            <span className="font-bold text-sm">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}
