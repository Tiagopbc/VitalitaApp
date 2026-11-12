/**
 * ReorderableExerciseItem.jsx
 * Um exercício na lista da ficha: arrastável pela alça (framer-motion
 * Reorder), clicável para editar, com o botão de corrente para agrupar com o
 * anterior e o de remover. Movido de CreateWorkoutPage (D18) sem mudança.
 */
import React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Link2, Trash2 } from 'lucide-react';
import { Button } from '../design-system/Button';

export function ReorderableExerciseItem({ ex, index, handleEditExercise, removeExercise, groupBadge, canLink, isLinkedToPrev, onToggleLink }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            key={ex.id}
            id={ex.id}
            value={ex}
            dragListener={false}
            dragControls={dragControls}
            className={`p-4 rounded-[14px] border bg-[#0f172a]/80 flex items-center gap-3 cursor-pointer hover:border-cyan-500/50 transition-colors select-none ${groupBadge ? 'border-cyan-500/40 border-l-4 border-l-cyan-500/70' : 'border-slate-400/35'}`}
            onClick={() => handleEditExercise(ex)}
        >
            <div
                className="text-slate-500 cursor-grab active:cursor-grabbing p-2 -ml-2 touch-none"
                onPointerDown={(e) => {
                    e.stopPropagation();
                    dragControls.start(e);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <GripVertical size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[0.7rem] text-cyan-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
                    <span>{ex.muscleGroup || ex.group || ex.muscleFocus?.primary || 'Geral'}</span>
                    {groupBadge && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[0.6rem] normal-case tracking-normal">
                            <Link2 size={10} /> {groupBadge}
                        </span>
                    )}
                </div>
                <div className="text-[0.95rem] font-semibold text-gray-200 mb-1 uppercase truncate">
                    {index + 1}. {ex.name}
                </div>
                <div className="text-[0.8rem] text-slate-400 font-medium truncate">
                    {ex.sets || '?'} sets × {ex.reps || '?'} reps • {ex.method || 'Convencional'}
                    {ex.targetWeight && <span className="text-cyan-400/80 ml-1">• {ex.targetWeight} kg</span>}
                    {ex.rest && <span className="text-slate-500 ml-1">• ⏱ {ex.rest}</span>}
                </div>
                {ex.notes && (
                    <div className="text-[0.75rem] text-slate-500 italic mt-0.5 truncate">
                        Obs: {ex.notes}
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 flex flex-col gap-2">
                {canLink && (
                    <Button
                        variant="unstyled"
                        title={isLinkedToPrev
                            ? 'Desagrupar do exercício anterior'
                            : 'Agrupar com o exercício anterior (bi-set/tri-set)'}
                        aria-label={isLinkedToPrev
                            ? `Desagrupar ${ex.name} do exercício anterior`
                            : `Agrupar ${ex.name} com o exercício anterior`}
                        aria-pressed={!!isLinkedToPrev}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLink(ex.id);
                        }}
                        className={`w-8 h-8 p-0 rounded-lg border flex items-center justify-center transition-colors ${isLinkedToPrev
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/25'
                            : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40'}`}
                    >
                        <Link2 size={16} />
                    </Button>
                )}
                <Button
                    variant="danger"
                    size="xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        removeExercise(ex.id);
                    }}
                    className="w-8 h-8 p-0 rounded-lg bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                >
                    <Trash2 size={16} />
                </Button>
            </div>
        </Reorder.Item>
    );
}
