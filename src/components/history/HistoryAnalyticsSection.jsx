import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

const EvolutionChart = React.lazy(() => import('../analytics/EvolutionChart').then(module => ({ default: module.EvolutionChart })));

export function HistoryAnalyticsSection({
    loadingTemplates,
    templates,
    selectedTemplate,
    onTemplateChange,
    selectedExercise,
    onExerciseChange,
    exerciseOptions,
    chartRange,
    onChartRangeChange,
    chartData,
    loadingHistory,
    historyRows,
    prRows
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingTemplates ? (
                <div className="py-20 text-center">
                    <Activity className="animate-spin w-8 h-8 text-cyan-500 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Carregando dados...</p>
                </div>
            ) : (
                <>
                    {/* Filtros */}
                    <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1">Rotina</label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => onTemplateChange(e.target.value)}
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
                                onChange={(e) => onExerciseChange(e.target.value)}
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

                    {/* Seção de Gráfico */}
                    {selectedTemplate && selectedExercise && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-bold text-slate-400 uppercase tracking-wide text-xs">Evolução de Carga</h3>
                                <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                                    {['1M', '3M', '6M', '1Y', 'ALL'].map(range => (
                                        <button
                                            key={range}
                                            onClick={() => onChartRangeChange(range)}
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
                            <React.Suspense fallback={
                                <div className="h-72 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                                    <p className="text-slate-500 text-sm">Carregando gráfico...</p>
                                </div>
                            }>
                                <EvolutionChart data={chartData} range={chartRange} />
                            </React.Suspense>
                        </div>
                    )}

                    {/* Resultados */}
                    {loadingHistory ? (
                        <div className="py-10 text-center"><p className="text-slate-500">Buscando histórico...</p></div>
                    ) : historyRows.length > 0 ? (
                        <>
                            {/* Seção de PR */}
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

                            {/* Lista Detalhada */}
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
    );
}
