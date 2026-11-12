/**
 * usePdfImportQueue.js
 * Importação por PDF na própria tela de criação: o input de arquivo, o estado
 * "lendo o PDF" e a fila de revisão — o PDF pode trazer vários treinos (A, B,
 * C), revisados e salvos um por vez. A função serverless só parseia; quem
 * grava é o salvamento, por workoutService (ver o skill importacao-pdf-treino).
 * Lógica movida de CreateWorkoutPage (D18) sem mudança.
 */
import { useRef, useState } from 'react';
import { notify } from '../../utils/notifyStore';
import { importWorkoutFromPdf } from '../../services/workoutPdfImport';

export function usePdfImportQueue({ loadWorkoutIntoForm }) {
    const pdfInputRef = useRef(null);
    const [importingPdf, setImportingPdf] = useState(false);
    // Fila de revisão: o PDF pode trazer vários treinos (A, B, C). Revisamos e
    // salvamos um por vez; ao salvar, o próximo aparece nesta mesma tela.
    const [importQueue, setImportQueue] = useState(null); // { workouts: [...], index }

    const hasNextInQueue = !!importQueue && importQueue.index + 1 < importQueue.workouts.length;

    async function handlePdfSelected(event) {
        const file = event.target.files?.[0];
        event.target.value = ''; // permite reimportar o mesmo arquivo
        if (!file) return;

        setImportingPdf(true);
        try {
            const { workouts } = await importWorkoutFromPdf(file);
            setImportQueue({ workouts, index: 0 });
            loadWorkoutIntoForm(workouts[0]);
            if (workouts.length > 1) {
                notify.success(`${workouts.length} treinos encontrados. Revise o 1º e salve — os próximos aparecem em seguida.`);
            } else {
                notify.success(`Treino importado (${workouts[0].exercises.length} exercícios). Revise antes de salvar.`);
            }
        } catch (err) {
            notify.error(err.message || 'Não foi possível importar o PDF.');
        } finally {
            setImportingPdf(false);
        }
    }

    /**
     * Depois de salvar: se há mais treinos no PDF, carrega o próximo e devolve
     * { nextIndex, total }; senão devolve null.
     */
    function advanceQueue() {
        if (!hasNextInQueue) return null;
        const nextIndex = importQueue.index + 1;
        setImportQueue({ ...importQueue, index: nextIndex });
        loadWorkoutIntoForm(importQueue.workouts[nextIndex]);
        return { nextIndex, total: importQueue.workouts.length };
    }

    return { pdfInputRef, importingPdf, importQueue, hasNextInQueue, handlePdfSelected, advanceQueue };
}
