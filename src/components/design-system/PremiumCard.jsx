/**
 * PremiumCard.jsx
 * Wrapper component for card-like layouts with premium styling.
 * Handles hover, press states, and click interactions with visual feedback.
 */
import React, { useState } from 'react';

export function PremiumCard({ children, onClick, className = '' }) {
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setIsPressed(false);
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            className={`
                relative p-5 rounded-3xl border transition-all duration-200 ease-out select-none
                ${onClick ? 'cursor-pointer' : ''}
                ${isPressed ? 'scale-[0.98] translate-y-0.5 shadow-sm' : ''}
                ${isHovered && !isPressed ? '-translate-y-1 shadow-[0_12px_40px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30 border-cyan-500/40' : 'border-slate-800/50 shadow-md'}
                ${!isHovered && !isPressed ? 'bg-gradient-to-br from-slate-900/90 to-slate-950/95' : 'bg-slate-900'}
                ${className}
            `}
        >
            {/* Top Shine */}
            <div
                className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            />

            {children}
        </div>
    );
}
