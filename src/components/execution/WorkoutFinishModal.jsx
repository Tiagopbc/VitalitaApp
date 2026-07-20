import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { loadShareableWorkoutCard } from './shareableWorkoutCardLoader';

const ShareableWorkoutCard = React.lazy(loadShareableWorkoutCard);

/**
 * Modal final de treino: renderiza o card compartilhável (canvas) e as ações
 * de compartilhar / fechar. `cardRef` é encaminhado ao canvas para exportação.
 */
export function WorkoutFinishModal({ session, userName, sharing, onShare, onClose, cardRef }) {
    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl animate-in fade-in overflow-y-auto">
            <div className="min-h-full flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md flex flex-col items-center space-y-4 my-auto">
                    <div className="origin-top scale-[0.85] sm:scale-100 -mb-[92px] sm:mb-0">
                        <React.Suspense fallback={
                            <div className="h-96 w-full rounded-3xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
                        }>
                            <ShareableWorkoutCard
                                ref={cardRef}
                                session={session}
                                userName={userName}
                                isVisible={true}
                            />
                        </React.Suspense>
                    </div>

                    <div className="w-full space-y-3">
                        <Button
                            onClick={onShare}
                            disabled={sharing}
                            className="w-full h-12 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 hover:from-cyan-400 hover:via-blue-400 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                        >
                            {sharing ? 'Gerando...' : (
                                <>
                                    <Share2 size={18} />
                                    Compartilhar Resultado
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full h-12 text-slate-400 hover:text-white"
                        >
                            Fechar e Sair
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
