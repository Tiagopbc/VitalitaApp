import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { db } from './firebaseConfig'; // Removed direct usage
import { workoutService } from '../services/workoutService';
import {
    TrendingUp,
    ChevronLeft,
    History,
    Activity
} from 'lucide-react';
import { PremiumCard } from '../components/design-system/PremiumCard';

import { Button } from '../components/design-system/Button';
import { EvolutionChart } from '../components/analytics/EvolutionChart';
import { WorkoutDetailsModal } from '../components/history/WorkoutDetailsModal';

function HistoryPage({ onBack, initialTemplate, initialExercise, user, isEmbedded = false }) {
    // Tab State: 'journal' | 'analytics'
    const [activeTab, setActiveTab] = useState('journal');

    // --- JOURNAL STATE ---
    const [sessions, setSessions] = useState([]);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [lastDocJournal, setLastDocJournal] = useState(null);
    const [hasMoreJournal, setHasMoreJournal] = useState(false);

    // ... (Analytics State) ...

    // ================= JOURNAL LOGIC =================
    useEffect(() => {
        if (activeTab === 'journal') {
            loadJournal(true);
        }
    }, [activeTab]);

    async function loadJournal(reset = false) {
        if (!user) return;
        if (reset) setLoadingSessions(true);
        else setFetchingMore(true);
        try {
            const startDoc = reset ? null : lastDocJournal;
            // Fetch generic history (no template filter)
            const result = await workoutService.getHistory(user.uid, null, startDoc, 20);

            const loadedSessions = result.data.map(data => ({
                id: data.id,
                ...data,
                completedAt: data.completedAt?.toDate(),
                duration: data.duration || '0min',
                exercisesCount: data.exercises ? data.exercises.length : 0
            }));

            if (reset) {
                setSessions(loadedSessions);
            } else {
                setSessions(prev => [...prev, ...loadedSessions]);
            }

            setLastDocJournal(result.lastDoc);
            setHasMoreJournal(result.hasMore);

        } catch (err) {
            console.error("Error fetching sessions:", err);
            // Handle error (maybe toast or alert)
        } finally {
            setLoadingSessions(false);
            setFetchingMore(false);
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

    // --- GROUPING LOGIC ---
    const groupedSessions = useMemo(() => {
        if (!sessions.length) return {};
        const groups = {};
        sessions.forEach(session => {
            if (!session.completedAt) return;
            const date = session.completedAt;
            const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const formatted = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

            if (!groups[formatted]) groups[formatted] = [];
            groups[formatted].push(session);
        });
        return groups;
    }, [sessions]);

    const getSessionHighlight = (session) => {
        let maxWeight = 0;
        let maxExName = '';

        let exerciseList = [];
        if (session.exercises && Array.isArray(session.exercises)) {
            exerciseList = session.exercises;
        } else if (session.results) {
            exerciseList = Object.entries(session.results).map(([k, v]) => ({ name: k, ...v }));
        }

        exerciseList.forEach(ex => {
            let localMax = 0;
            if (ex.sets && Array.isArray(ex.sets)) {
                ex.sets.forEach(s => {
                    const w = parseFloat(s.weight);
                    if (w > localMax) localMax = w;
                });
            } else if (ex.weight) {
                localMax = parseFloat(ex.weight);
            }

            if (localMax > maxWeight) {
                maxWeight = localMax;
                maxExName = ex.name;
            }
        });

        if (maxWeight > 0) return `Destaque: ${maxExName.toUpperCase()} (${maxWeight}kg)`;
        return `${session.exercisesCount || exerciseList.length} exercícios`;
    };

    // --- MODAL STATE ---
    const [selectedSessionForDetails, setSelectedSessionForDetails] = useState(null);

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

    // --- CHART STATE ---
    const [chartData, setChartData] = useState([]);
    const [chartRange, setChartRange] = useState('3M'); // 1M, 3M, 6M, 1Y, ALL

    const hasAppliedInitialFilters = useRef(false);

    // Initial Filter Layout
    useEffect(() => {
        if (initialTemplate || initialExercise) {
            setActiveTab('analytics');
        }
    }, [initialTemplate, initialExercise]);


    // ================= ANALYTICS LOGIC =================
    useEffect(() => {
        async function fetchTemplates() {
            if (activeTab !== 'analytics') return;

            setLoadingTemplates(true);
            setError('');
            try {
                // Use Service
                const list = await workoutService.getTemplates(user.uid);
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
    }, [activeTab, initialTemplate, user?.uid]);

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
                // Determine limit based on range? Or just fetch last 100 for analytics context
                // For a proper chart, we might need more. 
                // Using 100 as a safe upper bound for now to prevent "excessive data".
                // Ideally this would be dynamic or use a specific "getAnalytics" service method.
                const result = await workoutService.getHistory(user.uid, selectedTemplate, null, 100);

                const rows = [];
                const prMap = new Map();

                // Service returns { data, lastDoc, hasMore }
                // Data is already an array of objects.
                // We need to sort descending by date for the loop (consistent with previous logic).
                // Service default sort (if index exists) is completedAt desc.

                // If service failed to sort (no index), we sort client side.
                // Note: result.data items have completedAt as Timestamp (or date if service converted it? Service converts? No, service returns .data() so it's Timestamp)

                const docs = result.data.sort((a, b) => {
                    const dateA = a.completedAt?.toDate?.() || 0;
                    const dateB = b.completedAt?.toDate?.() || 0;
                    return dateB - dateA; // Descending
                });

                docs.forEach((data) => {
                    const docId = data.id;
                    const results = data.results || data.exercises || [];

                    // Handle new structure where exercises is an array
                    let exerciseData = null;
                    if (Array.isArray(results)) {
                        exerciseData = results.find(e => e.name === selectedExercise);
                    } else {
                        exerciseData = results[selectedExercise]; // Legacy map support
                    }

                    if (!exerciseData) return;

                    const completedAt = data.completedAt?.toDate?.() || null;
                    if (!completedAt) return;

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
                        bestWeight = Number(exerciseData.weight);
                        bestReps = Number(exerciseData.reps);
                    }

                    if (bestWeight === 0) return;

                    rows.push({
                        id: data.id,
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

                // Filter rows based on Range
                const now = new Date();
                const rangeDate = new Date();
                if (chartRange === '1M') rangeDate.setMonth(now.getMonth() - 1);
                if (chartRange === '3M') rangeDate.setMonth(now.getMonth() - 3);
                if (chartRange === '6M') rangeDate.setMonth(now.getMonth() - 6);
                if (chartRange === '1Y') rangeDate.setFullYear(now.getFullYear() - 1);
                if (chartRange === 'ALL') rangeDate.setFullYear(1900);

                const filteredRows = rows.filter(r => r.date >= rangeDate);

                // Sort for list
                setHistoryRows(rows);

                // Sort for chart (ascending date) & Format
                const chartDataParsed = filteredRows
                    .sort((a, b) => a.date - b.date)
                    .map(r => ({
                        dateStr: r.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        weight: r.weight,
                        fullDate: r.date
                    }));

                setChartData(chartDataParsed);

                setPrRows(Array.from(prMap.values()).sort((a, b) => a.weight - b.weight));
            } catch (err) {
                console.error('Erro ao carregar histórico', err);
                setError('Não foi possível carregar o histórico');
            } finally {
                setLoadingHistory(false);
            }
        }
        fetchHistory();
        fetchHistory();
    }, [selectedTemplate, selectedExercise, user, activeTab, chartRange]);

    return (
        <div className="min-h-screen bg-[#020617] pb-32">
            {/* --- HEADER --- */}
            <div className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/50 pt-4 px-4 pb-4">
                <div className="w-full max-w-5xl mx-auto space-y-4">

                    {!isEmbedded && (
                        <div className="flex items-center justify-between pt-8 mb-2">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={onBack}
                                className="uppercase font-bold tracking-wider"
                                leftIcon={<ChevronLeft size={16} />}
                            >
                                VOLTAR
                            </Button>
                            <h1 className="text-xl font-bold text-white">Histórico</h1>
                            <div className="w-10" />
                        </div>
                    )}

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
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* 2. LIST */}
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
                            <div className="space-y-6">
                                {Object.entries(groupedSessions).map(([month, monthSessions]) => (
                                    <div key={month}>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 sticky top-32 bg-[#020617]/90 py-2 z-10 backdrop-blur-sm">
                                            {month}
                                        </h3>
                                        <div className="space-y-3">
                                            {monthSessions.map((session, idx) => (
                                                <PremiumCard
                                                    key={session.id}
                                                    className="border-slate-800/60 bg-slate-900/40 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                                                    style={{ animationDelay: `${idx * 50}ms` }}
                                                    onClick={() => setSelectedSessionForDetails(session)}
                                                >
                                                    {/* Decorative gradient overlay on hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">
                                                                    {formatDate(session.completedAt)}
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    {session.duration}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-base font-bold text-white leading-tight">
                                                                {session.templateName || session.workoutName || 'Treino Sem Nome'}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    {/* Highlight / Stats */}
                                                    <div className="flex items-center gap-2 relative z-10">
                                                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800/50 flex items-center gap-2">
                                                            <TrendingUp size={12} className="text-slate-400" />
                                                            <span className="text-xs font-medium text-slate-300">
                                                                {getSessionHighlight(session)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </PremiumCard>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {hasMoreJournal && (
                                    <div className="text-center pt-4 pb-8">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => loadJournal(false)}
                                            disabled={fetchingMore}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            {fetchingMore ? (
                                                <Activity className="animate-spin w-4 h-4 mr-2" />
                                            ) : (
                                                <History size={16} className="mr-2" />
                                            )}
                                            {fetchingMore ? 'Carregando...' : 'Carregar mais antigos'}
                                        </Button>
                                    </div>
                                )}
                            </div>
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

                                {/* Chart Section */}
                                {selectedTemplate && selectedExercise && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="font-bold text-slate-400 uppercase tracking-wide text-xs">Evolução de Carga</h3>
                                            <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                                                {['1M', '3M', '6M', '1Y', 'ALL'].map(range => (
                                                    <button
                                                        key={range}
                                                        onClick={() => setChartRange(range)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${chartRange === range
                                                            ? 'bg-slate-700 text-cyan-400 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-300'
                                                            }`}
                                                    >
                                                        {range}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <EvolutionChart data={chartData} range={chartRange} />
                                    </div>
                                )}

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
            {/* DETAILS MODAL */}
            {
                selectedSessionForDetails && (
                    <WorkoutDetailsModal
                        session={selectedSessionForDetails}
                        onClose={() => setSelectedSessionForDetails(null)}
                    />
                )
            }
        </div >
    );
}

export default HistoryPage;