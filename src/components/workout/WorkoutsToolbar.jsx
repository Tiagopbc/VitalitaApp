/**
 * WorkoutsToolbar.jsx
 * Topo de Meus Treinos: cabeçalho (com "Concluir" no modo Ordem), atalhos
 * Modelos/Cardio/Ordem e "Novo treino", e a faixa do modo Ordem ou a busca
 * com os filtros de origem. JSX movido de WorkoutsPage (D19).
 */
import React from 'react';
import { Activity, Check, Dumbbell, ListOrdered, Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '../design-system/Button';
import { PageHeader } from '../design-system/PageHeader';
import { SourceFilterChips } from './SourceFilterChips';

export function WorkoutsToolbar({
    isTrainerMode,
    isOrganizing,
    savingOrder,
    onToggleOrganizing,
    onOpenLibrary,
    onOpenCardio,
    onCreate,
    workoutCount,
    searchQuery,
    onSearchChange,
    sourceFilter,
    sourceCounts,
    onSourceFilterChange
}) {
    return (
        <div className="space-y-4 pt-2 mb-8 lg:space-y-5 lg:pt-6">
            {/* Top Bar - Hide if Trainer Mode */}
            {!isTrainerMode && (
                <PageHeader
                    title="Meus Treinos"
                    description="Gerencie suas fichas, modelos do personal e treinos arquivados."
                    icon={<Dumbbell size={22} />}
                    action={isOrganizing ? (
                        <Button
                            size="sm"
                            onClick={onToggleOrganizing}
                            disabled={savingOrder}
                            className="w-full rounded-xl sm:w-auto"
                            leftIcon={<Check size={16} />}
                        >
                            Concluir
                        </Button>
                    ) : null}
                    className="mb-0"
                />
            )}

            {/* Bloco de ações: "Novo treino" em destaque + atalhos compactos.
                Antes eram quatro botões dividindo a largura do celular, e o
                rótulo de cada um ficava espremido contra o próprio ícone. */}
            {!isTrainerMode && !isOrganizing && (
                <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/95 p-3 shadow-md">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <div className="grid grid-cols-3 gap-2 sm:flex-1 sm:order-1">
                            {[
                                { id: 'modelos', label: 'Modelos', icon: <Sparkles size={17} />, onClick: onOpenLibrary },
                                { id: 'cardio', label: 'Cardio', icon: <Activity size={17} />, onClick: onOpenCardio },
                                { id: 'ordem', label: 'Ordem', icon: <ListOrdered size={17} />, onClick: onToggleOrganizing }
                            ].map(shortcut => (
                                <Button
                                    key={shortcut.id}
                                    variant="unstyled"
                                    haptic="light"
                                    onClick={shortcut.onClick}
                                    className="flex h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-cyan-500/30 hover:bg-slate-800/70 hover:text-white sm:flex-row sm:gap-2"
                                >
                                    <span className="text-cyan-400">{shortcut.icon}</span>
                                    <span className="text-[11px] font-semibold tracking-wide sm:text-xs">{shortcut.label}</span>
                                </Button>
                            ))}
                        </div>

                        <Button
                            onClick={onCreate}
                            className="h-12 w-full rounded-2xl sm:order-2 sm:h-auto sm:w-auto sm:px-6"
                            leftIcon={<Plus size={18} />}
                        >
                            Novo treino
                        </Button>
                    </div>
                </div>
            )}

            {isOrganizing ? (
                <div className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3 text-cyan-300">
                        <ListOrdered size={20} className="shrink-0" />
                        <span className="truncate text-sm font-semibold">Ordem dos treinos ativos</span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                        {savingOrder ? 'Salvando...' : `${workoutCount} treinos`}
                    </span>
                </div>
            ) : (
                <div className="overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/95 shadow-md">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            aria-label="Buscar treinos"
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Buscar por nome ou músculo..."
                            className="w-full pl-12 pr-4 py-4 bg-transparent border-none text-white placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-500 rounded-3xl transition-colors"
                        />
                    </div>

                    {!isTrainerMode && (
                        <SourceFilterChips
                            value={sourceFilter}
                            counts={sourceCounts}
                            onChange={onSourceFilterChange}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
