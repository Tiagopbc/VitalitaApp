/**
 * WorkoutExecutionPage.jsx
 * A interface principal de rastreamento de treinos.
 * Gerencia estado da sessão ativa, cronômetro, registro de séries e navegação de exercícios no 'Modo Foco'.
 * REFATORADO: orquestrador fino — UI em `components/execution/`, lógica em
 * `hooks/workout-execution/` + `hooks/useWorkoutSession`.
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { CheckCircle2 } from 'lucide-react';
import { RestTimer } from '../components/execution/RestTimer';
import { Button } from '../components/design-system/Button';
import MethodModal from '../MethodModal';
import { SessionConflictDialog } from '../components/execution/SessionConflictDialog';
import { Toast } from '../components/design-system/Toast';
import { SyncStatusBadge } from '../components/design-system/SyncStatusBadge';
import { ExecutionTopBar } from '../components/execution/ExecutionTopBar';
import { ExecutionProgressCard } from '../components/execution/ExecutionProgressCard';
import { FocusModeNav } from '../components/execution/FocusModeNav';
import { ExecutionSkeleton } from '../components/execution/ExecutionSkeleton';
import { ExerciseCard } from '../components/execution/ExerciseCard';
import { ExerciseGroupCard } from '../components/execution/ExerciseGroupCard';
import { CancelWorkoutModal } from '../components/execution/CancelWorkoutModal';
import { ConfirmFinishModal } from '../components/execution/ConfirmFinishModal';
import { WorkoutFinishModal } from '../components/execution/WorkoutFinishModal';

// --- HOOKS PERSONALIZADOS ---
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useWakeLock } from '../hooks/useWakeLock';
import { useExecutionNavigation } from '../hooks/workout-execution/useExecutionNavigation';
import { useFinishWorkoutFlow } from '../hooks/workout-execution/useFinishWorkoutFlow';
import { useWorkoutShare } from '../hooks/workout-execution/useWorkoutShare';
import { computeGroupSegments } from '../utils/exerciseGroups';
import { computeSessionStats } from '../utils/computeSessionStats';
import { userPreferencesService } from '../services/userPreferencesService';
const AchievementUnlockedModal = React.lazy(() => import('../components/achievements/AchievementUnlockedModal').then(module => ({ default: module.AchievementUnlockedModal })));
const GymToolsModal = React.lazy(() => import('../components/execution/GymToolsModal').then(module => ({ default: module.GymToolsModal })));

// --- COMPONENTE DA PÁGINA PRINCIPAL ---
export function WorkoutExecutionPage({ user }) {
    const { workoutId } = useParams();
    const { finishWorkout } = useWorkout();
    const onFinish = () => finishWorkout();
    // --- INTEGRAÇÃO DE HOOKS ---
    const {
        loading,
        saving,
        error,
        setError,
        syncState,
        template,
        exercises,
        sessionConflict,
        initialElapsed,
        progression,
        updateExerciseSet,
        updateNotes,
        completeSetAutoFill,
        finishSession,
        syncSession,
        discardSession,
        resolveSessionConflict,
        updateSetMultiple,
        toggleExerciseWeightMode
    } = useWorkoutSession(workoutId, user);

    // --- ESTADO DA UI ---
    const [showTimer, setShowTimer] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    const [isFinished, setIsFinished] = useState(false); // Previne "Sessões Zumbis"
    const [restDuration, setRestDuration] = useState(90);
    const [autoStartTimer, setAutoStartTimer] = useState(false);
    const [showGymTools, setShowGymTools] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showConfirmFinishModal, setShowConfirmFinishModal] = useState(false);

    // Mantém a tela ligada durante o treino ativo (evita perder o timer de descanso).
    useWakeLock(!loading && !isFinished);

    // --- CARREGAR PREFERÊNCIAS DO USUÁRIO ---
    useEffect(() => {
        if (user?.uid) {
            userPreferencesService.getWorkoutPreferences(user.uid)
                .then(profile => {
                    if (profile?.defaultRestTime) {
                        setRestDuration(profile.defaultRestTime);
                    }
                    if (profile?.autoStartTimer !== undefined) {
                        setAutoStartTimer(profile.autoStartTimer);
                    }
                })
                .catch(console.error);
        }
    }, [user?.uid]);

    // --- PERSISTIR PREFERÊNCIA ---
    const handleRestDurationChange = (newDuration) => {
        setRestDuration(newDuration);
        if (user?.uid) {
            // Atualização "fire and forget"
            userPreferencesService
                .updateWorkoutPreferences(user.uid, { defaultRestTime: newDuration })
                .catch(err => console.error("Failed to save rest preference:", err));
        }
    };

    const handleAutoStartChange = (newVal) => {
        setAutoStartTimer(newVal);
        if (user?.uid) {
            userPreferencesService
                .updateWorkoutPreferences(user.uid, { autoStartTimer: newVal })
                .catch(err => console.error("Failed to save auto start preference:", err));
        }
    };

    // --- NAVEGAÇÃO (Modo Foco, série ativa, avanço bi-set/circuito) ---
    const {
        currentExerciseIndex,
        activeSetIndices,
        handleSetNavigation,
        handleNextExercise,
        handlePrevExercise,
        handleCompleteSetWrapper
    } = useExecutionNavigation({ exercises, focusMode, autoStartTimer, setShowTimer, completeSetAutoFill });

    const {
        elapsedSeconds,
        setElapsedSeconds,
        // formatTime // Não utilizado atualmente, mas disponível
    } = useWorkoutTimer(!loading && !saving && !isFinished, initialElapsed); // Parar timer ao finalizar

    const handleResolveSessionConflict = (source) => {
        const candidate = resolveSessionConflict(source);
        if (candidate) {
            setElapsedSeconds(candidate.elapsedSeconds);
        }
    };

    // Sincronizar tempo decorrido do hook quando carregado
    useEffect(() => {
        if (initialElapsed > 0 && elapsedSeconds === 0) {
            setElapsedSeconds(initialElapsed);
        }
    }, [initialElapsed, elapsedSeconds, setElapsedSeconds]);

    // Efeito de Sincronização Contínua
    useEffect(() => {
        if (!loading && exercises.length > 0 && !isFinished) {
            syncSession(exercises, elapsedSeconds);
        }
    }, [exercises, elapsedSeconds, loading, isFinished, syncSession]);

    // --- FLUXO DE FINALIZAÇÃO ---
    const {
        frozenSession,
        showFinishModal,
        setShowFinishModal,
        isFinishingSession,
        newAchievements,
        showAchievementModal,
        setShowAchievementModal,
        handleFinishWorkout
    } = useFinishWorkoutFlow({ user, finishSession, setIsFinished });

    // --- CANCELAMENTO/DESCARTE ---
    const handleDiscard = () => {
        setShowCancelModal(true);
    };

    const confirmDiscard = async () => {
        setIsFinished(true); // Parar sincronização
        const discarded = await discardSession();
        if (discarded !== false) {
            onFinish();
            return;
        }
        setIsFinished(false);
        setShowCancelModal(false);
    };

    // --- COMPARTILHAMENTO ---
    const { sharing, shareCardRef, handleShare } = useWorkoutShare({ templateName: template?.name, setError });

    // Use frozen data if finished, otherwise live data
    const displayExercises = frozenSession?.exercises || exercises;
    const displayElapsed = frozenSession?.elapsedSeconds || elapsedSeconds;

    // --- RENDERIZAÇÃO ---
    // If finished, we ignore loading state to keep the Summary/Modal visible
    if (loading && !isFinished && !frozenSession) {
        return <ExecutionSkeleton />;
    }

    const sessionData = computeSessionStats({
        exercises: displayExercises,
        elapsedSeconds: displayElapsed,
        templateName: template?.name
    });
    const completedExercisesCount = sessionData.exercisesCount;
    const totalExercises = displayExercises.length;

    const cardHandlers = {
        updateExerciseSet,
        updateSetMultiple,
        onSetNavigation: handleSetNavigation,
        onSelectMethod: setSelectedMethod,
        onCompleteSet: handleCompleteSetWrapper,
        updateNotes,
        toggleExerciseWeightMode,
        onValidationError: setError
    };

    return (
        <div
            data-testid="workout-execution-page"
            data-focus-mode={focusMode ? 'true' : 'false'}
            className={`min-h-screen bg-[#020617] text-slate-100 p-4 font-sans selection:bg-cyan-500/30 ${focusMode
                ? 'pb-[calc(1rem+env(safe-area-inset-bottom))]'
                : 'pb-4'
                }`}
        >
            {/* LOADER DE FINALIZAÇÃO DA SESSÃO */}
            {isFinishingSession && (
                <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300 text-white">
                    <div className="h-16 w-16 mb-6 rounded-full border-[3px] border-cyan-500/20 border-t-cyan-400 animate-spin" />
                    <h3 className="text-xl font-extrabold tracking-widest text-cyan-400 mb-2 uppercase">Finalizando</h3>
                    <p className="text-slate-400 text-sm font-medium animate-pulse">Salvando o seu esforço de hoje...</p>
                </div>
            )}

            {/* ACHIEVEMENT MODAL */}
            {showAchievementModal && newAchievements.length > 0 && (
                <React.Suspense fallback={
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
                        <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                    </div>
                }>
                    <AchievementUnlockedModal
                        achievements={newAchievements}
                        onClose={() => {
                            setShowAchievementModal(false);
                            setShowFinishModal(true);
                        }}
                    />
                </React.Suspense>
            )}

            {showFinishModal && !showAchievementModal && (
                <WorkoutFinishModal
                    session={sessionData}
                    userName={user?.displayName || 'Atleta'}
                    sharing={sharing}
                    onShare={handleShare}
                    onClose={() => {
                        if (onFinish) onFinish();
                        else window.location.href = '/';
                    }}
                    cardRef={shareCardRef}
                />
            )}
            {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
            <SessionConflictDialog
                conflict={sessionConflict}
                onChoose={handleResolveSessionConflict}
                onKeepRecommended={() => handleResolveSessionConflict(sessionConflict?.source)}
            />
            <div className="max-w-2xl mx-auto flex flex-col">

                <ExecutionTopBar
                    onBack={() => onFinish()}
                    onDiscard={handleDiscard}
                    onOpenGymTools={() => setShowGymTools(true)}
                    showGymTools={showGymTools}
                    showTimer={showTimer}
                    onToggleTimer={() => setShowTimer(!showTimer)}
                    focusMode={focusMode}
                    onToggleFocus={() => setFocusMode(!focusMode)}
                />

                <div style={{ height: 'calc(65px + env(safe-area-inset-top))' }}></div>

                <div className="px-4 mt-2 mb-2 flex justify-end">
                    <SyncStatusBadge status={syncState} />
                </div>

                {focusMode && (
                    <FocusModeNav
                        exercises={exercises}
                        currentExerciseIndex={currentExerciseIndex}
                        totalExercises={totalExercises}
                        onPrev={handlePrevExercise}
                        onNext={handleNextExercise}
                    />
                )}

                {!focusMode && (
                    <div className="px-4 mb-2 mt-2">
                        <ExecutionProgressCard completedCount={completedExercisesCount} totalCount={totalExercises} />
                    </div>
                )}

                <main className={`px-4 mt-2 space-y-4`}>
                    {focusMode ? (
                        exercises.length > 0 && (
                            <ExerciseCard
                                key={exercises[currentExerciseIndex].id}
                                exercise={exercises[currentExerciseIndex]}
                                activeSetIndices={activeSetIndices}
                                progression={progression}
                                handlers={cardHandlers}
                            />
                        )
                    ) : (
                        computeGroupSegments(exercises).map((segment) => (
                            <ExerciseGroupCard
                                key={segment.groupId || `seg-${segment.indices[0]}`}
                                segment={segment}
                                exercises={exercises}
                                activeSetIndices={activeSetIndices}
                                progression={progression}
                                handlers={cardHandlers}
                            />
                        ))
                    )}
                </main>

                {showTimer && (
                    <RestTimer
                        initialTime={restDuration}
                        isOpen={showTimer}
                        onClose={() => setShowTimer(false)}
                        onDurationChange={handleRestDurationChange}
                        autoStartTimer={autoStartTimer}
                        onAutoStartChange={handleAutoStartChange}
                    />
                )}

                <MethodModal
                    methodName={selectedMethod}
                    onClose={() => setSelectedMethod(null)}
                />

                {showGymTools && (
                    <React.Suspense fallback={null}>
                        <GymToolsModal
                            isOpen={showGymTools}
                            onClose={() => setShowGymTools(false)}
                        />
                    </React.Suspense>
                )}

                {/* MODAL DE CANCELAMENTO */}
                {showCancelModal && (
                    <CancelWorkoutModal
                        onClose={() => setShowCancelModal(false)}
                        onConfirm={confirmDiscard}
                    />
                )}

                {/* MODAL DE CONFIRMAÇÃO DE FINALIZAÇÃO */}
                {showConfirmFinishModal && (
                    <ConfirmFinishModal
                        onClose={() => setShowConfirmFinishModal(false)}
                        onConfirm={() => {
                            setShowConfirmFinishModal(false);
                            handleFinishWorkout({ exercises, elapsedSeconds });
                        }}
                    />
                )}

                {/* Footer Fim de Treino - Apenas mostra se o modal de finalização NÃO estiver visível */}
                {!showFinishModal && (
                    <div
                        data-testid="workout-finish-footer"
                        className={`w-full ${focusMode
                            ? 'mt-5 pb-[calc(1rem+env(safe-area-inset-bottom))]'
                            : 'mt-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))]'
                            }`}
                    >
                        <div className="max-w-2xl mx-auto flex justify-center">
                            <div className="space-y-4 w-full flex flex-col items-center px-4">
                                <Button
                                    onClick={() => setShowConfirmFinishModal(true)}
                                    disabled={saving}
                                    variant="success"
                                    className="w-auto min-w-[240px] px-8 font-bold h-12 rounded-full tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(34,197,94,0.2)]"
                                >
                                    {saving ? (
                                        'SALVANDO...'
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} strokeWidth={3} className="text-white/90" />
                                            FINALIZAR TREINO
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>


        </div >
    );
}
