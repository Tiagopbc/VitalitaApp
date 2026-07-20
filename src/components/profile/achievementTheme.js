import { Crown, Dumbbell, Medal, Zap } from 'lucide-react';

/**
 * Tema visual (cores + ícone) de uma conquista, derivado da sua categoria.
 * Extraído do ProfilePage; mantém exatamente as mesmas classes por categoria.
 */
export function getAchievementTheme(category) {
    if (category === 'Consistência') {
        return {
            text: 'text-[#22d3ee]', // Cyan-400
            bg: 'bg-[#083344]', // Cyan-950
            border: 'border-[#155e75]', // Cyan-800
            glow: 'shadow-[0_0_15px_-3px_rgba(34,211,238,0.2)]',
            gradient: 'from-[#06b6d4]/20 to-transparent',
            Icon: Zap
        };
    }

    if (category === 'Volume') {
        return {
            text: 'text-purple-400',
            bg: 'bg-purple-900/20',
            border: 'border-purple-500/20',
            glow: 'shadow-[0_0_15px_-3px_rgba(192,132,252,0.2)]',
            gradient: 'from-purple-500/20 to-transparent',
            Icon: Dumbbell
        };
    }

    if (category === 'Força') {
        return {
            text: 'text-emerald-400',
            bg: 'bg-emerald-900/20',
            border: 'border-emerald-500/20',
            glow: 'shadow-[0_0_15px_-3px_rgba(52,211,153,0.2)]',
            gradient: 'from-emerald-500/20 to-transparent',
            Icon: Crown
        };
    }

    return {
        text: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        glow: 'shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]',
        gradient: 'from-amber-500/20 to-transparent',
        Icon: Medal
    };
}
