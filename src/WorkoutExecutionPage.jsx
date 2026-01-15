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
    Settings,
    Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas'; // For sharing
import { ShareableWorkoutCard } from './components/sharing/ShareableWorkoutCard';
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
    deleteDoc,
    onSnapshot // Listed import
} from 'firebase/firestore';
import { userService } from './services/userService'; // Import userService
import { RippleButton } from './components/design-system/RippleButton';
import { Button } from './components/design-system/Button';
import { CyanSystemButton } from './components/design-system/CyanSystemButton';
import MethodModal from './MethodModal';
import { LinearCardCompactV2 } from './components/execution/LinearCardCompactV2';
import { Toast } from './components/design-system/Toast';
import { Skeleton } from './components/design-system/Skeleton';


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
        <div className="flex flex-col gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold ml-1">{label}</span>
            <div className="flex items-center gap-2 sm:gap-3">
                <RippleButton
                    onClick={handleDecrement}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                >
                    <ChevronDown size={18} className="rotate-90 sm:w-5 sm:h-5" /> {/* Minus appearance */}
                </RippleButton>

                <div className="bg-slate-200 text-slate-900 font-bold text-base sm:text-lg h-8 sm:h-10 min-w-[30px] px-4 rounded-full flex items-center justify-center border border-slate-300">
                    {value}{suffix}
                </div>

                <RippleButton
                    onClick={handleIncrement}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                >
                    <ChevronUp size={18} className="rotate-90 sm:w-5 sm:h-5" /> {/* Plus appearance */}
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

    // Confetti Logic
    const hasCelebrated = useRef(false);

    useEffect(() => {
        if (isExerciseComplete && !hasCelebrated.current) {
            hasCelebrated.current = true;
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#06b6d4', '#ec4899', '#8b5cf6'] // Cyan, Pink, Purple
            });
        }
    }, [isExerciseComplete]);

    if (!activeSet) return null;

    return (
        <div className={`bg-[#0f172a] rounded-3xl p-4 sm:p-5 border border-slate-800 relative overflow-hidden transition-all ${isExerciseComplete ? 'opacity-75 border-emerald-500/30' : ''}`}>

            {/* Header Row */}
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                {/* Checkbox Main - Toggles ACTIVE set */}
                <button
                    onClick={() => onToggleSet(exercise.id, activeSet.id)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${activeSet.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-cyan-500'}`}
                >
                    {activeSet.completed && <Check size={18} className="text-white sm:w-5 sm:h-5" strokeWidth={4} />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-0">
                        <div className="flex-1 pr-1 w-full">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{exercise.muscleFocus?.primary || exercise.group}</p>
                            <h3
                                className="text-base sm:text-xl font-bold text-white mb-1 leading-normal"
                                style={{
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal !important',
                                    wordBreak: 'break-word',
                                    display: 'block',
                                    height: 'auto',
                                    maxHeight: 'none'
                                }}
                            >
                                {exercise.name}
                            </h3>
                        </div>
                        {/* Badge */}
                        {exercise.method && (
                            <div
                                onClick={() => {
                                    setSelectedMethod(exercise.method);
                                }}
                                className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[9px] font-bold uppercase tracking-wider cursor-pointer hover:bg-cyan-500/20 active:scale-95 transition-all self-start sm:self-auto ml-0 sm:ml-auto"
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
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-5 sm:mb-6 px-1">
                {/* Weight Stepper */}
                <div className="flex flex-col gap-1 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold ml-1">Peso (kg)</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'weight', Math.max(0, Number(activeSet.weight || 0) - 1))}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-lg sm:text-xl font-bold mb-1">-</span>
                        </RippleButton>

                        <div className={`${inputClassName} font-bold text-base sm:text-lg h-8 sm:h-10 w-[60px] sm:w-[70px] rounded-full flex items-center justify-center border border-slate-300 shadow-inner`}>
                            {activeSet.weight || 0}
                        </div>

                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'weight', Number(activeSet.weight || 0) + 1)}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-lg sm:text-xl font-bold mb-1">+</span>
                        </RippleButton>
                    </div>
                </div>

                {/* Reps Stepper */}
                <div className="flex flex-col gap-1 sm:gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 font-bold ml-1">Repetições</span>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'reps', Math.max(0, Number(activeSet.reps || 0) - 1))}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-lg sm:text-xl font-bold mb-1">-</span>
                        </RippleButton>

                        <div className={`${inputClassName} font-bold text-base sm:text-lg h-8 sm:h-10 w-[60px] sm:w-[70px] rounded-full flex items-center justify-center border border-slate-300 shadow-inner`}>
                            {activeSet.reps || 0}
                        </div>

                        <RippleButton
                            onClick={() => onUpdateSet(exercise.id, activeSet.id, 'reps', Number(activeSet.reps || 0) + 1)}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                        >
                            <span className="text-lg sm:text-xl font-bold mb-1">+</span>
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
    // Determine percent just for safe keeping or analytics if needed, but we use segments now
    // const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="bg-[#0f172a] rounded-3xl p-5 border border-slate-800 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-cyan-500 flex items-center justify-center">
                        <Check size={8} className="text-cyan-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progresso do Treino</span>
                </div>

                <div className="text-sm font-bold text-white">
                    <span className="text-lg text-cyan-400 mr-1">{completedCount}</span>
                    <span className="text-slate-500">/ {totalCount}</span>
                </div>
            </div>

            {/* Segmented Bar */}
            <div className="flex gap-1 h-1.5 w-full">
                {Array.from({ length: totalCount }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`flex-1 rounded-full transition-all duration-500 ${idx < completedCount
                            ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-800'
                            }`}
                    />
                ))}
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
    const [error, setError] = useState(null);
    const [showFinishModal, setShowFinishModal] = useState(false); // Success Modal State


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

    // --- REFS ---
    const lastSyncedRef = useRef(''); // To prevent loop (Echo)

    // --- PERSISTENCE: LOCAL STORAGE KEY ---
    const backupKey = `workout_backup_${profileId}_${workoutId}`;

    // --- PERSISTENCE: RESTORE BACKUP OR FETCH DATA ---
    useEffect(() => {
        if (!workoutId || !profileId) return;

        async function fetchData() {
            setLoading(true);
            try {
                // 0. DEEP SYNC: CHECK ACTIVE_WORKOUTS COLLECTION FIRST (Priority over LocalStorage)
                try {
                    const activeSnap = await getDoc(doc(db, 'active_workouts', profileId));
                    if (activeSnap.exists()) {
                        const activeData = activeSnap.data();
                        if (activeData.templateId === workoutId) {
                            // FOUND ACTIVE REMOTE SESSION -> USE THIS AS SOURCE OF TRUTH
                            console.log("Found active remote session, using it.");

                            // Load template metadata needed
                            const templateDoc = await getDoc(doc(db, 'workout_templates', workoutId));
                            if (templateDoc.exists()) {
                                setTemplate({ id: templateDoc.id, ...templateDoc.data() });
                            }

                            if (activeData.exercises) {
                                setExercises(activeData.exercises);
                                setElapsedSeconds(activeData.elapsedSeconds || 0);
                                // Set lastSyncedRef to prevent echo immediately
                                lastSyncedRef.current = JSON.stringify(activeData.exercises);

                                setLoading(false);
                                return; // EXIT EARLY -> Skip LocalStorage check
                            }
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch active remote session", e);
                }

                // 1. Try to restore from LocalStorage first (Fallback)
                const savedBackup = localStorage.getItem(backupKey);
                let restoredFromBackup = false;

                if (savedBackup) {
                    try {
                        const parsedBackup = JSON.parse(savedBackup);
                        // Check if backup is valid and recent (optional: add expiration logic here)
                        // For now, we trust the user wants to resume if it exists
                        if (parsedBackup.exercises && Array.isArray(parsedBackup.exercises)) {
                            // Restoring from LocalStorage backup
                            // CHECK REMOTE FIRST (Optimization: Only use local if remote not found or older?)
                            // For now, if we found remote above, we ALREADY returned. 
                            // So if we are here, remote was empty or different workout.

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
                        sessionSnap = { empty: true };
                    }



                    if (!tmplData.exercises || !Array.isArray(tmplData.exercises)) {
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
                                limit(20) // Fetch a bit more to filter client-side
                            );
                            const historySnap = await getDocs(historyQuery);
                            // Filter valid completed sessions client-side
                            const validDocs = historySnap.docs.filter(doc => doc.data().completedAt);

                            if (validDocs.length > 0) {
                                // Client-side sort
                                const sortedDocs = validDocs.sort((a, b) => {
                                    const dateA = a.data().completedAt?.toDate?.() || 0;
                                    const dateB = b.data().completedAt?.toDate?.() || 0;
                                    return dateB - dateA;
                                });
                                const lastData = sortedDocs[0].data();

                                if (lastData.exercises && Array.isArray(lastData.exercises)) {
                                    lastSessionExercises = lastData.exercises;
                                } else if (lastData.results) {
                                    // Adapter for Legacy Data (Map of "Name": {weight, reps})
                                    lastSessionExercises = Object.entries(lastData.results).map(([name, data]) => ({
                                        name: name,
                                        sets: [{
                                            weight: data.weight,
                                            reps: data.reps
                                        }]
                                    }));
                                }
                            }
                        } catch (histErr) {
                            console.error("Error fetching history:", histErr);
                        }
                    }

                    if (!sessionSnap.empty) {
                        try {
                            const sessionData = sessionSnap.docs[0].data();

                            const mergedExercises = tmplData.exercises.map(ex => {
                                const exId = ex.id || generateId();
                                const saved = sessionData.exercises?.find(e => e.id === exId);
                                const templateSets = normalizeSets(ex.sets, ex.reps, ex.target);

                                // ALSO try to find history for this exercise to show "Last" even in active session
                                // Robust matching: ID first, then Case-Insensitive Name
                                const lastEx = lastSessionExercises.find(le => le.id === exId) ||
                                    lastSessionExercises.find(le => le.name && ex.name && le.name.trim().toLowerCase() === ex.name.trim().toLowerCase());

                                return {
                                    ...ex,
                                    id: exId,
                                    sets: templateSets.map((s, idx) => {
                                        // Retrieve saved set (active session)
                                        const savedSet = saved?.sets?.find(ss => ss.id === s.id) ||
                                            (saved?.sets ? saved.sets[idx] : null);

                                        // Retrieve historical set (Last Session)
                                        // PROPAGATION LOGIC: If we have more sets now than before, use the LAST known set from history.
                                        // likely lastEx.sets has 1 element (Legacy) or N elements.
                                        // If idx >= lastEx.sets.length, use lastEx.sets[lastEx.sets.length - 1]
                                        let lastSet = null;
                                        if (lastEx && lastEx.sets && lastEx.sets.length > 0) {
                                            if (idx < lastEx.sets.length) {
                                                lastSet = lastEx.sets[idx];
                                            } else {
                                                lastSet = lastEx.sets[lastEx.sets.length - 1]; // Propagate last value
                                            }
                                        }

                                        return {
                                            ...s,
                                            id: s.id || generateId(),
                                            completed: savedSet?.completed || false,
                                            weight: savedSet?.weight || s.weight || '',
                                            reps: savedSet?.reps || s.reps || '',
                                            targetReps: s.reps || ex.reps || s.targetReps,
                                            targetWeight: s.weight || '',
                                            // Explicit HistoryProps
                                            lastWeight: lastSet?.weight || null,
                                            lastReps: lastSet?.reps || null
                                        };
                                    }),
                                    notes: saved?.notes || ''
                                };
                            });
                            setExercises(mergedExercises);
                        } catch (resumeError) {
                            // Fallback (same as catch block below but simplified)
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
                                        targetWeight: '',
                                        lastWeight: null,
                                        lastReps: null
                                    })),
                                    notes: ''
                                };
                            }));
                        }
                    } else {
                        // New session
                        setExercises(tmplData.exercises.map(ex => {
                            const standardizedSets = normalizeSets(ex.sets, ex.reps, ex.target);

                            // Find matching exercise from last session
                            // Robust matching: ID first, then Case-Insensitive Name
                            const lastEx = lastSessionExercises.find(le => le.id === ex.id) ||
                                lastSessionExercises.find(le => le.name && ex.name && le.name.trim().toLowerCase() === ex.name.trim().toLowerCase());

                            return {
                                ...ex,
                                id: ex.id || generateId(),
                                sets: standardizedSets.map((s, idx) => {
                                    // PROPAGATION LOGIC
                                    let lastSet = null;
                                    if (lastEx && lastEx.sets && lastEx.sets.length > 0) {
                                        if (idx < lastEx.sets.length) {
                                            lastSet = lastEx.sets[idx];
                                        } else {
                                            lastSet = lastEx.sets[lastEx.sets.length - 1]; // Propagate last value
                                        }
                                    }

                                    return {
                                        ...s,
                                        id: s.id || generateId(),
                                        completed: false,
                                        // Pre-fill with history
                                        weight: lastSet?.weight || s.weight || '',
                                        reps: lastSet?.reps || s.reps || '', // Pre-fill reps as requested

                                        targetReps: s.targetReps || s.reps,
                                        targetWeight: lastSet?.weight || '',

                                        // Explicit History Props
                                        lastWeight: lastSet?.weight || null,
                                        lastReps: lastSet?.reps || null
                                    };
                                }),
                                notes: lastEx?.notes || ''
                            };
                        }));
                    }
                } else {
                    // Template not found
                }
            } catch (err) {
                console.error("Fatal error loading workout:", err);
            } finally {
                setLoading(false);
            }
        }


        // --- DEEP SYNC: LISTEN FOR REMOTE UPDATES ---
        // This runs IN PARALLEL with initial fetch to catch updates from other devices
        // --- SYNC ON LOAD / VISIBILITY (No Real-Time Echo) ---
        // Instead of actively listening (which caused loops), we fetch when user focuses the app.
        // --- SYNC ON LOAD ONLY (No Auto-Focus Update) ---
        // User requested to ONLY update on page refresh or manual sync button.
        // We removed the visibility/focus listeners to avoid "loading" spinner interruptions.

        // Initial Load
        fetchData();

        // No cleanup needed
    }, [workoutId, profileId]); // dependency array

    // --- PERSISTENCE: AUTO-SAVE & SYNC EFFECT ---
    // lastSyncedRef is defined at top

    useEffect(() => {
        if (!loading && exercises.length > 0) {
            // 1. Local Backup (Keep for offline safety)
            const backupData = {
                timestamp: Date.now(),
                elapsedSeconds,
                exercises
            };
            localStorage.setItem(backupKey, JSON.stringify(backupData));

            // 2. Cloud Sync (Debounce this in real app, but for now direct)
            // CRITICAL FIX: Only sync if EXERCISES changed significantly
            // We do NOT sync on every second tick of elapsedSeconds anymore to prevent loop/blinking

            const currentString = JSON.stringify(exercises);
            if (profileId && currentString !== lastSyncedRef.current) {
                userService.updateActiveSession(profileId, {
                    templateId: workoutId,
                    elapsedSeconds, // We still send time
                    exercises
                }).then(() => {
                    lastSyncedRef.current = currentString;
                }).catch(err => console.error("Sync error:", err));
            }
        }
    }, [exercises, loading, backupKey, profileId, workoutId]); // REMOVED elapsedSeconds (it's inside effect but not dependency)

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
            // Calculate Duration
            const minutes = Math.floor(elapsedSeconds / 60);
            const durationStr = `${minutes}min`;

            // Save logic (Simplified for revert)
            await addDoc(collection(db, 'workout_sessions'), {
                duration: durationStr,
                elapsedSeconds: elapsedSeconds,
                templateId: workoutId,
                templateName: template?.name || 'Treino Personalizado', // Critical for History Analytics
                workoutName: template?.name || 'Treino Personalizado', // Legacy support
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


            // --- PERSISTENCE: CLEAR BACKUP & REMOTE SESSION ON SUCCESS ---
            localStorage.removeItem(backupKey);
            if (profileId) {
                await userService.deleteActiveSession(profileId);
            }

            // --- UPDATE TEMPLATE METADATA (Last Performed) ---
            const templateRef = doc(db, 'workout_templates', workoutId);
            try {
                // Use updateDoc to avoid overwriting entire doc if possible, but we don't import it.
                // Re-using setDoc with merge: true is safer if we stick to imports we have?
                // Actually we imported setDoc, but updateDoc is cleaner. Let's see imports.
                // We have setDoc. Let's add updateDoc to imports first? Or just use setDoc({ ... }, { merge: true })
                await setDoc(templateRef, {
                    lastPerformed: serverTimestamp(),
                    // Increment timesPerformed? We need increment() from firestore which is likely not imported.
                    // Let's just update the timestamp for now to fix the main issue.
                    // If we want count, we need to read+write or use increment.
                    // Let's stick to simple timestamp update for "Last Performed".
                }, { merge: true });
            } catch (tmplErr) {
                console.error("Error updating template metadata:", tmplErr);
            }

            // Grand Finale Confetti
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
            });

            // Show Finish Modal
            setTimeout(() => {
                setShowFinishModal(true);
            }, 800);
        } catch (e) {
            setError('Erro ao salvar. Verifique sua conexão.');
        } finally {
            setSaving(false);
        }
    };

    // --- SHARING ---
    const [sharing, setSharing] = useState(false);
    const shareCardRef = useRef(null);

    const handleShare = async () => {
        if (!shareCardRef.current) return;
        setSharing(true);
        try {
            const canvas = await html2canvas(shareCardRef.current, {
                backgroundColor: '#020617',
                scale: 2, // High res
                useCORS: true,
                allowTaint: true,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setError('Erro ao gerar imagem.');
                    setSharing(false);
                    return;
                }

                const file = new File([blob], 'treino_concluido.png', { type: 'image/png' });

                // 1. Tentar Compartilhamento Nativo (Mobile/Supported Browsers)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'Treino Concluído - Vitalitá',
                            text: `Acabei de completar o treino ${template?.name || 'Personalizado'}! 💪`,
                            files: [file]
                        });
                        setSharing(false);
                        return; // Sucesso
                    } catch (shareErr) {
                        console.warn('Share API request failed, falling back to download:', shareErr);
                        // Se usuário cancelar, não faz nada. Se for erro real, cai no fallback.
                        if (shareErr.name === 'AbortError') {
                            setSharing(false);
                            return;
                        }
                    }
                }

                // 2. Fallback: Download da Imagem (Funciona em Desktop ou HTTP local)
                try {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vitalita_treino_${new Date().toISOString().slice(0, 10)}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    // Notificar usuário
                    setError(null); // Limpa erros anteriores
                    // Usar um Toast seria melhor, mas como não temos acesso fácil ao ToastRef aqui fora do JSX renderizado condicionalmente, 
                    // vamos assumir que o download é feedback suficiente ou usar um alert amigável se necessário.
                    // Mas preferível não usar alert nativo feio.
                } catch (downloadErr) {
                    console.error("Download fallback failed:", downloadErr);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] p-4 font-sans max-w-2xl mx-auto space-y-6">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center py-4">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-16 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                        <Skeleton className="h-8 w-16 rounded-full" />
                    </div>
                </div>

                {/* Spacer */}
                <div className="h-10"></div>

                {/* Progress Skeleton */}
                <Skeleton className="h-32 w-full rounded-3xl" />

                {/* Exercise Card Skeleton */}
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
            {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
            <div className="max-w-2xl mx-auto space-y-6">

                {/* --- HEADER (Legacy Style - Outlined) --- */}
                {/* --- HEADER (Legacy Style - Separated Buttons) --- */}
                <div
                    className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-3 pb-2 flex items-center justify-between pointer-events-none"
                    style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
                >

                    {/* VOLTAR Button */}
                    <div className="pointer-events-auto">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="backdrop-blur-md shadow-lg uppercase font-bold tracking-wider"
                            leftIcon={<ChevronLeft size={16} />}
                        >
                            VOLTAR
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        {/* SYNC INDICATOR & REFRESH */}
                        {/* SKIPPED SYNC BUTTON - User prefers browser refresh */}
                        {saving && (
                            <span className="text-[10px] text-cyan-400 font-bold animate-pulse flex items-center gap-1 mr-2">
                                <RotateCw size={10} className="animate-spin" /> Salvando...
                            </span>
                        )}

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
                                    lastWeight={activeSet.lastWeight}
                                    lastReps={activeSet.lastReps}
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
                                    lastWeight={activeSet.lastWeight}
                                    lastReps={activeSet.lastReps}
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

                {/* Finish Success Modal */}
                {showFinishModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="w-full max-w-sm bg-[#0f172a] border border-slate-700 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                            {/* Background Glow */}
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
                                                Compartilhar no Instagram
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
                                        Pular e Sair
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Finish Button */}
                {/* Finish Button - Updated to match screenshot (Blue/Cyan Gradient) */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-[#020617] to-transparent z-50">
                    <div className="max-w-2xl mx-auto flex justify-center">
                        <div className="space-y-4 w-full flex flex-col items-center pointer-events-auto relative z-10">
                            <Button
                                onClick={handleFinishWorkout}
                                disabled={saving}
                                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                            >
                                {saving ? 'SALVANDO...' : 'FINALIZAR TREINO'}
                            </Button>


                        </div>
                    </div>
                </div>

            </div>

            {/* Hidden Card for Generation - MOVED TO ROOT TO AVOID LAYOUT ISSUES */}
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
                                if (s.completed) vol += (Number(s.weight) * Number(s.reps));
                            });
                        });
                        return vol;
                    })()
                }}
                userName={user?.displayName || "Atleta"}
            />
        </div>
    );
}

