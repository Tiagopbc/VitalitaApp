/**
 * useSaveWorkout.js
 * Salvar a ficha: atualiza a existente ou cria uma nova, sempre por
 * workoutService (caminho único de escrita em workout_templates — ver o skill
 * escrita-workout-templates). Com fila de PDF, carrega o próximo treino em vez
 * de sair. Lógica movida de CreateWorkoutPage (D18) sem mudança.
 */
import { useState } from 'react';
import { normalizeGroups } from '../../utils/exerciseGroups';
import { notify } from '../../utils/notifyStore';
import { workoutService } from '../../services/workoutService';

export function useSaveWorkout({ user, initialData, creationContext, workoutName, exercises, advanceQueue, onBack }) {
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        if (!workoutName || exercises.length === 0) {
            notify.error("Informe um nome e adicione pelo menos um exercício.");
            return;
        }

        setSaving(true);
        try {
            // Determinar Usuário Alvo (aluno vinculado) ou o próprio usuário.
            const targetUserId = creationContext?.targetUserId || user.uid;

            // Sanitizar o array de exercícios para remover propriedades undefined,
            // Proxies ou referências circulares que o framer-motion possa ter injetado
            const sanitizedExercises = JSON.parse(JSON.stringify(normalizeGroups(exercises)));

            if (initialData?.id) {
                // ATUALIZAR ficha existente
                await workoutService.updateTemplate(initialData.id, {
                    name: workoutName,
                    exercises: sanitizedExercises
                });
            } else {
                // CRIAR (inclui revisão de importação por PDF, que chega sem id)
                await workoutService.createTemplate({
                    name: workoutName,
                    exercises: sanitizedExercises,
                    targetUserId,
                    createdBy: user.uid
                });
            }

            // Fila de importação: se há mais treinos no PDF, carrega o próximo em
            // vez de sair, para o usuário revisar e salvar um a um.
            const proximo = advanceQueue();
            if (proximo) {
                setSaving(false);
                notify.success(`Treino salvo. Revise o próximo (${proximo.nextIndex + 1} de ${proximo.total}).`);
                return;
            }
            // Caminho normal: até aqui salvava e voltava pra lista em silêncio.
            // A barra vive na raiz autenticada, então o aviso sobrevive ao
            // `onBack()` e aparece já sobre a lista.
            notify.success('Treino salvo.');
            onBack();
        } catch (err) {
            console.error(err);
            notify.error("Erro ao salvar treino.");
        } finally {
            setSaving(false);
        }
    }

    return { saving, handleSave };
}
