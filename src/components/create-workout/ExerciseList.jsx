/**
 * ExerciseList.jsx
 * A lista de exercícios da ficha: estado vazio com "Adicionar Exercício" ou a
 * lista arrastável, com o rótulo de grupo de cada item calculado do groupId.
 * JSX movido de CreateWorkoutPage (D18).
 */
import React from 'react';
import { Reorder } from 'framer-motion';
import { Dumbbell, Plus } from 'lucide-react';
import { Button } from '../design-system/Button';
import { EmptyState } from '../design-system/EmptyState';
import { groupBadgesByIndex } from '../../hooks/create-workout/exerciseList';
import { ReorderableExerciseItem } from './ReorderableExerciseItem';

export function ExerciseList({ exercises, showAddExercise, onReorder, onAddFirst, onEdit, onRemove, onToggleLink }) {
    const badgeByIndex = groupBadgesByIndex(exercises);

    return (
        <div className="mb-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Exercícios ({exercises.length})
            </h3>

            {exercises.length === 0 && !showAddExercise ? (
                <EmptyState
                    icon={<Dumbbell size={24} />}
                    title="Nenhum exercício adicionado"
                    description="Adicione o primeiro exercício para habilitar o salvamento da ficha."
                    action={
                        <Button
                            onClick={onAddFirst}
                            variant="secondary"
                            size="sm"
                            leftIcon={<Plus size={16} />}
                        >
                            Adicionar Exercício
                        </Button>
                    }
                    className="py-8"
                />
            ) : (
                <Reorder.Group
                    axis="y"
                    values={exercises}
                    onReorder={onReorder}
                    className="space-y-3"
                >
                    {exercises.map((ex, index) => (
                        <ReorderableExerciseItem
                            key={ex.id}
                            ex={ex}
                            index={index}
                            handleEditExercise={onEdit}
                            removeExercise={onRemove}
                            groupBadge={badgeByIndex[index] || null}
                            canLink={index > 0}
                            isLinkedToPrev={index > 0 && !!ex.groupId && ex.groupId === exercises[index - 1]?.groupId}
                            onToggleLink={onToggleLink}
                        />
                    ))}
                </Reorder.Group>
            )}
        </div>
    );
}
