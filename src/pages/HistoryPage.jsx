/**
 * HistoryPage.jsx
 * Histórico de treinos em duas abas: Diário (sessões concluídas) e Evolução
 * (carga por exercício ao longo do tempo).
 *
 * Orquestrador fino (D16): o estado e a busca moram em src/hooks/history/ e
 * o JSX de cada aba em src/components/history/. Aqui ficam só a aba ativa, o
 * modal de detalhes e a composição.
 */
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { History, Activity } from 'lucide-react';
import { PageHeader } from '../components/design-system/PageHeader';
import { JournalSection } from '../components/history/JournalSection';
import { useJournal } from '../hooks/history/useJournal';
import { useAnalyticsFilters } from '../hooks/history/useAnalyticsFilters';
import { useGlobalSessions } from '../hooks/history/useGlobalSessions';
import { useExerciseHistory } from '../hooks/history/useExerciseHistory';

const HistoryAnalyticsSection = React.lazy(() => import('../components/history/HistoryAnalyticsSection').then(module => ({ default: module.HistoryAnalyticsSection })));
const WorkoutDetailsModal = React.lazy(() => import('../components/history/WorkoutDetailsModal').then(module => ({ default: module.WorkoutDetailsModal })));

function HistoryPage({ user, isEmbedded = false }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTemplate = searchParams.get('template');
    const initialExercise = searchParams.get('exercise');
    const onBack = () => navigate(-1);

    // Aba: 'journal' | 'analytics'. A escolha guarda a chave dos parâmetros da
    // URL com que foi feita: se os parâmetros mudaram e trazem filtro, a aba
    // efetiva é Evolução até a próxima escolha. Derivado, sem efeito.
    const filtroDaUrl = `${initialTemplate ?? ''}|${initialExercise ?? ''}`;
    const [abaEscolhida, setAbaEscolhida] = useState({ chave: filtroDaUrl, valor: 'analytics' });
    const urlTrouxeFiltro = Boolean(initialTemplate || initialExercise);
    const activeTab = abaEscolhida.chave !== filtroDaUrl && urlTrouxeFiltro
        ? 'analytics'
        : abaEscolhida.valor;
    const setActiveTab = (valor) => setAbaEscolhida({ chave: filtroDaUrl, valor });

    // --- MODAL ---
    const [selectedSessionForDetails, setSelectedSessionForDetails] = useState(null);

    // --- DIÁRIO ---
    const journal = useJournal({ user, active: activeTab === 'journal' });
    const openJournal = () => {
        setActiveTab('journal');
        if (journal.sessions.length === 0) journal.loadJournal(true);
    };

    // --- EVOLUÇÃO ---
    const filters = useAnalyticsFilters({ user, activeTab, initialTemplate, initialExercise });
    const global = useGlobalSessions(user);
    const history = useExerciseHistory({
        user,
        activeTab,
        searchMode: filters.searchMode,
        selectedTemplate: filters.selectedTemplate,
        selectedExercise: filters.selectedExercise,
        selectedGlobalExercises: filters.selectedGlobalExercises,
        globalSearchTerm: filters.globalSearchTerm,
        chartRange: filters.chartRange,
        globalSessions: global.globalSessions,
        primeGlobalSessions: global.primeGlobalSessions
    });

    return (
        <div
            data-testid="history-page"
            className="min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-[#020617] pb-8 lg:pb-12"
        >
            {/* --- CABEÇALHO --- */}
            <div className="sticky top-0 z-40 bg-[#020617]/95 backdrop-blur-md pt-2 pb-4 lg:pt-[calc(1.5rem+env(safe-area-inset-top))]">
                <div className="w-full max-w-5xl mx-auto px-4 space-y-4">
                    {!isEmbedded && (
                        <PageHeader
                            title="Histórico"
                            description="Revise treinos concluídos e acompanhe evolução de carga."
                            icon={<History size={20} />}
                            onBack={onBack}
                            className="mb-5"
                        />
                    )}

                    {/* ABAS */}
                    <div className="grid grid-cols-2 bg-[#0f172a] p-1.5 rounded-full border border-slate-800 relative">
                        <button
                            onClick={openJournal}
                            className={`py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'journal'
                                ? 'bg-[#1e293b] text-white shadow-lg shadow-black/20'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Diário
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'analytics'
                                ? 'bg-[#1e293b] text-cyan-400 shadow-lg shadow-black/20'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Evolução
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6">
                {/* === VISÃO DE DIÁRIO === */}
                {activeTab === 'journal' && (
                    <JournalSection
                        loadingSessions={journal.loadingSessions}
                        sessions={journal.sessions}
                        groupedSessions={journal.groupedSessions}
                        hasMoreJournal={journal.hasMoreJournal}
                        fetchingMore={journal.fetchingMore}
                        onLoadMore={() => journal.loadJournal(false)}
                        hasLocallyHiddenSessions={journal.hasLocallyHiddenSessions}
                        onRevealMore={journal.revealMoreRenderedSessions}
                        sentinelRef={journal.journalRenderSentinelRef}
                        onSelectSession={setSelectedSessionForDetails}
                    />
                )}

                {/* === VISÃO DE ANÁLISE === */}
                {activeTab === 'analytics' && (
                    <React.Suspense fallback={
                        <div className="py-20 text-center">
                            <Activity className="animate-spin w-8 h-8 text-cyan-500 mx-auto mb-4" />
                            <p className="text-slate-500 text-sm">Carregando dados...</p>
                        </div>
                    }>
                        <HistoryAnalyticsSection
                            loadingTemplates={filters.loadingTemplates}
                            templates={filters.templates}
                            selectedTemplate={filters.selectedTemplate}
                            onTemplateChange={filters.setSelectedTemplate}
                            selectedExercise={filters.selectedExercise}
                            onExerciseChange={filters.setSelectedExercise}
                            exerciseOptions={filters.exerciseOptions}
                            chartRange={filters.chartRange}
                            onChartRangeChange={filters.setChartRange}
                            chartData={history.chartData}
                            loadingHistory={history.loadingHistory}
                            historyRows={history.historyRows}
                            prRows={history.prRows}
                            searchMode={filters.searchMode}
                            onSearchModeChange={filters.setSearchMode}
                            globalSearchTerm={filters.globalSearchTerm}
                            onGlobalSearchChange={filters.setGlobalSearchTerm}
                            allUserExercises={global.allUserExercises}
                            selectedGlobalExercises={filters.selectedGlobalExercises}
                            toggleGlobalExercise={filters.toggleGlobalExercise}
                            globalHistorySessionCount={global.globalSessions?.length || 0}
                            hasMoreGlobalHistory={global.hasMoreGlobalSessions}
                            loadingMoreGlobalHistory={global.loadingMoreGlobalSessions}
                            onLoadMoreGlobalHistory={global.loadMoreGlobalSessions}
                        />
                    </React.Suspense>
                )}
            </div>
            {/* MODAL DE DETALHES */}
            {selectedSessionForDetails && (
                <React.Suspense fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                    </div>
                }>
                    <WorkoutDetailsModal
                        session={selectedSessionForDetails}
                        onClose={() => setSelectedSessionForDetails(null)}
                        user={user}
                    />
                </React.Suspense>
            )}
        </div>
    );
}

export default HistoryPage;
