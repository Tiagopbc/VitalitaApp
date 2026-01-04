/**
 * HistoryPage.jsx
 * Exibe o histórico de treinos e análises do usuário.
 * Apresenta uma visualização de 'Diário' para sessões passadas e 'Análises' para rastreamento de progresso.
 */
import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebaseConfig';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import {
    Calendar,
    Clock,
    Dumbbell,
    TrendingUp,
    ChevronLeft,
    History,
    Filter,
    Activity
} from 'lucide-react';
import { PremiumCard } from './components/design-system/PremiumCard';
import { Button } from './components/design-system/Button';

function HistoryPage({ onBack, initialTemplate, initialExercise, user }) {
    // Tab State: 'journal' | 'analytics'
    const [activeTab, setActiveTab] = useState('journal');

    // --- JOURNAL STATE ---
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    // --- ANALYTICS STATE (Existing) ---
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [exerciseOptions, setExerciseOptions] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [historyRows, setHistoryRows] = useState([]);
    const [prRows, setPrRows] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState('');

    const hasAppliedInitialFilters = useRef(false);

    // Initial Filter Layout
    useEffect(() => {
        if (initialTemplate || initialExercise) {
            setActiveTab('analytics');
        }
    }, [initialTemplate, initialExercise]);

    // ================= JOURNAL LOGIC =================
    useEffect(() => {
        if (activeTab === 'journal') {
            fetchSessions();
        }
    }, [activeTab]);

    async function fetchSessions() {
        if (!user) return;
        setLoadingSessions(true);
        try {
            const q = query(
                collection(db, 'workout_sessions'),
                where('userId', '==', user.uid),
                where('completedAt', '!=', null),
                orderBy('completedAt', 'desc'),
                limit(20) // Limit for performance
            );
            const snap = await getDocs(q);
            const loadedSessions = snap.docs.map(doc => {
                const data = doc.data();
                // Calculate simple volume (sum of weight * reps for all sets)? 
                // Or just count total sets/exercises. Let's do exercises count + duration.
                return {
                    id: doc.id,
                    ...data,
                    completedAt: data.completedAt?.toDate(),
                    duration: data.duration || '0min', // Assuming we save this string
                    exercisesCount: data.exercises ? data.exercises.length : 0
                };
            });
            setSessions(loadedSessions);
        } catch (err) {
            console.error("Error fetching sessions:", err);
        } finally {
            setLoadingSessions(false);
        }
    }

    function formatDate(date) {
        if (!date) return '';
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short',
            weekday: 'short'
        }).format(date); // Ex: "Ter., 15 de out."
    }

    // ================= ANALYTICS LOGIC (Legacy) =================
    useEffect(() => {
        async function fetchTemplates() {
            if (activeTab !== 'analytics') return;

            setLoadingTemplates(true);
            setError('');
            try {
                // Fetch ALL templates to find exercises. 
                // Optimization: In real app, maybe fetch distinct template names from sessions?
                // But keeping existing logic for consistency right now.
                const templatesRef = collection(db, 'workout_templates');
                const templatesQuery = query(templatesRef, orderBy('name'));
                const snap = await getDocs(templatesQuery);

                const list = snap.docs.map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        id: docSnap.id,
                        name: data.name,
                        exercises: data.exercises || [],
                    };
                });

                setTemplates(list);

                if (list.length > 0 && !selectedTemplate) {
                    let defaultTemplateName = list[0].name;
                    if (initialTemplate) {
                        const found = list.find((t) => t.name === initialTemplate);
                        if (found) defaultTemplateName = found.name;
                    }
                    setSelectedTemplate(defaultTemplateName);
                }
            } catch (err) {
                console.error('Erro ao carregar templates do histórico', err);
                setError('Não foi possível carregar os treinos');
            } finally {
                setLoadingTemplates(false);
            }
        }

        fetchTemplates();
    }, [activeTab, initialTemplate]);

    useEffect(() => {
        if (!selectedTemplate) {
            setExerciseOptions([]);
            setSelectedExercise('');
            return;
        }
        const template = templates.find((t) => t.name === selectedTemplate);
        const options = template && Array.isArray(template.exercises)
            ? template.exercises.map((ex) => ex.name)
            : [];
        setExerciseOptions(options);

        if (!options.length) {
            setSelectedExercise('');
            return;
        }

        if (!hasAppliedInitialFilters.current && activeTab === 'analytics') {
            let defaultExercise = options[0];
            if (initialExercise && options.includes(initialExercise)) {
                defaultExercise = initialExercise;
            }
            setSelectedExercise(defaultExercise);
            hasAppliedInitialFilters.current = true;
        } else if (!options.includes(selectedExercise)) {
            setSelectedExercise(options[0]);
        }
    }, [selectedTemplate, templates, initialExercise, selectedExercise, activeTab]);

    useEffect(() => {
        async function fetchHistory() {
            if (activeTab !== 'analytics' || !selectedTemplate || !selectedExercise || !user) {
                if (activeTab !== 'analytics') {
                    // Don't clear rows if just tab switching, but logic reruns anyway.
                    // Actually let's assume if we leave tab we might keep state? 
                    // React state persists unless component unmounts.
                    // But conditional rendering might unmount sub-components. 
                    // We are keeping state in parent.
                }
                return;
            }

            setLoadingHistory(true);
            setError('');
            try {
                const sessionsRef = collection(db, 'workout_sessions');
                const constraints = [
                    where('templateName', '==', selectedTemplate),
                    where('userId', '==', user.uid),
                    orderBy('completedAt', 'desc'),
                ];
                const sessionsQuery = query(sessionsRef, ...constraints);
                const snap = await getDocs(sessionsQuery);

                const rows = [];
                const prMap = new Map();

                snap.forEach((docSnap) => {
                    const data = docSnap.data();
                    const results = data.results || data.exercises || []; // Support new structure (array of exercises) or old map

                    // Handle new structure where exercises is an array
                    let exerciseData = null;
                    if (Array.isArray(results)) {
                        exerciseData = results.find(e => e.name === selectedExercise);
                    } else {
                        exerciseData = results[selectedExercise]; // Legacy map support
                    }

                    if (!exerciseData) return;

                    const completedAt = data.completedAt?.toDate?.() || null;

                    // New structure has sets array. Need to aggregate or show best set?
                    // Typically history table shows "Best Set" or "Total Volume"?
                    // The old code assumed `exerciseResult.weight` and `exerciseResult.reps` (single set or summary).
                    // If we migrated to multiple sets, we need to adapt.
                    // ADAPTER: Find "Best Set" (Max Weight)
                    let bestWeight = 0;
                    let bestReps = 0;

                    if (exerciseData.sets && Array.isArray(exerciseData.sets)) {
                        exerciseData.sets.forEach(s => {
                            if (s.completed && Number(s.weight) > bestWeight) {
                                bestWeight = Number(s.weight);
                                bestReps = Number(s.reps);
                            }
                        });
                    } else if (exerciseData.weight) {
                        bestWeight = exerciseData.weight;
                        bestReps = exerciseData.reps;
                    }

                    if (bestWeight === 0) return; // Skip empty/warmup only?

                    rows.push({
                        id: docSnap.id,
                        date: completedAt,
                        weight: bestWeight,
                        reps: bestReps,
                        notes: exerciseData.notes || '',
                    });

                    // PR Logic
                    const key = String(bestWeight);
                    const existing = prMap.get(key);
                    if (!existing || bestReps > existing.reps) {
                        prMap.set(key, { weight: bestWeight, reps: bestReps });
                    }
                });

                setHistoryRows(rows);
                setPrRows(Array.from(prMap.values()).sort((a, b) => a.weight - b.weight));
            } catch (err) {
                console.error('Erro ao carregar histórico', err);
                setError('Não foi possível carregar o histórico');
            } finally {
                setLoadingHistory(false);
            }
        }
        fetchHistory();
    }, [selectedTemplate, selectedExercise, user, activeTab]);

    return (
        <div className="min-h-screen bg-[#020617] pb-32">
            {/* --- HEADER --- */}
            <div className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/50 pt-12 pb-4 px-4">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={onBack}
                            leftIcon={<ChevronLeft size={16} />}
                        >
                            VOLTAR
                        </Button>
                        <h1 className="text-xl font-bold text-white">Histórico</h1>
                        <div className="w-10" /> {/* Spacer */}
                    </div>

                    {/* TABS */}
                    <div className="grid grid-cols-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setActiveTab('journal')}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'journal'
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Diário
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics'
                                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Evolução
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6 w-full max-w-5xl mx-auto">
                {/* === JOURNAL VIEW === */}
                {activeTab === 'journal' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {loadingSessions ? (
                            <div className="py-20 text-center">
                                <Activity className="animate-spin w-8 h-8 text-cyan-500 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm">Carregando diário...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="py-20 text-center opacity-50">
                                <History size={48} className="mx-auto mb-4 text-slate-600" />
                                <p className="text-slate-400 font-medium">Nenhum treino registrado ainda.</p>
                            </div>
                        ) : (
                            sessions.map((session, idx) => (
                                <PremiumCard
                                    key={session.id}
                                    className="border-slate-800/60 bg-slate-900/40"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">
                                                {formatDate(session.completedAt)}
                                            </p>
                                            <h3 className="text-lg font-bold text-white">
                                                {session.templateName || 'Treino Sem Nome'}
                                            </h3>
                                        </div>
                                        {/* Optional: Score or Rating if we had it */}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                            <Clock size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-200">
                                                {session.duration || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                                            <Dumbbell size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-200">
                                                {session.exercisesCount} exercícios
                                            </span>
                                        </div>
                                    </div>

                                    {/* Optional Notes Preview */}
                                    {/* <p className="text-xs text-slate-500 line-clamp-1 mt-2">
                                        Foi um bom treino, aumentei carga no supino...
                                    </p> */}
                                </PremiumCard>
                            ))
                        )}
                    </div>
                )}

                {/* === ANALYTICS VIEW === */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {loadingTemplates ? (
                            <div className="py-20 text-center">
                                <Activity className="animate-spin w-8 h-8 text-cyan-500 mx-auto mb-4" />
                                <p className="text-slate-500 text-sm">Carregando dados...</p>
                            </div>
                        ) : (
                            <>
                                {/* Filters */}
                                <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Rotina</label>
                                        <select
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 appearance-none focus:border-cyan-500 outline-none transition-colors"
                                        >
                                            <option value="" disabled>Selecione um treino...</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.name}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Exercício</label>
                                        <select
                                            value={selectedExercise}
                                            onChange={(e) => setSelectedExercise(e.target.value)}
                                            disabled={!selectedTemplate}
                                            className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 appearance-none focus:border-cyan-500 outline-none transition-colors disabled:opacity-50"
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            {exerciseOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Results */}
                                {loadingHistory ? (
                                    <div className="py-10 text-center"><p className="text-slate-500">Buscando histórico...</p></div>
                                ) : historyRows.length > 0 ? (
                                    <>
                                        {/* PR Section */}
                                        {prRows.length > 0 && (
                                            <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-2xl p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <TrendingUp className="text-amber-400" size={18} />
                                                    <h3 className="font-bold text-amber-100 uppercase tracking-wide text-xs">Recordes Pessoais (PRs)</h3>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {prRows.slice(0, 4).map(pr => (
                                                        <div key={pr.weight} className="bg-slate-950/40 rounded-lg p-2 text-center border border-amber-500/10">
                                                            <div className="text-lg font-bold text-white">{pr.weight}kg</div>
                                                            <div className="text-[10px] text-amber-200/70">{pr.reps} reps</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Detailed List */}
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-slate-400 uppercase tracking-wide text-xs pl-1">Histórico Completo</h3>
                                            <div className="space-y-2">
                                                {historyRows.map(row => (
                                                    <div key={row.id} className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-800 rounded-xl">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-200">
                                                                {row.date ? new Date(row.date).toLocaleDateString('pt-BR') : '-'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500">{row.notes || 'Sem observações'}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-cyan-400">{row.weight}kg</div>
                                                            <div className="text-xs text-slate-400">{row.reps} reps</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    selectedTemplate && selectedExercise && (
                                        <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                                            <p className="text-slate-500">Nenhum registro encontrado.</p>
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;