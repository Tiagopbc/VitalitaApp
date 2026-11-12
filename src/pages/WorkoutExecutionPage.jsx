/**
 * WorkoutExecutionPage.jsx
 * A interface principal de rastreamento de treinos.
 * Gerencia estado da sessão ativa, cronômetro, registro de séries e navegação de exercícios no 'Modo Foco'.
 * REFATORADO: orquestrador fino — UI em `components/execution/`, lógica em
 * `hooks/workout-execution/` + `hooks/useWorkoutSession`.
 */
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { RestTimer } from '../components/execution/RestTimer';
import { Button } from '../components/design-system/Button';
import { SessionConflictDialog } from '../components/execution/SessionConflictDialog';
import { Toast } from '../components/design-system/Toast';
import { SyncStatusBadge } from '../components/design-system/SyncStatusBadge';
import { ExecutionTopBar } from '../components/execution/ExecutionTopBar';
import { ExecutionProgressCard } from '../components/execution/ExecutionProgressCard';
import { FocusModeNav } from '../components/execution/FocusModeNav';
import { ExecutionSkeleton } from '../components/execution/ExecutionSkeleton';
import { ExecutionExerciseList } from '../components/execution/ExecutionExerciseList';
import { FinishWorkoutFooter } from '../components/execution/FinishWorkoutFooter';
import { FinishingSessionOverlay } from '../components/execution/FinishingSessionOverlay';
import { WorkoutCompletion } from '../components/execution/WorkoutCompletion';
import { ExecutionDialogs } from '../components/execution/ExecutionDialogs';

// --- HOOKS PERSONALIZADOS ---
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useWakeLock } from '../hooks/useWakeLock';
import { useExecutionNavigation } from '../hooks/workout-execution/useExecutionNavigation';
import { useFinishWorkoutFlow } from '../hooks/workout-execution/useFinishWorkoutFlow';
import { useWorkoutShare } from '../hooks/workout-execution/useWorkoutShare';
import { useRestPreferences } from '../hooks/workout-execution/useRestPreferences';
import { useSessionAutoSync } from '../hooks/workout-execution/useSessionAutoSync';
import { focusGroupBehaviorLabel } from '../utils/exerciseGroups';
import { computeSessionStats } from '../utils/computeSessionStats';

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
    const [showGymTools, setShowGymTools] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showConfirmFinishModal, setShowConfirmFinishModal] = useState(false);

    // Mantém a tela ligada durante o treino ativo (evita perder o timer de descanso).
    useWakeLock(!loading && !isFinished);

    // --- PREFERÊNCIAS DO DESCANSO ---
    const { restDuration, autoStartTimer, handleRestDurationChange, handleAutoStartChange } = useRestPreferences(user);

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

    // --- SINCRONIZAÇÃO CONTÍNUA ---
    useSessionAutoSync({ loading, exercises, isFinished, initialElapsed, elapsedSeconds, setElapsedSeconds, syncSession });

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

    // Altura exata da área visível — não `min-h-screen`. O `body` já consome os
    // dois safe-area insets (index.css), então `100vh` puro deixaria a página
    // mais alta que a tela e o rodapé nunca encostaria embaixo. Com
    // `flex flex-col`, o `<main>` toma a sobra e empurra o "FINALIZAR TREINO"
    // para o fim da tela, sem precisar de botão flutuante.
    return (
        <div
            data-testid="workout-execution-page"
            data-focus-mode={focusMode ? 'true' : 'false'}
            className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col bg-[#020617] p-4 font-sans text-slate-100 selection:bg-cyan-500/30"
        >
            {/* LOADER DE FINALIZAÇÃO DA SESSÃO */}
            {isFinishingSession && <FinishingSessionOverlay />}

            <WorkoutCompletion
                showAchievementModal={showAchievementModal}
                newAchievements={newAchievements}
                onAchievementsClosed={() => {
                    setShowAchievementModal(false);
                    setShowFinishModal(true);
                }}
                showFinishModal={showFinishModal}
                sessionData={sessionData}
                userName={user?.displayName || 'Atleta'}
                sharing={sharing}
                onShare={handleShare}
                shareCardRef={shareCardRef}
                onFinishModalClosed={() => {
                    if (onFinish) onFinish();
                    else window.location.href = '/';
                }}
            />

            {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
            <SessionConflictDialog
                conflict={sessionConflict}
                onChoose={handleResolveSessionConflict}
                onKeepRecommended={() => handleResolveSessionConflict(sessionConflict?.source)}
            />
            <div className="max-w-2xl mx-auto flex flex-1 w-full flex-col">

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

                {/* Reserva no fluxo a altura que a ExecutionTopBar ocupa fixa,
                    descontada a área segura: `env(safe-area-inset-top)` já é
                    aplicado uma vez pelo `body` em index.css, e somar de novo
                    aqui duplicava o recuo em iPhones com notch/Dynamic Island,
                    abrindo um vão enorme entre a barra e o conteúdo.

                    Medido: a barra tem 65px fora da área segura, então 66 deixa
                    1px de folga. (O valor antigo era 58 para uma barra de 57px;
                    o comentário anterior dizia "~44px", que estava errado.)
                    Os 8px a mais acompanham o `+ 8px` que a barra ganhou no
                    `paddingTop` para se afastar da Dynamic Island — os dois
                    números andam juntos, mexeu num, meça o outro. */}
                <div style={{ height: '66px' }}></div>

                {!focusMode && (
                    <div className="px-4 mt-2 mb-2 flex justify-end">
                        <SyncStatusBadge status={syncState} />
                    </div>
                )}

                {focusMode && (
                    <FocusModeNav
                        currentExerciseIndex={currentExerciseIndex}
                        totalExercises={totalExercises}
                        onPrev={handlePrevExercise}
                        onNext={handleNextExercise}
                        onDiscard={handleDiscard}
                        syncStatus={syncState}
                        groupLabel={focusGroupBehaviorLabel(exercises, currentExerciseIndex)}
                    />
                )}

                {!focusMode && (
                    <div className="px-4 mb-2 mt-2">
                        <ExecutionProgressCard completedCount={completedExercisesCount} totalCount={totalExercises} />
                    </div>
                )}

                <ExecutionExerciseList
                    focusMode={focusMode}
                    exercises={exercises}
                    currentExerciseIndex={currentExerciseIndex}
                    activeSetIndices={activeSetIndices}
                    progression={progression}
                    cardHandlers={cardHandlers}
                />

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

                <ExecutionDialogs
                    selectedMethod={selectedMethod}
                    onCloseMethod={() => setSelectedMethod(null)}
                    showGymTools={showGymTools}
                    onCloseGymTools={() => setShowGymTools(false)}
                    showCancelModal={showCancelModal}
                    onCloseCancel={() => setShowCancelModal(false)}
                    onConfirmDiscard={confirmDiscard}
                    showConfirmFinishModal={showConfirmFinishModal}
                    onCloseConfirmFinish={() => setShowConfirmFinishModal(false)}
                    onConfirmFinish={() => {
                        setShowConfirmFinishModal(false);
                        handleFinishWorkout({ exercises, elapsedSeconds });
                    }}
                />

                {/* Footer Fim de Treino - Apenas mostra se o modal de finalização NÃO estiver visível */}
                {!showFinishModal && (
                    <FinishWorkoutFooter saving={saving} onFinish={() => setShowConfirmFinishModal(true)} />
                )}
            </div>
        </div>
    );
}
