/**
 * DailyQuoteCard.jsx
 * Card do "pensamento do dia" na home, com o botão de compartilhar e o canvas
 * oculto (ShareableQuoteCard) que vira a imagem compartilhada. JSX movido de
 * HomeDashboard (D17); o estado vem de useShareQuote.
 */
import React from 'react';
import { Star, Share2 } from 'lucide-react';
import { ShareableQuoteCard } from '../sharing/ShareableQuoteCard';

export function DailyQuoteCard({ quote, userName, sharing, onShare, shareRef }) {
    return (
        <>
            {/* 3. MOTIVACIONAL */}
            <div className="mb-6 p-5 lg:mb-8 lg:p-6 rounded-2xl text-center bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/10 relative group">
                <Star size={20} className="text-cyan-400 mx-auto mb-3" />
                <p className="text-sm text-slate-300 italic font-medium">
                    &quot;{quote}&quot;
                </p>
                <button
                    onClick={onShare}
                    disabled={sharing}
                    className="absolute top-3 right-3 p-2 rounded-full bg-slate-800/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Compartilhar pensamento"
                >
                    {sharing ? (
                        <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    ) : (
                        <Share2 size={16} />
                    )}
                </button>
            </div>

            <ShareableQuoteCard
                ref={shareRef}
                quote={quote}
                userName={userName}
                isVisible={false}
            />
        </>
    );
}
