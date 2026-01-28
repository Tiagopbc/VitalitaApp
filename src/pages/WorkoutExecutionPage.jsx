/**
 * WorkoutExecutionPage.jsx
 * A interface principal de rastreamento de treinos.
 * Gerencia estado da sessão ativa, cronômetro, registro de séries e navegação de exercícios no 'Modo Foco'.
 * REFATORADO: Usa useWorkoutTimer e useWorkoutSession.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft,
    RotateCw,
    Check,
    CheckCircle2,
    Activity,
    Timer,
    Dumbbell,
    Eye,
    ChevronRight,
    Share2,
    RotateCcw,
    Trash2,
    ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas'; // For sharing
import { ShareableWorkoutCard } from '../components/sharing/ShareableWorkoutCard';
import { RestTimer } from '../components/execution/RestTimer';
// import { MuscleFocusDisplay } from '../components/execution/MuscleFocusDisplay'; // Unused
// import { OneRMDisplay } from '../components/execution/OneRMDisplay'; // Unused
import { RippleButton } from '../components/design-system/RippleButton';
import { Button } from '../components/design-system/Button';
import MethodModal from '../MethodModal';
import { LinearCardCompactV2 } from '../components/execution/LinearCardCompactV2';
import { Toast } from '../components/design-system/Toast';
import { Skeleton } from '../components/design-system/Skeleton';

// --- HOOKS PERSONALIZADOS ---
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { checkNewAchievements } from '../utils/evaluateAchievements';
import { AchievementUnlockedModal } from '../components/achievements/AchievementUnlockedModal';
import { workoutService } from '../services/workoutService';
import { userService } from '../services/userService';

const TopBarButton = ({ icon, label, variant = 'default', onClick, active, isBack = false }) => {
    // Estilos base: "Voltar" recebe tamanho padrão, outros recebem tamanho EXTRA compacto
    const sizeStyles = isBack
        ? "px-3 py-2 text-xs"
        : "px-2 py-1.5 text-[9px] tracking-tight"; // Reduced padding and font size

    const baseStyles = `flex items-center gap-1 rounded-lg font-bold uppercase transition-all duration-300 border backdrop-blur-md whitespace-nowrap ${sizeStyles}`;

    const variants = {
        primary: "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]",
        danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
        default: active
            ? "bg-slate-800 text-white border-slate-600 shadow-lg"
            : "bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800/80 hover:text-white"
    };

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]}`}
        >
            {React.cloneElement(icon, { size: isBack ? 16 : 13, strokeWidth: 2.5 })}
            <span>{label}</span>
        </button>
    );
};

// --- SUBCOMPONENTE: Card de Progresso (Mantido inline por simplicidade ou mover para arquivo separado depois) ---
function ProgressCard({ completedCount, totalCount }) {
    return (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 mb-6 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-500/10">
                        <Check size={9} className="text-cyan-400" strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso do Treino</span>
                </div>

                <div className="text-sm font-bold text-white">
                    <span className="text-lg text-cyan-400 mr-1 font-heading">{completedCount}</span>
                    <span className="text-slate-600">/ {totalCount}</span>
                </div>
            </div>

            {/* Segmented Bar */}
            <div className="flex gap-1.5 h-1.5 w-full">
                {Array.from({ length: totalCount }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-500 ${idx < completedCount
                            ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                            : 'bg-slate-800/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

// --- COMPONENTE DA PÁGINA PRINCIPAL ---
export function WorkoutExecutionPage({ workoutId, onFinish, user }) {
    // --- INTEGRAÇÃO DE HOOKS ---
    const {
        loading,
        saving,
        error,
        setError,
        template,
        exercises,
        initialElapsed,
        updateExerciseSet,
        updateNotes,
        completeSetAutoFill,
        finishSession,
        syncSession,
        discardSession,
        updateSetMultiple,
        toggleExerciseWeightMode
    } = useWorkoutSession(workoutId, user);


    // --- ESTADO DA UI ---
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [showOneRM, setShowOneRM] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    const [isFinished, setIsFinished] = useState(false); // Previne "Sessões Zumbis"
    const [newAchievements, setNewAchievements] = useState([]);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [restDuration, setRestDuration] = useState(90);

    // --- CARREGAR PREFERÊNCIAS DO USUÁRIO ---
    useEffect(() => {
        if (user?.uid) {
            userService.getUserProfile(user.uid).then(profile => {
                if (profile?.defaultRestTime) {
                    setRestDuration(profile.defaultRestTime);
                }
            }).catch(console.error);
        }
    }, [user?.uid]);

    // --- PERSISTIR PREFERÊNCIA ---
    const handleRestDurationChange = (newDuration) => {
        setRestDuration(newDuration);
        if (user?.uid) {
            // Atualização "fire and forget"
            userService.updateUserProfile(user.uid, { defaultRestTime: newDuration })
                .catch(err => console.error("Failed to save rest preference:", err));
        }
    };

    // Rolar para o topo quando o Modo Foco é ativado
    // Rolar para o topo quando o Modo Foco é ativado
    useEffect(() => {
        if (focusMode) {
            // Força o scroll suave para o topo
            const forceScroll = () => window.scrollTo({ top: 0, behavior: 'smooth' });

            forceScroll();
            // Pequeno delay para garantir que o layout atualizou
            setTimeout(forceScroll, 300);
        }
    }, [focusMode]);

    const {
        elapsedSeconds,
        setElapsedSeconds,
        // formatTime // Não utilizado atualmente, mas disponível
    } = useWorkoutTimer(!loading && !saving && !isFinished, initialElapsed); // Parar timer ao finalizar

    // Sincronizar tempo decorrido do hook quando carregado
    useEffect(() => {
        if (initialElapsed > 0 && elapsedSeconds === 0) {
            setElapsedSeconds(initialElapsed);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialElapsed]);

    // Efeito de Sincronização Contínua
    useEffect(() => {
        if (!loading && exercises.length > 0 && !isFinished) {
            syncSession(exercises, elapsedSeconds);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [exercises, elapsedSeconds, loading, isFinished]);


    // --- FOCUS NAVIGATION STATE ---
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [activeSetIndices, setActiveSetIndices] = useState({});

    const handleSetNavigation = (exerciseId, setIndex) => {
        setActiveSetIndices(prev => ({
            ...prev,
            [exerciseId]: setIndex
        }));
    };

    const navigate = (path) => { if (path === -1 && onFinish) onFinish(); };
    const routerNavigate = (path) => { window.location.href = path; }; // Simple redirect for now or use context if available

    // --- AÇÕES ---
    const handleNextExercise = () => {
        if (currentExerciseIndex < exercises.length - 1) setCurrentExerciseIndex(prev => prev + 1);
    };
    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) setCurrentExerciseIndex(prev => prev - 1);
    };

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showConfirmFinishModal, setShowConfirmFinishModal] = useState(false);

    const handleDiscard = () => {
        setShowCancelModal(true);
    };

    const confirmDiscard = async () => {
        setIsFinished(true); // Parar sincronização
        await discardSession();
        window.location.href = "/"; // Forçar navegação para home
    };

    const handleFinishWorkout = async () => {
        setIsFinished(true); // Parar sincronização imediatamente
        const success = await finishSession(elapsedSeconds);
        if (success) {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });

            // Verificar novas conquistas
            if (user) {
                const sessionPayload = {
                    id: 'temp_current',
                    completedAt: new Date(),
                    exercises: exercises,
                    elapsedSeconds: elapsedSeconds,
                    userId: user.uid
                };

                checkNewAchievements(user.uid, sessionPayload, workoutService).then(unlocked => {
                    if (unlocked && unlocked.length > 0) {
                        setNewAchievements(unlocked);
                        setShowAchievementModal(true);
                    } else {
                        setTimeout(() => setShowFinishModal(true), 800);
                    }
                });
            } else {
                setTimeout(() => setShowFinishModal(true), 800);
            }
        } else {
            setIsFinished(false); // Reativar se falhar
        }
    };

    // --- COMPARTILHAMENTO ---
    const [sharing, setSharing] = useState(false);
    const shareCardRef = useRef(null);

    const handleShare = async () => {
        if (!shareCardRef.current) return;

        // Verificação de Segurança: API Files requer Contexto Seguro (HTTPS ou localhost)
        if (!window.isSecureContext) {
            alert("O compartilhamento requer conexão segura (HTTPS).\n\nSe você está testando localmente via IP, use 'localhost' ou configure SSL.");
            return;
        }

        setSharing(true);
        try {
            const canvas = await html2canvas(shareCardRef.current, {
                backgroundColor: '#020617',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                ignoreElements: (element) => {
                    // Ignora folhas de estilo globais para evitar erro de parsing 'oklch'
                    // Queremos apenas estilos inline do próprio componente
                    return element.tagName.toLowerCase() === 'link' && element.rel === 'stylesheet' ||
                        element.tagName.toLowerCase() === 'style';
                }
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setError('Erro ao gerar imagem.');
                    setSharing(false);
                    return;
                }

                const file = new File([blob], 'treino_concluido.png', { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'Treino Concluído - Vitalitá',
                            text: `Acabei de completar o treino ${template?.name || 'Personalizado'}! 💪`,
                            files: [file]
                        });
                        setSharing(false);
                        return;
                    } catch (shareErr) {
                        if (shareErr.name === 'AbortError') {
                            setSharing(false);
                            return;
                        }
                    }
                }

                // Fallback
                try {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vitalita_treino_${new Date().toISOString().slice(0, 10)}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setError(null);
                } catch {
                    setError('Não foi possível salvar a imagem.');
                }
                setSharing(false);
            }, 'image/png');
        } catch (err) {
            console.error(err);
            setError(`Erro ao gerar imagem: ${err.message || err}`);
            setSharing(false);
        }
    };


    // --- RENDERIZAÇÃO ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] p-4 font-sans max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center py-4">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-16 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                    </div>
                </div>
                <div className="h-10"></div>
                <Skeleton className="h-32 w-full rounded-3xl" />
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-64 w-full rounded-3xl" />
                </div>
            </div>
        );
    }

    const completedExercisesCount = exercises.filter(ex => ex.sets.every(s => s.completed)).length;
    const totalExercises = exercises.length;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 p-4 pb-32 font-sans selection:bg-cyan-500/30">
            {/* ACHIEVEMENT MODAL */}
            {showAchievementModal && newAchievements.length > 0 && (
                <AchievementUnlockedModal
                    achievements={newAchievements}
                    onClose={() => {
                        setShowAchievementModal(false);
                        setShowFinishModal(true);
                    }}
                />
            )}

            {showFinishModal && !showAchievementModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div>
                        <ShareableWorkoutCard
                            ref={shareCardRef}
                            templateName={template?.name}
                            durationSeconds={elapsedSeconds}
                            exercises={exercises}
                            date={new Date()}
                            userName={user?.displayName || 'Atleta'}
                        />
                    </div>

                    <div className="absolute bottom-10 left-0 right-0 px-4 flex flex-col gap-3">
                        <Button
                            onClick={handleShare}
                            className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20"
                            disabled={sharing}
                        >
                            {sharing ? 'Gerando Imagem...' : (
                                <span className="flex items-center justify-center gap-2">
                                    <Share2 size={20} /> Compartilhar Treino
                                </span>
                            )}
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/'}
                            variant="secondary"
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider rounded-xl"
                        >
                            Voltar ao Início
                        </Button>
                    </div>
                </div>
            )}
            {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
            <div className="max-w-2xl mx-auto space-y-6">

                <div
                    className="
                        fixed top-0 left-0 right-0 z-50 pointer-events-none
                        bg-slate-950/80
                        backdrop-blur-xl
                        border-b border-white/5
                        shadow-2xl shadow-black/40
                        rounded-b-3xl
                    "
                    style={{
                        paddingTop: 'env(safe-area-inset-top)',
                        height: 'auto'
                    }}
                >
                    <div className="
                        relative mx-auto max-w-2xl
                        px-4 py-3
                        pointer-events-auto
                    ">
                        {/* Ambient glow effect (Full Height) */}
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none rounded-b-3xl" />

                        <div className="relative z-10 flex items-center justify-between gap-2">
                            {/* Left side - Back button */}
                            <TopBarButton
                                icon={<ArrowLeft />}
                                label="VOLTAR"
                                variant="primary"
                                onClick={() => navigate(-1)}
                                isBack={true}
                            />

                            {/* Right side - Action buttons */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 mask-linear-fade flex-1 justify-end min-w-0 pl-2">
                                <TopBarButton
                                    icon={<Trash2 />}
                                    label="CANCELAR"
                                    variant="danger"
                                    onClick={handleDiscard}
                                />

                                <TopBarButton
                                    icon={<Timer />}
                                    label="TIMER"
                                    active={showTimer}
                                    onClick={() => setShowTimer(!showTimer)}
                                />

                                <TopBarButton
                                    icon={<Activity />}
                                    label="1RM"
                                    active={showOneRM}
                                    onClick={() => setShowOneRM(!showOneRM)}
                                />

                                <TopBarButton
                                    icon={<Eye />}
                                    label="FOCO"
                                    active={focusMode}
                                    onClick={() => setFocusMode(!focusMode)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ height: 'calc(85px + env(safe-area-inset-top))' }}></div>

                {focusMode && (
                    <div className="px-4 mb-4 mt-2 flex items-center justify-between pointer-events-auto relative z-40">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handlePrevExercise}
                            disabled={currentExerciseIndex === 0}
                            leftIcon={<ChevronLeft size={16} />}
                            className="backdrop-blur-md"
                        >
                            Anterior
                        </Button>

                        <span className="text-sm font-bold text-slate-400">
                            {currentExerciseIndex + 1} de {totalExercises}
                        </span>

                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleNextExercise}
                            disabled={currentExerciseIndex === totalExercises - 1}
                            rightIcon={<ChevronRight size={16} />}
                            className="backdrop-blur-md"
                        >
                            Próximo
                        </Button>
                    </div>
                )}

                <div className="px-4 mb-2">
                    <ProgressCard completedCount={completedExercisesCount} totalCount={totalExercises} />
                </div>


                <main className="px-4 pb-32 space-y-4">
                    {focusMode ? (
                        exercises.length > 0 && (() => {
                            const ex = exercises[currentExerciseIndex];
                            const firstIncomplete = ex.sets.findIndex(s => !s.completed);
                            const defaultActive = firstIncomplete !== -1 ? firstIncomplete : ex.sets.length - 1;
                            const activeSetIdx = activeSetIndices[ex.id] !== undefined ? activeSetIndices[ex.id] : defaultActive;
                            const safeIdx = Math.max(0, Math.min(activeSetIdx, ex.sets.length - 1));
                            const activeSet = ex.sets[safeIdx];

                            return (
                                <LinearCardCompactV2
                                    key={ex.id}
                                    exerciseId={ex.id}
                                    setId={activeSet.id}
                                    exerciseName={ex.name}
                                    muscleGroup={ex.muscleFocus?.primary || ex.group || 'Geral'}
                                    method={ex.method || "Convencional"}
                                    repsGoal={ex.reps || (ex.target ? ex.target.replace(/^\d+\s*x\s*/i, '').trim() : "12")}
                                    currentSet={safeIdx + 1}
                                    totalSets={ex.sets.length}
                                    completedSets={ex.sets.map(s => s.completed)}
                                    weight={activeSet.weight}
                                    actualReps={activeSet.reps}
                                    observation={ex.notes}
                                    suggestedWeight={activeSet.targetWeight || activeSet.weight}
                                    suggestedReps={activeSet.targetReps || ex.reps || (ex.target ? ex.target.replace(/^\d+\s*x\s*/i, '').trim() : "12")}
                                    lastWeight={activeSet.lastWeight}
                                    lastReps={activeSet.lastReps}
                                    weightMode={activeSet.weightMode || 'total'}
                                    baseWeight={activeSet.baseWeight}
                                    onUpdateSet={updateExerciseSet}
                                    onUpdateSetMultiple={updateSetMultiple}
                                    onSetChange={(setNum) => handleSetNavigation(ex.id, setNum - 1)}
                                    onMethodClick={() => setSelectedMethod(ex.method)}
                                    onCompleteSet={completeSetAutoFill}
                                    onUpdateNotes={updateNotes}
                                    onToggleWeightMode={() => toggleExerciseWeightMode(ex.id)}
                                />
                            );
                        })()
                    ) : (
                        exercises.map((ex) => {
                            const firstIncomplete = ex.sets.findIndex(s => !s.completed);
                            const defaultActive = firstIncomplete !== -1 ? firstIncomplete : ex.sets.length - 1;
                            const activeSetIdx = activeSetIndices[ex.id] !== undefined ? activeSetIndices[ex.id] : defaultActive;
                            const safeIdx = Math.max(0, Math.min(activeSetIdx, ex.sets.length - 1));
                            const activeSet = ex.sets[safeIdx];

                            return (
                                <LinearCardCompactV2
                                    key={ex.id}
                                    exerciseId={ex.id}
                                    setId={activeSet.id}
                                    exerciseName={ex.name}
                                    muscleGroup={ex.muscleFocus?.primary || ex.group || 'Geral'}
                                    method={ex.method || "Convencional"}
                                    repsGoal={ex.reps || (ex.target ? ex.target.replace(/^\d+\s*x\s*/i, '').trim() : "12")}
                                    currentSet={safeIdx + 1}
                                    totalSets={ex.sets.length}
                                    completedSets={ex.sets.map(s => s.completed)}
                                    weight={activeSet.weight}
                                    actualReps={activeSet.reps}
                                    observation={ex.notes}
                                    suggestedWeight={activeSet.targetWeight || activeSet.weight}
                                    suggestedReps={activeSet.targetReps || ex.reps || (ex.target ? ex.target.replace(/^\d+\s*x\s*/i, '').trim() : "12")}
                                    lastWeight={activeSet.lastWeight}
                                    lastReps={activeSet.lastReps}
                                    weightMode={activeSet.weightMode || 'total'}
                                    baseWeight={activeSet.baseWeight}
                                    onUpdateSet={updateExerciseSet}
                                    onUpdateSetMultiple={updateSetMultiple}
                                    onSetChange={(setNum) => handleSetNavigation(ex.id, setNum - 1)}
                                    onMethodClick={() => setSelectedMethod(ex.method)}
                                    onCompleteSet={completeSetAutoFill}
                                    onUpdateNotes={updateNotes}
                                    onToggleWeightMode={() => toggleExerciseWeightMode(ex.id)}
                                />
                            );
                        })
                    )}
                </main>

                {showTimer && (
                    <RestTimer
                        initialTime={restDuration}
                        isOpen={showTimer}
                        onClose={() => setShowTimer(false)}
                        onDurationChange={handleRestDurationChange}
                    />
                )}

                <MethodModal
                    methodName={selectedMethod}
                    onClose={() => setSelectedMethod(null)}
                />

                {/* MODAL DE CANCELAMENTO */}
                {showCancelModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-xs bg-[#0f172a] border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-white mb-2">Cancelar Treino?</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Todo o progresso deste treino será perdido e não poderá ser recuperado.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowCancelModal(false)}
                                    variant="ghost"
                                    className="flex-1 h-10 text-slate-300 hover:text-white hover:bg-slate-800"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={confirmDiscard}
                                    variant="danger"
                                    className="flex-1 h-10 bg-red-500/5 text-red-400 border border-red-500/30 hover:bg-red-500/10 shadow-none hover:shadow-none"
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL DE CONFIRMAÇÃO DE FINALIZAÇÃO */}
                {showConfirmFinishModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-xs bg-[#0f172a] border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-bold text-white mb-2">Finalizar Treino?</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Tem certeza que deseja encerrar o treino agora? Certifique-se de que registrou todas as séries.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowConfirmFinishModal(false)}
                                    variant="ghost"
                                    className="flex-1 h-10 text-slate-300 hover:text-white hover:bg-slate-800"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowConfirmFinishModal(false);
                                        handleFinishWorkout();
                                    }}
                                    variant="success"
                                    className="flex-1 h-10 bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 shadow-none hover:shadow-none"
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {showFinishModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-sm bg-[#0f172a] border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>

                            <div className="text-center space-y-4 relative z-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20 mb-2">
                                    <Check size={32} className="text-white" strokeWidth={3} />
                                </div>

                                <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Treino Concluído!</h3>
                                <p className="text-slate-400 text-sm">
                                    Parabéns! Todo o esforço vale a pena. Que tal compartilhar essa conquista?
                                </p>

                                <div className="pt-4 space-y-3">
                                    <Button
                                        onClick={handleShare}
                                        disabled={sharing}
                                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                                    >
                                        {sharing ? 'Gerando...' : (
                                            <>
                                                <Share2 size={18} />
                                                Compartilhar seu treino!
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            if (onFinish) onFinish();
                                        }}
                                        variant="ghost"
                                        className="w-full h-12 text-slate-400 hover:text-white"
                                    >
                                        Fechar e Sair
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Fim de Treino */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#020617] to-transparent z-50">
                    <div className="max-w-2xl mx-auto flex justify-center">
                        <div className="space-y-4 w-full flex flex-col items-center pointer-events-auto relative z-10">
                            <Button
                                onClick={() => setShowConfirmFinishModal(true)}
                                disabled={saving}
                                variant="success"
                                className="w-auto min-w-[240px] px-8 font-bold h-12 rounded-2xl tracking-wide flex items-center justify-center gap-2"
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

            </div>

            <ShareableWorkoutCard
                ref={shareCardRef}
                session={{
                    templateName: template?.name || 'Treino Personalizado',
                    duration: Math.floor(elapsedSeconds / 60) + "min",
                    exercisesCount: completedExercisesCount,
                    volumeLoad: (() => {
                        let vol = 0;
                        exercises.forEach(ex => {
                            ex.sets.forEach(s => {
                                // Lógica Padrão de Carga de Volume (Tonelagem):
                                // 5kg x 10 reps = 50kg movidos.
                                if (s.completed) vol += (Number(s.weight) * Number(s.reps));
                            });
                        });
                        return vol;
                    })()
                }}
                userName={user?.displayName || "Atleta"}
            />
        </div >
    );
}

// Remove legacy helper functions and subcomponents that were moved or unused
