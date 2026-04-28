/**
 * WorkoutExecutionPage.jsx
 * A interface principal de rastreamento de treinos.
 * Gerencia estado da sessão ativa, cronômetro, registro de séries e navegação de exercícios no 'Modo Foco'.
 * REFATORADO: Usa useWorkoutTimer e useWorkoutSession.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import {
    ChevronLeft,
    RotateCw,
    Check,
    CheckCircle2,
    Timer,
    Dumbbell,
    Eye,
    ChevronRight,
    Share2,
    RotateCcw,
    Trash2,
    ArrowLeft
} from 'lucide-react';
import { RestTimer } from '../components/execution/RestTimer';
// import { MuscleFocusDisplay } from '../components/execution/MuscleFocusDisplay'; // Unused
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
import { userService } from '../services/userService';
import { workoutService } from '../services/workoutService';
const AchievementUnlockedModal = React.lazy(() => import('../components/achievements/AchievementUnlockedModal').then(module => ({ default: module.AchievementUnlockedModal })));
const loadShareableWorkoutCard = () => import('../components/sharing/ShareableWorkoutCard').then(module => ({ default: module.ShareableWorkoutCard }));
const ShareableWorkoutCard = React.lazy(loadShareableWorkoutCard);
const shareCardBgSrc = '/bg-share-dumbbells.jpg';

const preloadedImages = new Map();

function preloadImage(src) {
    if (!src || typeof window === 'undefined') return Promise.resolve();
    if (preloadedImages.has(src)) return preloadedImages.get(src);

    const preloadPromise = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // CRITICAL: Match the component's crossOrigin to stop Safari caching conflicts
        let settled = false;
        const finish = () => {
            if (settled) return;
            settled = true;
            img.onload = null;
            img.onerror = null;
            resolve();
        };

        img.onload = finish;
        img.onerror = finish;
        img.src = src;

        if (img.complete) finish();
    });

    preloadedImages.set(src, preloadPromise);
    return preloadPromise;
}

const TopBarButton = ({ icon, label, variant = 'default', onClick, active, isBack = false, prominence = 'compact' }) => {
    // Estilos base: "Voltar" recebe tamanho padrão; ações podem ser compactas ou destacadas.
    const sizeStyles = isBack
        ? "px-3 py-2 text-xs"
        : prominence === 'large'
            ? "px-3.5 py-2 text-[11px] tracking-wide min-h-9"
            : "px-2 py-1.5 text-[9px] tracking-tight";

    const baseStyles = `flex items-center gap-1 rounded-lg font-bold uppercase transition-all duration-300 border backdrop-blur-md whitespace-nowrap ${sizeStyles}`;
    const iconSize = isBack ? 16 : prominence === 'large' ? 15 : 13;

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
            {React.cloneElement(icon, { size: iconSize, strokeWidth: 2.5 })}
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
    const [frozenSession, setFrozenSession] = useState(null); // Frozen data for summary
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showTimer, setShowTimer] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [focusMode, setFocusMode] = useState(false);
    const [isFinished, setIsFinished] = useState(false); // Previne "Sessões Zumbis"
    const [isFinishingSession, setIsFinishingSession] = useState(false);
    const [newAchievements, setNewAchievements] = useState([]);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [restDuration, setRestDuration] = useState(90);
    const [autoStartTimer, setAutoStartTimer] = useState(false);

    // Aquece recursos de compartilhamento para evitar atraso no modal final.
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        let cancelled = false;
        let idleId = null;
        let timerId = null;

        const warmupShareResources = () => {
            if (cancelled) return;
            Promise.allSettled([
                loadShareableWorkoutCard(),
                import('html-to-image'),
                preloadImage(shareCardBgSrc),
                preloadImage('/pwa-192x192.png')
            ]).catch(() => undefined);
        };

        if ('requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(warmupShareResources, { timeout: 1800 });
        } else {
            timerId = window.setTimeout(warmupShareResources, 900);
        }

        return () => {
            cancelled = true;
            if (idleId !== null && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId);
            }
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
        };
    }, []);

    // --- CARREGAR PREFERÊNCIAS DO USUÁRIO ---
    useEffect(() => {
        if (user?.uid) {
            userService.getUserProfile(user.uid)
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
            userService
                .updateUserProfile(user.uid, { defaultRestTime: newDuration })
                .catch(err => console.error("Failed to save rest preference:", err));
        }
    };

    const handleAutoStartChange = (newVal) => {
        setAutoStartTimer(newVal);
        if (user?.uid) {
            userService
                .updateUserProfile(user.uid, { autoStartTimer: newVal })
                .catch(err => console.error("Failed to save auto start preference:", err));
        }
    };

    const handleCompleteSetWrapper = (...args) => {
        completeSetAutoFill(...args);
        if (autoStartTimer) {
            setShowTimer(true);
        }

        const [exerciseId, currentSetNum] = args;
        const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
        
        if (exerciseIndex !== -1) {
            const ex = exercises[exerciseIndex];
            // Verifica se a série concluída é a última série deste exercício
            if (currentSetNum === ex.sets.length) {
                setTimeout(() => {
                    if (focusMode) {
                        // Modo Foco: avançar para o próximo exercício
                        if (currentExerciseIndex < exercises.length - 1) {
                            setCurrentExerciseIndex(prev => prev + 1);
                        }
                    } else {
                        // Modo Normal: rolar até o próximo exercício
                        if (exerciseIndex < exercises.length - 1) {
                            const nextExerciseId = exercises[exerciseIndex + 1].id;
                            const nextElement = document.getElementById(`exercise-${nextExerciseId}`);
                            if (nextElement) {
                                const yOffset = -100; // Ajuste para a barra superior fixa
                                const y = nextElement.getBoundingClientRect().top + window.scrollY + yOffset;
                                window.scrollTo({ top: y, behavior: 'smooth' });
                            }
                        }
                    }
                }, 400); // Pequeno delay para a animação da série concluída
            }
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
    }, [initialElapsed, elapsedSeconds, setElapsedSeconds]);

    // Efeito de Sincronização Contínua
    useEffect(() => {
        if (!loading && exercises.length > 0 && !isFinished) {
            syncSession(exercises, elapsedSeconds);
        }
    }, [exercises, elapsedSeconds, loading, isFinished, syncSession]);


    // --- FOCUS NAVIGATION STATE ---
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [activeSetIndices, setActiveSetIndices] = useState({});

    const handleSetNavigation = (exerciseId, setIndex) => {
        setActiveSetIndices(prev => ({
            ...prev,
            [exerciseId]: setIndex
        }));
    };



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
        console.log("DEBUG: handleFinishWorkout started");
        setIsFinishingSession(true);

        setFrozenSession({
            exercises: JSON.parse(JSON.stringify(exercises)), // Deep clone
            elapsedSeconds
        });

        setIsFinished(true); // Parar sincronização imediatamente
        const success = await finishSession(elapsedSeconds);
        console.log("DEBUG: finishSession result:", success);
        
        if (success) {
            const { default: confetti } = await import('canvas-confetti');
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });

            if (user) {
                console.log("DEBUG: Checking achievements for user", user.uid);
                const sessionPayload = {
                    id: 'temp_current',
                    completedAt: new Date(),
                    exercises: exercises,
                    elapsedSeconds: elapsedSeconds,
                    userId: user.uid
                };

                try {
                    const unlocked = await checkNewAchievements(user.uid, sessionPayload, workoutService);
                    setIsFinishingSession(false);
                    if (unlocked && unlocked.length > 0) {
                        setNewAchievements(unlocked);
                        setShowAchievementModal(true);
                    } else {
                        setShowFinishModal(true);
                    }
                } catch (err) {
                    console.error("DEBUG: checkNewAchievements error", err);
                    setIsFinishingSession(false);
                    setShowFinishModal(true);
                }
            } else {
                setIsFinishingSession(false);
                setShowFinishModal(true);
            }
        } else {
            console.error("DEBUG: finishSession returned false");
            setIsFinishingSession(false);
            setIsFinished(false); // Reativar se falhar
            setFrozenSession(null);
        }
    };

    // --- COMPARTILHAMENTO ---
    const [sharing, setSharing] = useState(false);
    const shareCardRef = useRef(null);

    const handleShare = async () => {
        if (sharing) return;
        if (!shareCardRef.current) {
            setError("Card de compartilhamento indisponível.");
            return;
        }

        // Verificação de Segurança: API Files requer Contexto Seguro (HTTPS ou localhost)
        if (!window.isSecureContext) {
            alert("O compartilhamento requer conexão segura (HTTPS).\n\nSe você está testando localmente via IP, use 'localhost' ou configure SSL.");
            return;
        }

        setSharing(true);
        try {
            // Wait for render and font load (with safety timeouts to avoid hangs)
            const waitWithTimeout = async (promise, timeoutMs = 2000) => {
                try {
                    await Promise.race([
                        promise,
                        new Promise(resolve => setTimeout(resolve, timeoutMs))
                    ]);
                } catch {
                    // Ignore font/image load errors and proceed
                }
            };

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            if (document.fonts && document.fonts.ready) {
                await waitWithTimeout(document.fonts.ready, 2000);
            }

            // Pega o Canvas montado (já nativo!)
            const canvas = shareCardRef.current;
            if (!canvas || !canvas.toBlob) {
                throw new Error('Canvas não disponível para exportação.');
            }

            // Extrai a imagem hiper rápida
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((b) => {
                    if (b) resolve(b);
                    else reject(new Error('Falha gerar blob do canvas'));
                }, 'image/jpeg', 0.88);
            });

            const file = new File([blob], 'treino_concluido.jpg', { type: 'image/jpeg' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Treino Concluído!',
                        text: `Acabei de completar o treino ${template?.name || 'Personalizado'}! 💪`,
                        files: [file]
                    });
                    return;
                } catch (err) {
                    if (err?.name === 'AbortError') {
                        return;
                    }
                    console.warn('Share failed, falling back to download:', err);
                }
            }

            // Fallback de download
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `treino_${new Date().toISOString().slice(0, 10)}.jpg`;
            link.href = blobUrl;
            link.click();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Error sharing:", err);
            setError("Erro ao gerar imagem de compartilhamento."); // Using existing setError
        } finally {
            setSharing(false);
        }
    };

    // Use frozen data if finished, otherwise live data
    const displayExercises = frozenSession?.exercises || exercises;
    const displayElapsed = frozenSession?.elapsedSeconds || elapsedSeconds;

    // --- RENDERIZAÇÃO ---
    // If finished, we ignore loading state to keep the Summary/Modal visible
    if (loading && !isFinished && !frozenSession) {
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

    const completedExercisesCount = displayExercises.filter(ex => ex.sets.every(s => s.completed)).length;
    const totalExercises = displayExercises.length;

    const sessionData = {
        templateName: template?.name || 'Treino Personalizado',
        duration: Math.floor(displayElapsed / 60) + "min",
        exercisesCount: completedExercisesCount,
        volumeLoad: displayExercises.reduce((acc, ex) => {
            return acc + ex.sets.reduce((sAcc, s) => {
                if (!s.completed) return sAcc;
                if (s.drops && s.drops.length > 0) {
                    return sAcc + s.drops.reduce((dAcc, d) => {
                        const dw = parseFloat((d.weight || '').toString().replace(',', '.')) || 0;
                        const dr = parseFloat((d.reps || '').toString().replace(',', '.')) || 0;
                        return dAcc + (dw * dr);
                    }, 0);
                }
                const weightStr = (s.weight || '').toString().replace(',', '.');
                const repsStr = (s.reps || '').toString().replace(',', '.');
                const w = parseFloat(weightStr) || 0;
                const r = parseFloat(repsStr) || 0;
                return sAcc + (w * r);
            }, 0);
        }, 0)
    };

    return (
        <div className={`min-h-screen bg-[#020617] text-slate-100 p-4 pb-40 font-sans selection:bg-cyan-500/30`}>
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
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl animate-in fade-in overflow-y-auto">
                    <div className="min-h-full flex flex-col items-center justify-center p-4">
                        <div className="w-full max-w-md flex flex-col items-center space-y-4 my-auto">
                            <div className="origin-top scale-[0.85] sm:scale-100 -mb-[92px] sm:mb-0">
                                <React.Suspense fallback={
                                    <div className="h-96 w-full rounded-3xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
                                }>
                                    <ShareableWorkoutCard
                                        ref={shareCardRef}
                                        session={sessionData}
                                        userName={user?.displayName || 'Atleta'}
                                        isVisible={true}
                                    />
                                </React.Suspense>
                            </div>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={handleShare}
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
                                    onClick={() => {
                                        if (onFinish) onFinish();
                                        else window.location.href = '/';
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
                                onClick={() => onFinish()}
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
                                    prominence="large"
                                    onClick={() => setShowTimer(!showTimer)}
                                />

                                <TopBarButton
                                    icon={<Eye />}
                                    label="FOCO"
                                    active={focusMode}
                                    prominence="large"
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

                {!focusMode && (
                    <div className="px-4 mb-2">
                        <ProgressCard completedCount={completedExercisesCount} totalCount={totalExercises} />
                    </div>
                )}

                <main className={`px-4 space-y-4`}>
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
                                    drops={activeSet.drops}
                                    onUpdateSet={updateExerciseSet}
                                    onUpdateSetMultiple={updateSetMultiple}
                                    onSetChange={(setNum) => handleSetNavigation(ex.id, setNum - 1)}
                                    onMethodClick={() => setSelectedMethod(ex.method)}
                                    onCompleteSet={handleCompleteSetWrapper}
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
                                <div id={`exercise-${ex.id}`} key={ex.id}>
                                    <LinearCardCompactV2
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
                                    drops={activeSet.drops}
                                    onUpdateSet={updateExerciseSet}
                                    onUpdateSetMultiple={updateSetMultiple}
                                    onSetChange={(setNum) => handleSetNavigation(ex.id, setNum - 1)}
                                    onMethodClick={() => setSelectedMethod(ex.method)}
                                    onCompleteSet={handleCompleteSetWrapper}
                                    onUpdateNotes={updateNotes}
                                        onToggleWeightMode={() => toggleExerciseWeightMode(ex.id)}
                                    />
                                </div>
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
                        autoStartTimer={autoStartTimer}
                        onAutoStartChange={handleAutoStartChange}
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




                {/* Footer Fim de Treino - Apenas mostra se o modal de finalização NÃO estiver visível */}
                {!showFinishModal && (
                    <div className="w-full mt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
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

// Remove legacy helper functions and subcomponents that were moved or unused
