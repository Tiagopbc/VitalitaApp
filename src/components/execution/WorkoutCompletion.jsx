/**
 * WorkoutCompletion.jsx
 * O que aparece ao concluir o treino: primeiro as conquistas desbloqueadas
 * (se houver) e depois o resumo com compartilhamento. JSX movido de
 * WorkoutExecutionPage; o fluxo vem de useFinishWorkoutFlow.
 */
import React from 'react';
import { WorkoutFinishModal } from './WorkoutFinishModal';

const AchievementUnlockedModal = React.lazy(() => import('../achievements/AchievementUnlockedModal').then(module => ({ default: module.AchievementUnlockedModal })));

export function WorkoutCompletion({
    showAchievementModal,
    newAchievements,
    onAchievementsClosed,
    showFinishModal,
    sessionData,
    userName,
    sharing,
    onShare,
    shareCardRef,
    onFinishModalClosed
}) {
    return (
        <>
            {/* ACHIEVEMENT MODAL */}
            {showAchievementModal && newAchievements.length > 0 && (
                <React.Suspense fallback={
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
                        <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                    </div>
                }>
                    <AchievementUnlockedModal
                        achievements={newAchievements}
                        onClose={onAchievementsClosed}
                    />
                </React.Suspense>
            )}

            {showFinishModal && !showAchievementModal && (
                <WorkoutFinishModal
                    session={sessionData}
                    userName={userName}
                    sharing={sharing}
                    onShare={onShare}
                    onClose={onFinishModalClosed}
                    cardRef={shareCardRef}
                />
            )}
        </>
    );
}
