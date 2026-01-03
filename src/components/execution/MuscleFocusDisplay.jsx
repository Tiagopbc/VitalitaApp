/**
 * MuscleFocusDisplay.jsx
 * Displays the primary muscle group focus for an exercise.
 * Uses color coding to indicate emphasis level (high, medium, low).
 */
import React from 'react';
import { Zap } from 'lucide-react';

export function MuscleFocusDisplay({ muscleFocus }) {
    // Default fallback
    const focus = muscleFocus || { primary: 'Geral', emphasis: 'medium' };

    // Determine styles based on emphasis
    const getEmphasisStyle = () => {
        switch (focus.emphasis) {
            case 'high':
                return 'text-cyan-400 font-bold';
            case 'medium':
                return 'text-blue-400 font-semibold';
            case 'low':
                return 'text-slate-400 font-medium';
            default:
                return 'text-slate-400';
        }
    };

    const getLabel = () => {
        switch (focus.emphasis) {
            case 'high': return '(ênfase alta)';
            case 'medium': return '(ênfase média)';
            case 'low': return '(ênfase baixa)';
            default: return '';
        }
    };

    return (
        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 min-h-[44px]">
            <Zap size={16} className="text-amber-400 shrink-0" />
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Foco:</span>
            <div className="flex items-center gap-1.5 text-sm">
                <span className={getEmphasisStyle()}>{focus.primary}</span>
                <span className="text-xs text-slate-500 italic">{getLabel()}</span>
            </div>
        </div>
    );
}
