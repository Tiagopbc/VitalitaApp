import React, { useRef, useState } from 'react';
import { Share2, X, Trophy, Download } from 'lucide-react';
import { Button } from '../design-system/Button';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';

export function AchievementUnlockedModal({ achievements, onClose }) {
    const cardRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Use the first achievement for display/sharing
    const achievement = achievements && achievements.length > 0 ? achievements[0] : null;

    if (!achievement) return null;

    const handleShare = async () => {
        if (!cardRef.current) return;
        setSharing(true);

        try {
            // Wait for fonts/images
            await new Promise(r => setTimeout(r, 100));

            // Generate PNG directly
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                backgroundColor: '#020617', // Force dark background
                pixelRatio: 2 // High resolution
            });

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `conquista_${achievement.id}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Conquista Desbloqueada!',
                    text: `Desbloqueei a conquista "${achievement.title}" no Vitalità! 🏆`,
                    files: [file]
                });
            } else {
                // Fallback de download
                const link = document.createElement('a');
                link.download = `conquista_${achievement.id}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err) {
            console.error(err);
            alert("Erro ao gerar card: " + err.message);
            setSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-sm flex flex-col items-center">

                {/* --- CARTÃO COMPARTILHÁVEL --- */}
                <div
                    ref={cardRef}
                    className="relative w-full aspect-[4/5] bg-[#020617] rounded-[40px] flex flex-col items-center justify-between p-10 overflow-hidden shadow-2xl border border-[#1e293b]"
                >
                    {/* BackglowTop */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] opacity-20 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 50% 0%, #06b6d4 0%, transparent 70%)' }}
                    />

                    {/* Badge */}
                    <div className="pt-2 z-10">
                        <div className="border border-[#155e75] bg-[#083344] px-5 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <span className="text-[#22d3ee] text-[10px] font-bold tracking-[0.2em] uppercase">
                                Nova Conquista
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full z-10 gap-8">
                        {/* ICON */}
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-[#06b6d4] blur-[50px] opacity-20 rounded-full" />

                            <div className="relative w-32 h-32 bg-[#0f172a] border border-[#1e293b] rounded-[32px] flex items-center justify-center shadow-2xl">
                                <Trophy size={56} className="text-[#22d3ee] drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" strokeWidth={1.5} />
                            </div>
                        </div>

                        {/* TEXT */}
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl font-black text-white leading-tight drop-shadow-lg scale-y-110">
                                <span style={{ color: '#bae6fd' }}>{achievement.title}</span> {/* Sky-200ish */}
                            </h1>

                            <p className="text-[#94a3b8] text-sm leading-relaxed max-w-[240px] mx-auto font-medium">
                                {achievement.description}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="w-full text-center pb-2 opacity-50 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-[4px] bg-[#06b6d4] text-[#020617] text-[9px] font-black flex items-center justify-center">V</div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-[#cbd5e1] uppercase">
                            Vitalità Pro
                        </span>
                    </div>
                </div>

                {/* --- AÇÕES --- */}
                <div className="flex flex-col w-full gap-3 animate-in slide-in-from-bottom-4 duration-500 delay-150 relative z-[110]">
                    <Button
                        onClick={handleShare}
                        className="w-full h-14 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.1)] text-sm tracking-wide uppercase flex items-center justify-center gap-2"
                        disabled={sharing}
                    >
                        {sharing ? 'Gerando...' : (
                            <>
                                <Share2 size={20} />
                                Compartilhar
                            </>
                        )}
                    </Button>

                    <button
                        onClick={onClose}
                        className="w-full h-12 text-slate-400 font-bold uppercase tracking-wider text-xs hover:text-white transition-colors"
                    >
                        Continuar
                    </button>
                </div>

            </div>
        </div>
    );
}
