/**
 * WorkoutExecutionPage.jsx
 * A interface principal de rastreamento de treinos.
 * Gerencia estado da sessão ativa, cronômetro, registro de séries e navegação de exercícios no 'Modo Foco'.
 */
import React, { useState, useEffect, useRef } from 'react';

import {
    ChevronLeft,
    MoreVertical,
    Clock,
    Play,
    Pause,
    RotateCcw,
    Check,
    CheckCircle2,
    Activity,
    X,
    ChevronDown,
    ChevronUp,
    Edit2,
    Video,
    History,
    TrendingUp,
    Zap,
    AlertCircle,
    Trash2,
    Timer,
    Dumbbell,
    Eye,
    ChevronRight,
    Repeat,
    RotateCw,
    Settings
} from 'lucide-react';
import { RestTimer } from './components/execution/RestTimer';
import { MuscleFocusDisplay } from './components/execution/MuscleFocusDisplay';
import { OneRMDisplay } from './components/execution/OneRMDisplay';
import { db } from './firebaseConfig';
import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    deleteDoc
} from 'firebase/firestore';
import { RippleButton } from './components/design-system/RippleButton';
import { Button } from './components/design-system/Button';
import { CyanSystemButton } from './components/design-system/CyanSystemButton';
import MethodModal from './MethodModal';
import { LinearCardCompactV2 } from './components/execution/LinearCardCompactV2';


const DRAFT_COLLECTION = 'workout_session_drafts';


// --- HELPER DICTIONARY GEN ID ---
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

const toNumber = (value) => {
    if (typeof value === 'number') return value;
    const n = Number(value);
    if (Number.isNaN(n)) return 0;
    return n;
};

// --- SUBCOMPONENT: STEPPER CONTROL ---
function Stepper({ label, value, onChange, step = 1, suffix = '' }) {
    const handleIncrement = () => onChange(Number(value) + step);
    const handleDecrement = () => onChange(Math.max(0, Number(value) - step));

    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-400 font-bold ml-1">{label}</span>
            <div className="flex items-center gap-3">
                <RippleButton
                    onClick={handleDecrement}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                >
                    <ChevronDown size={20} className="rotate-90" /> {/* Minus appearance */}
                </RippleButton>

                <div className="bg-slate-200 text-slate-900 font-bold text-lg h-10 min-w-[30px] px-4 rounded-full flex items-center justify-center border border-slate-300">
                    {value}{suffix}
                </div>

                <RippleButton
                    onClick={handleIncrement}
                    className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                >
                    <ChevronUp size={20} className="rotate-90" /> {/* Plus appearance */}
                </RippleButton>
            </div>
        </div>
    );
}

// --- SUBCOMPONENT: EXERCISE CARD (Legacy Stepper Design) ---
function ExerciseCard({ exercise, onUpdateSet, onToggleSet, onUpdateNotes, onAddSet, onRemoveSet, inputClassName = "bg-slate-200 text-slate-900" }) {
    // Determine initial active set (first incomplete)
    const firstIncomplete = exercise.sets.findIndex(s => !s.completed);
    const activeSetIdx = firstIncomplete !== -1 ? firstIncomplete : 0;
    const activeSet = exercise.sets[activeSetIdx];
    const isExerciseComplete = exercise.sets.length > 0 && exercise.sets.every(s => s.completed);

    // Confetti Logic Removed
    const hasCelebrated = useRef(false);

    useEffect(() => {
        // Confetti removed
    }, [isExerciseComplete]);

    if (!activeSet) return null;

    return (
        <div className={`bg-[#0f172a] rounded-3xl p-5 border border-slate-800 relative overflow-hidden transition-all ${isExerciseComplete ? 'opacity-75 border-emerald-500/30' : ''}`}>

            {/* Header Row */}
            <div className="flex items-start gap-4 mb-4">
                {/* Checkbox Main - Toggles ACTIVE set */}
                <button
                    onClick={() => onToggleSet(exercise.id, activeSet.id)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${activeSet.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-cyan-500'}`}
                >
                    {activeSet.completed && <Check size={20} className="text-white" strokeWidth={4} />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{exercise.muscleFocus?.primary || exercise.group}</p>
                            <h3 className="text-xl font-bold text-white mb-1 leading-tight">{exercise.name}</h3>
                        </div>
                        {/* Badge */}
                        {exercise.method && (
                            <div
                                onClick={() => {
                                    console.log('Method Clicked:', exercise.method);
                                    setSelectedMethod(exercise.method);
                                }}
                                className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-wider ml-2 cursor-pointer hover:bg-cyan-500/20 active:scale-95 transition-all"
                            >
                                {exercise.method}
                            </div>
                        )}
                    </div>

                    {/* SETS BUBBLES INDICATOR */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {exercise.sets.map((s, idx) => {
                            const isActive = s.id === activeSet.id;
                            const isCompleted = s.completed;
                            return (
                                <div
                                    key={s.id}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all cursor-pointer
                                        ${isActive ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900 scale-110' : ''}
                                        ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : isActive ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}
                                    `}
                                    onClick={() => onUpdateSet(exercise.id, s.id, 'weight', s.weight) /* Dummy update to trigger re-render if needed, actually just need a way to SELECT active set. 
                                    Wait, my previous bubble implementation didn't have onClick. Adding it now to allow selection if user wants. 
                                    But 'onUpdateSet' requires field/value. 
                                    Actually I need 'onSelectSet' or similar. 
                                    Function signature doesn't have it.
                                    Let's skip click for now unless strictly needed, sticking to visual only as requested "visual".
                                    */
                                    }
                                >
                                    {idx + 1}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Steppers Area */}
            <div className="flex items-center justify-between gap-4 mb-6 px-1">
                {/* Weight Stepper */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-bold ml-1">Peso (kg)</span>
                    <div className="flex items-center gap-3">
                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'weight', Math.max(0, Number(activeSet.weight || 0) - 1))}
                            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-xl font-bold mb-1">-</span>
                        </RippleButton>

                        <div className={`${inputClassName} font-bold text-lg h-10 w-[70px] rounded-full flex items-center justify-center border border-slate-300 shadow-inner`}>
                            {activeSet.weight || 0}
                        </div>

                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'weight', Number(activeSet.weight || 0) + 1)}
                            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-xl font-bold mb-1">+</span>
                        </RippleButton>
                    </div>
                </div>

                {/* Reps Stepper */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-bold ml-1">Repetições</span>
                    <div className="flex items-center gap-3">
                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'reps', Math.max(0, Number(activeSet.reps || 0) - 1))}
                            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-xl font-bold mb-1">-</span>
                        </RippleButton>

                        <div className={`${inputClassName} font-bold text-lg h-10 w-[70px] rounded-full flex items-center justify-center border border-slate-300 shadow-inner`}>
                            {activeSet.reps || 0}
                        </div>

                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'reps', Number(activeSet.reps || 0) + 1)}
                            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-xl font-bold mb-1">+</span>
                        </RippleButton>
                    </div>
                </div>
            </div>

            {/* Notes Area */}
            <div>
                <span className="text-xs text-slate-400 font-bold ml-1 mb-2 block">Observações (opcional)</span>
                <input
                    type="text"
                    value={exercise.notes}
                    onChange={(e) => onUpdateNotes(exercise.id, e.target.value)}
                    placeholder="Ex: Senti bem, pode aumentar peso"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
            </div>

            {/* Smart Action Button - Replaces small footer info */}
            <div className="mt-6">
                <Button
                    variant={isExerciseComplete ? "success" : "primary"}
                    size="lg"
                    fullWidth
                    onClick={() => {
                        if (isExerciseComplete) {
                            // Already done
                        } else {
                            onToggleSet(exercise.id, activeSet.id);
                        }
                    }}
                    className={`h-14 text-lg shadow-lg transition-all duration-500 ${isExerciseComplete
                        ? 'shadow-emerald-500/20'
                        : 'shadow-cyan-500/50'
                        }`}
                    leftIcon={isExerciseComplete ? <CheckCircle2 /> : <Activity className="animate-bounce" />}
                >
                    {isExerciseComplete ? 'Exercício Concluído!' : `Concluir Série ${activeSetIdx + 1}`}
                </Button>
            </div>

            {/* Small info still useful as backup */}
            <div className="mt-3 flex justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {activeSetIdx + 1} de {exercise.sets.length} séries
                </span>
            </div>
        </div>
    );
}

// --- SUBCOMPONENT: PROGRESS CARD ---
function ProgressCard({ completedCount, totalCount }) {
    const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="bg-[#0f172a] rounded-3xl p-6 border border-slate-800 mb-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full border border-cyan-500 flex items-center justify-center">
                    <Check size={8} className="text-cyan-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso do Treino</span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
                {completedCount} de {totalCount} <span className="text-slate-500 text-xl font-normal">exercícios</span>
            </h2>

            {/* Bar */}
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}


// --- MAIN PAGE COMPONENT ---
export function WorkoutExecutionPage({ workoutId, onFinish, user }) {
    const [loading, setLoading] = useState(true);
    const [template, setTemplate] = useState(null);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [exercises, setExercises] = useState([]);
    const [saving, setSaving] = useState(false);

    // Global Toggles
    const [showTimer, setShowTimer] = useState(false);
    const [showOneRM, setShowOneRM] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null); // For method modal
    const [showFocus, setShowFocus] = useState(false);

    // Focus Mode
    const [focusMode, setFocusMode] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [activeSetIndices, setActiveSetIndices] = useState({}); // Stores manually selected set index per exercise

    const handleSetNavigation = (exerciseId, setIndex) => {
        setActiveSetIndices(prev => ({
            ...prev,
            [exerciseId]: setIndex
        }));
    };

    const navigate = (path) => { if (path === -1 && onFinish) onFinish(); };
    const profileId = user?.uid;

    // --- PERSISTENCE: LOCAL STORAGE KEY ---
    const backupKey = `workout_backup_${profileId}_${workoutId}`;

    // --- PERSISTENCE: RESTORE BACKUP OR FETCH DATA ---
    useEffect(() => {
        if (!workoutId || !profileId) return;

        async function fetchData() {
            setLoading(true);
            try {
                // 1. Try to restore from LocalStorage first
                const savedBackup = localStorage.getItem(backupKey);
                let restoredFromBackup = false;

                if (savedBackup) {
                    try {
                        const parsedBackup = JSON.parse(savedBackup);
                        // Check if backup is valid and recent (optional: add expiration logic here)
                        // For now, we trust the user wants to resume if it exists
                        if (parsedBackup.exercises && Array.isArray(parsedBackup.exercises)) {
                            console.log('Restoring from LocalStorage backup');
                            setExercises(parsedBackup.exercises);
                            setElapsedSeconds(parsedBackup.elapsedSeconds || 0);

                            // Load template just for metadata (name, etc) without overwriting exercises
                            const templateDoc = await getDoc(doc(db, 'workout_templates', workoutId));
                            if (templateDoc.exists()) {
                                setTemplate({ id: templateDoc.id, ...templateDoc.data() });
                            }

                            restoredFromBackup = true;
                        }
                    } catch (e) {
                        console.error('Failed to parse backup', e);
                        localStorage.removeItem(backupKey);
                    }
                }

                if (restoredFromBackup) return;


                // 2. Normal Load (Firestore)
                const templateDoc = await getDoc(doc(db, 'workout_templates', workoutId));
                if (templateDoc.exists()) {
                    const tmplData = templateDoc.data();
                    setTemplate({ id: templateDoc.id, ...tmplData });

                    // Helper to normalize sets structure
                    const normalizeSets = (exSets, exReps, exTarget) => {
                        // 1. If explicit array, use it
                        if (Array.isArray(exSets)) return exSets;

                        let count = 3; // Default

                        // 2. Try to parse "sets" as number
                        if (exSets) {
                            const parsed = Number(exSets);
                            if (!isNaN(parsed) && parsed > 0) count = parsed;
                        }
                        // 3. Try, if needed, to parse "target" string (e.g. "4x 12")
                        else if (exTarget && typeof exTarget === 'string') {
                            const match = exTarget.match(/^(\d+)x/i);
                            if (match && match[1]) {
                                count = parseInt(match[1], 10);
                            }
                        }

                        // 4. Fallback to default reps if target looks like "3x15"
                        let defaultReps = exReps || '8-12';
                        if (exTarget && typeof exTarget === 'string') {
                            const parts = exTarget.split('x');
                            if (parts.length > 1) {
                                defaultReps = parts[1].trim();
                            }
                        }

                        return Array.from({ length: count }, () => ({
                            id: generateId(),
                            reps: defaultReps,
                            weight: '',
                            completed: false
                        }));
                    };

                    // Check for active session with Graceful Fallback
                    let sessionSnap = { empty: true };
                    try {
                        const sessionsQuery = query(
                            collection(db, 'workout_sessions'),
                            where('userId', '==', profileId),
                            where('templateId', '==', workoutId),
                            where('completedAt', '==', null)
                        );
                        sessionSnap = await getDocs(sessionsQuery);
                        // Filter in memory for safety if multiple returned
                        if (!sessionSnap.empty) {
                            const sessions = sessionSnap.docs.map(change => change.data());
                            // Sort desc
                            sessions.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                            // Replace sessionSnap with mock if we have valid sessions
                            sessionSnap = { empty: false, docs: [{ data: () => sessions[0] }] };
                        }
                    } catch (sessionErr) {
                        console.warn('Session fetch failed (likely missing index), starting new session:', sessionErr);
                        sessionSnap = { empty: true };
                    }

                    if (!tmplData.exercises || !Array.isArray(tmplData.exercises)) {
                        console.error('Template missing exercises array:', tmplData);
                        setExercises([]);
                        setLoading(false);
                        return;
                    }

                    // 2.5 Try to fetch PREVIOUS Completed Session for History Persistence
                    let lastSessionExercises = [];
                    if (sessionSnap.empty) {
                        try {
                            const historyQuery = query(
                                collection(db, 'workout_sessions'),
                                where('userId', '==', profileId),
                                where('templateId', '==', workoutId),
                                where('completedAt', '!=', null),
                                orderBy('completedAt', 'desc'),
                                limit(1)
                            );
                            const historySnap = await getDocs(historyQuery);
                            if (!historySnap.empty) {
                                lastSessionExercises = historySnap.docs[0].data().exercises || [];
                                console.log('Found previous session for persistence:', lastSessionExercises);
                            }
                        } catch (histErr) {
                            console.warn('Could not fetch history for persistence:', histErr);
                        }
                    }

                    if (!sessionSnap.empty) {
                        try {
                            const sessionData = sessionSnap.docs[0].data();
                            console.log('Resuming session:', sessionData);

                            const mergedExercises = tmplData.exercises.map(ex => {
                                const exId = ex.id || generateId();
                                const saved = sessionData.exercises?.find(e => e.id === exId);
                                const templateSets = normalizeSets(ex.sets, ex.reps, ex.target);

                                return {
                                    ...ex,
                                    id: exId,
                                    sets: templateSets.map(s => {
                                        const savedSet = saved?.sets?.find(ss => ss.id === s.id) ||
                                            (saved?.sets ? saved.sets[templateSets.indexOf(s)] : null);

                                        return {
                                            ...s,
                                            id: s.id || generateId(),
                                            completed: savedSet?.completed || false,
                                            weight: savedSet?.weight || s.weight || '',
                                            reps: savedSet?.reps || s.reps || '',
                                            targetReps: s.reps || ex.reps || s.targetReps,
                                            targetWeight: s.weight || ''
                                        };
                                    }),
                                    notes: saved?.notes || ''
                                };
                            });
                            setExercises(mergedExercises);
                        } catch (resumeError) {
                            console.error('Error resuming session, falling back to new:', resumeError);
                            setExercises(tmplData.exercises.map(ex => {
                                const standardizedSets = normalizeSets(ex.sets, ex.reps, ex.target);
                                return {
                                    ...ex,
                                    id: ex.id || generateId(),
                                    sets: standardizedSets.map(s => ({
                                        ...s,
                                        id: s.id || generateId(),
                                        completed: false,
                                        weight: '',
                                        reps: '',
                                        targetReps: s.targetReps || s.reps,
                                        targetWeight: ''
                                    })),
                                    notes: ''
                                };
                            }));
                        }
                    } else {
                        // New session
                        // New session with Persistence
                        setExercises(tmplData.exercises.map(ex => {
                            const standardizedSets = normalizeSets(ex.sets, ex.reps, ex.target);

                            // Find matching exercise from last session
                            // Try ID first, then Name
                            const lastEx = lastSessionExercises.find(le => le.id === ex.id) ||
                                lastSessionExercises.find(le => le.name === ex.name);

                            return {
                                ...ex,
                                id: ex.id || generateId(),
                                sets: standardizedSets.map((s, idx) => {
                                    // Try to find matching set in last session (by index since IDs might change in new session)
                                    // Actually, for "New Session", we want to replicate the LAST USED weight/reps.
                                    // If lastEx exists, we try to match sets.
                                    const lastSet = lastEx?.sets?.[idx];

                                    return {
                                        ...s,
                                        id: s.id || generateId(),
                                        completed: false,
                                        weight: lastSet?.weight || s.weight || '',
                                        reps: lastSet?.reps || s.reps || '',
                                        targetReps: s.targetReps || s.reps, // Keep target from template
                                        targetWeight: lastSet?.weight || '' // Populate targetWeight with history
                                    };
                                }),
                                notes: lastEx?.notes || ''
                            };
                        }));
                    }
                } else {
                    console.error('Template not found');
                }
            } catch (err) {
                console.error('Error loading workout:', err);
                // No alert here, just log. allow UI to render even if empty
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [workoutId, profileId]);

    // --- PERSISTENCE: AUTO-SAVE EFFECT ---
    useEffect(() => {
        if (!loading && exercises.length > 0) {
            const backupData = {
                timestamp: Date.now(),
                elapsedSeconds,
                exercises
            };
            localStorage.setItem(backupKey, JSON.stringify(backupData));
        }
    }, [exercises, elapsedSeconds, loading, backupKey]);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (!loading && !saving) { // Assuming saving also pauses the timer
            interval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading, saving]);

    // Handlers (UpdateSet, ToggleSet, etc.) - Preserved from context
    const handleUpdateSet = (exId, setId, field, val) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: val } : s)
        } : ex));
    };

    const handleToggleSet = (exId, setId) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? {
            ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
        } : ex));
    };

    const handleUpdateNotes = (exId, val) => {
        setExercises(prev => prev.map(ex => ex.id === exId ? { ...ex, notes: val } : ex));
    };

    // New Handler for Set Completion with Auto-Fill
    const handleSetCompletion = (exId, setNumber, weight, actualReps) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id !== exId) return ex;

            const currentSetIdx = setNumber - 1;
            const nextSetIdx = currentSetIdx + 1;

            return {
                ...ex,
                sets: ex.sets.map((s, idx) => {
                    // Update Current Set
                    if (idx === currentSetIdx) {
                        return { ...s, completed: true, weight, reps: actualReps };
                    }

                    // Auto-fill Next Set (if exists and empty/default)
                    if (idx === nextSetIdx) {
                        return {
                            ...s,
                            weight: s.weight || weight, // Only fill if empty
                            reps: actualReps // Overwrite default/target reps with actual performance
                        };
                    }

                    return s;
                })
            };
        }));
    };

    const handleAddSet = () => { }; // Disabled
    const handleRemoveSet = () => { }; // Disabled
    const handleUpdateOneRM = (id, val) => {
        setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, oneRepMax: val } : ex));
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < exercises.length - 1) setCurrentExerciseIndex(prev => prev + 1);
    };
    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) setCurrentExerciseIndex(prev => prev - 1);
    };

    const handleFinishWorkout = async () => {
        setSaving(true);
        try {
            // Save logic (Simplified for revert)
            await addDoc(collection(db, 'workout_sessions'), {
                templateId: workoutId,
                userId: profileId,
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
                exercises: exercises.map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    sets: ex.sets.map(s => ({
                        id: s.id,
                        weight: s.weight,
                        reps: s.reps,
                        completed: s.completed
                    })),
                    notes: ex.notes
                }))
            });
            // --- PERSISTENCE: CLEAR BACKUP ON SUCCESS ---
            localStorage.removeItem(backupKey);

            if (onFinish) onFinish();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white text-center p-10">Carregando...</div>;

    const completedExercisesCount = exercises.filter(ex => ex.sets.every(s => s.completed)).length;
    const totalExercises = exercises.length;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 p-4 pb-32 font-sans selection:bg-cyan-500/30">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* --- HEADER (Legacy Style - Outlined) --- */}
                {/* --- HEADER (Legacy Style - Separated Buttons) --- */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-3 pt-6 pb-2 flex items-center justify-between pointer-events-none">

                    {/* VOLTAR Button */}
                    <div className="pointer-events-auto">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="pl-2 pr-4 py-1.5 backdrop-blur-md shadow-lg gap-2"
                        >
                            <ChevronLeft size={18} />
                            <span className="text-[10px] font-bold tracking-widest uppercase">Voltar</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        {/* Timer Button */}
                        <Button
                            variant={showTimer ? 'primary' : 'secondary'}
                            size="xs"
                            onClick={() => setShowTimer(!showTimer)}
                            className={showTimer ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-[#0f172a]/90 backdrop-blur-md border-slate-700 text-slate-400'}
                            leftIcon={<Timer size={14} />}
                        >
                            TIMER
                        </Button>

                        {/* 1RM Button */}
                        <Button
                            variant={showOneRM ? 'primary' : 'secondary'}
                            size="xs"
                            onClick={() => setShowOneRM(!showOneRM)}
                            className={showOneRM ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-[#0f172a]/90 backdrop-blur-md border-slate-700 text-slate-400'}
                            leftIcon={<Dumbbell size={14} />}
                        >
                            1RM
                        </Button>

                        {/* Mode Toggle Button */}
                        <Button
                            variant={focusMode ? 'primary' : 'secondary'}
                            size="xs"
                            onClick={() => setFocusMode(!focusMode)}
                            className={focusMode ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-[#0f172a]/90 backdrop-blur-md border-slate-700 text-slate-400'}
                            leftIcon={focusMode ? <Eye size={14} /> : <Eye size={14} />}
                        >
                            FOCO
                        </Button>
                    </div>
                </div>

                {/* Main Content Spacer */}
                <div className="h-24"></div>

                {/* Focus Nav (Inline - Top) */}
                {focusMode && (
                    <div className="px-4 mb-4 flex items-center justify-between pointer-events-auto">
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

                {/* PROGRESS CARD */}
                <div className="px-4 mb-2">
                    <ProgressCard completedCount={completedExercisesCount} totalCount={totalExercises} />
                </div>

                {/* EXERCISES LIST */}
                <main className="px-4 pb-32 space-y-4">
                    {focusMode ? (
                        exercises.length > 0 && (() => {
                            const ex = exercises[currentExerciseIndex];
                            // Logic to find current active set
                            const firstIncomplete = ex.sets.findIndex(s => !s.completed);
                            // Default to first incomplete or last set if all done
                            const defaultActive = firstIncomplete !== -1 ? firstIncomplete : ex.sets.length - 1;
                            // Use manual selection if any, otherwise default
                            const activeSetIdx = activeSetIndices[ex.id] !== undefined ? activeSetIndices[ex.id] : defaultActive;
                            // Ensure bounds
                            const safeIdx = Math.max(0, Math.min(activeSetIdx, ex.sets.length - 1));
                            const activeSet = ex.sets[safeIdx];

                            return (
                                <LinearCardCompactV2
                                    key={ex.id}
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
                                    onWeightChange={(val) => handleUpdateSet(ex.id, activeSet.id, 'weight', val)}
                                    onRepsChange={(val) => handleUpdateSet(ex.id, activeSet.id, 'reps', val)}
                                    onObservationChange={(val) => handleUpdateNotes(ex.id, val)}
                                    onSetChange={(setNum) => handleSetNavigation(ex.id, setNum - 1)}
                                    onCompleteSet={({ setNumber, weight, actualReps }) => {
                                        handleSetCompletion(ex.id, setNumber, weight, actualReps);
                                    }}
                                    onMethodClick={() => setSelectedMethod(ex.method)}
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
                                    onWeightChange={(val) => handleUpdateSet(ex.id, activeSet.id, 'weight', val)}
                                    onRepsChange={(val) => handleUpdateSet(ex.id, activeSet.id, 'reps', val)}
                                    onObservationChange={(val) => handleUpdateNotes(ex.id, val)}
                                    onSetChange={(setNum) => handleSetNavigation(ex.id, setNum - 1)}
                                    onCompleteSet={({ setNumber, weight, actualReps }) => {
                                        handleSetCompletion(ex.id, setNumber, weight, actualReps);
                                    }}
                                    onMethodClick={() => setSelectedMethod(ex.method)}
                                />
                            );
                        })
                    )}
                </main>



                {/* Global Timer Overlay */}
                {showTimer && (
                    <RestTimer initialTime={90} isOpen={showTimer} onClose={() => setShowTimer(false)} />
                )}

                {/* Method Explanation Modal */}
                <MethodModal
                    methodName={selectedMethod}
                    onClose={() => setSelectedMethod(null)}
                />

                {/* Finish Button */}
                {/* Finish Button - Updated to match screenshot (Blue/Cyan Gradient) */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#020617] to-transparent z-50">
                    <div className="max-w-2xl mx-auto flex justify-center">
                        <div className="w-[70%] max-w-sm mx-auto">
                            <CyanSystemButton
                                onClick={handleFinishWorkout}
                                loading={saving}
                                text="Finalizar Treino"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
