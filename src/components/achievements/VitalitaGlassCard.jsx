import React, { forwardRef } from 'react';
import { Medal } from 'lucide-react';

// Use forwardRef to allow capturing the element for sharing/downloading
export const VitalitaGlassCard = forwardRef(({ achievement, className = '' }, ref) => {
    // Default values if no achievement is provided (for preview/fallback)
    const title = achievement?.title || "Nova Conquista";
    const description = achievement?.description || "Complete seu primeiro treino e inicie sua jornada no Vitalità.";
    const Icon = achievement?.icon || Medal; // Allow passing a specific icon component, default to Medal
    const isUnlocked = achievement?.isUnlocked ?? true; // Default to true for the "unlocked" card view

    // Splitting title for the 2-line effect if possible, or just standard display
    // The design requests a specific look with "Primeira Sessão" broken lines.
    // For dynamic text, we might just render it normally or try to split if it's too long.
    // We'll trust the input title for now, but maybe apply a max-width or line-clamp if needed.

    return (
        // CONTAINER PRINCIPAL: Define tamanho, borda e efeito de vidro
        <div
            ref={ref}
            className={`relative flex h-[500px] w-[340px] flex-col overflow-hidden rounded-[30px] border border-slate-800/50 bg-[#020617]/70 p-8 shadow-2xl backdrop-blur-[24px] transition-transform duration-500 hover:scale-[1.02] ${className}`}
        >

            {/* CAMADA 0: Ambient Glows (Luzes de fundo) */}
            {/* Glow Ciano Superior Esquerdo */}
            <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-[#06b6d4]/20 blur-[80px]" />
            {/* Glow Azul Inferior Direito */}
            <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-[#3b82f6]/20 blur-[80px]" />

            {/* CAMADA 2: Conteúdo (Z-Index implícito pois está após os absolutes) */}
            <div className="relative flex h-full flex-col justify-between z-10">

                {/* HEADER: Badge / Etiqueta */}
                <div className="flex justify-center">
                    <span className="rounded-full border border-[#06b6d4]/20 bg-[#1e293b]/50 px-4 py-1.5 text-[10px] font-bold tracking-widest text-[#22d3ee] backdrop-blur-md">
                        NOVA CONQUISTA
                    </span>
                </div>

                {/* MAIN: Ícone e Título */}
                <div className="flex flex-col items-center text-center">

                    {/* Container do Ícone (Caixa escura com borda suave) */}
                    <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-3xl border border-[#1e293b] bg-gradient-to-br from-[#0f172a] to-[#020617] shadow-lg transition-transform duration-500 hover:rotate-3">
                        <Icon className="h-16 w-16 text-[#22d3ee] drop-shadow-lg" strokeWidth={1.5} />
                    </div>

                    {/* Título com Gradiente Vitalità (Clip-Text) */}
                    <h2 className="mb-2 text-3xl font-bold tracking-tight">
                        <span className="bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] bg-clip-text text-transparent block">
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
