import React, { useRef, useState } from 'react';
import { VitalitaGlassCard } from './VitalitaGlassCard';
import { Share2, X, Trophy, Download } from 'lucide-react';
import { Button } from '../design-system/Button';

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
                <VitalitaGlassCard
                    ref={cardRef}
                    achievement={achievement}
                    className="shadow-2xl"
                />

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
