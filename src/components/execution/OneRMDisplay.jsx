/**
 * OneRMDisplay.jsx
 * Component to display and edit the user's One Rep Max (1RM) for an exercise.
 * Persists changes to Firestore.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, Edit2, Check, X } from 'lucide-react';

export function OneRMDisplay({ oneRM, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(oneRM || 0);
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(oneRM || 0);
    }, [oneRM]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (onUpdate) onUpdate(Number(value));
        setIsEditing(false);
        if (navigator.vibrate) navigator.vibrate(30);
    };

    const handleCancel = () => {
        setValue(oneRM || 0);
        setIsEditing(false);
        if (navigator.vibrate) navigator.vibrate(10);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-purple-500/50 rounded-xl px-3 py-2 min-h-[44px] shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Dumbbell size={16} className="text-purple-400 shrink-0" />
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider text-nowrap">1RM:</span>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                        ref={inputRef}
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                        className="w-16 bg-transparent text-white font-bold text-center border-b border-purple-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">kg</span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleSave}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    >
                        <Check size={16} />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px] group hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-2">
                <Dumbbell size={16} className="text-purple-400 shrink-0" />
                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">1RM:</span>
                <span className="text-sm font-bold text-purple-400 drop-shadow-sm">{value > 0 ? `${value}kg` : '--'}</span>
            </div>

            <button
                onClick={() => {
                    setIsEditing(true);
                    if (navigator.vibrate) navigator.vibrate(10);
                }}
                className="text-slate-600 hover:text-purple-400 transition-colors p-1"
            >
                <Edit2 size={14} />
            </button>
        </div>
    );
}
