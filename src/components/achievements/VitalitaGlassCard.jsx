import React, { forwardRef } from 'react';
import { Medal, Zap, Dumbbell, Crown } from 'lucide-react';

// Use forwardRef to allow capturing the element for sharing/downloading
export const VitalitaGlassCard = forwardRef(({ achievement, className = '' }, ref) => {
    // Default values if no achievement is provided (for preview/fallback)
    const title = achievement?.title || "Nova Conquista";
    const description = achievement?.description || "Complete seu primeiro treino e inicie sua jornada no Vitalità.";
    const category = achievement?.category || 'Geral';
    // If icon is not provided in achievement object, infer it from category or use Medal
    let Icon = achievement?.icon || Medal;

    // --- THEME LOGIC ---
    // Define exact colors for each category to match ProfilePage.jsx
    const themes = {
        'Consistência': {
            main: '#22d3ee', // Cyan-400
            secondary: '#3b82f6', // Blue-500
            glow: 'rgba(34,211,238,0.2)',
            border: '#155e75', // Cyan-800
            bgBadge: '#083344', // Cyan-950
            gradientText: 'from-[#06b6d4] to-[#3b82f6]', // Cyan to Blue
            glowBlob1: 'bg-[#06b6d4]/20',
            glowBlob2: 'bg-[#3b82f6]/20',
            icon: Zap
        },
        'Volume': {
            main: '#c084fc', // Purple-400 (Adjusted for visibility)
            secondary: '#a855f7', // Purple-500
            glow: 'rgba(192,132,252,0.2)',
            border: '#6b21a8', // Purple-800
            bgBadge: '#3b0764', // Purple-950
            gradientText: 'from-[#c084fc] to-[#a855f7]', // Purple Light to Dark
            glowBlob1: 'bg-[#c084fc]/20',
            glowBlob2: 'bg-[#a855f7]/20',
            icon: Dumbbell
        },
        'Força': {
            main: '#34d399', // Emerald-400
            secondary: '#10b981', // Emerald-500
            glow: 'rgba(52,211,153,0.2)',
            border: '#065f46', // Emerald-800
            bgBadge: '#022c22', // Emerald-950
            gradientText: 'from-[#34d399] to-[#10b981]', // Emerald Light to Dark
            glowBlob1: 'bg-[#34d399]/20',
            glowBlob2: 'bg-[#10b981]/20',
            icon: Crown
        },
        'Geral': {
            main: '#f59e0b', // Amber-500
            secondary: '#fcd34d', // Amber-300
            glow: 'rgba(245,158,11,0.2)',
            border: '#78350f', // Amber-900
            bgBadge: '#451a03', // Amber-950 (Darker)
            gradientText: 'from-[#f59e0b] to-[#fcd34d]', // Amber
            glowBlob1: 'bg-[#f59e0b]/20',
            glowBlob2: 'bg-[#fcd34d]/20',
            icon: Medal
        }
    };

    const theme = themes[category] || themes['Geral'];

    // Override icon if category dictates it and specific icon wasn't passed (or we want to enforce category icon)
    // Actually, usually achievement object might not have instance of Icon component, so better to use theme icon if valid
    if (!achievement?.icon && theme.icon) {
        Icon = theme.icon;
    }

    return (
        // CONTAINER PRINCIPAL: Define tamanho, borda e efeito de vidro
        <div
            ref={ref}
            className={`relative flex h-[500px] w-[340px] flex-col overflow-hidden rounded-[30px] border border-slate-800/50 bg-[#020617]/70 p-8 shadow-2xl backdrop-blur-[24px] transition-transform duration-500 hover:scale-[1.02] ${className}`}
        >

            {/* CAMADA 0: Ambient Glows (Luzes de fundo) */}
            {/* Glow Superior Esquerdo (Cor Principal do Tema) */}
            <div className={`absolute -left-10 -top-10 h-64 w-64 rounded-full blur-[80px] ${theme.glowBlob1}`} />
            {/* Glow Inferior Direito (Cor Secundária do Tema) */}
            <div className={`absolute -bottom-10 -right-10 h-64 w-64 rounded-full blur-[80px] ${theme.glowBlob2}`} />

            {/* CAMADA 2: Conteúdo (Z-Index implícito pois está após os absolutes) */}
            <div className="relative flex h-full flex-col justify-between z-10">

                {/* HEADER: Badge / Etiqueta */}
                <div className="flex justify-center">
                    <span
                        className="rounded-full border px-4 py-1.5 text-[10px] font-bold tracking-widest backdrop-blur-md transition-colors duration-300"
                        style={{
                            backgroundColor: theme.bgBadge + '80', // Adding opacity to hex if possible, or use class
                            color: theme.main,
                            borderColor: theme.border
                        }}
                    >
                        NOVA CONQUISTA
                    </span>
                </div>

                {/* MAIN: Ícone e Título */}
                <div className="flex flex-col items-center text-center">

                    {/* Container do Ícone (Caixa escura com borda suave) */}
                    <div
                        className="mb-8 flex h-32 w-32 items-center justify-center rounded-3xl border bg-gradient-to-br from-[#0f172a] to-[#020617] shadow-lg transition-transform duration-500 hover:rotate-3"
                        style={{ borderColor: '#1e293b' }} // Keep neutral border for container to pop the icon inside? Or match theme? User said "badge tem que ser igual". Let's try matching theme border subtly.
                    >
                        <Icon
                            className="h-16 w-16 drop-shadow-lg"
                            strokeWidth={1.5}
                            style={{ color: theme.main }}
                        />
                    </div>

                    {/* Título com Gradiente Vitalità (Clip-Text) */}
                    <h2 className="mb-2 text-3xl font-bold tracking-tight">
                        <span
                            className={`bg-clip-text text-transparent block bg-gradient-to-br ${theme.gradientText}`}
                        >
                            {title}
                        </span>
                    </h2>

                    {/* Descrição em Slate-400 (Cinza Neutro) */}
                    <p className="text-sm font-light leading-relaxed text-slate-400">
                        {description}
                    </p>
                </div>

                {/* FOOTER: Assinatura */}
                <div className="text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                        Vitalità Pro
                    </p>
                </div>
            </div>
        </div>
    );
});

VitalitaGlassCard.displayName = 'VitalitaGlassCard';
