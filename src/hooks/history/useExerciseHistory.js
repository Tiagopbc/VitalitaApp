/**
 * useExerciseHistory.js
 * Busca e monta as linhas de histórico, os PRs e os pontos do gráfico da aba
 * Evolução, nos dois modos (template e busca global).
 *
 * `loadingHistory` é derivado: o resultado guarda a chave dos filtros que o
 * geraram e, se a chave atual é outra, a busca está em andamento. Isso tira o
 * setState síncrono do efeito (warning do D16) e, de quebra, descarta uma
 * resposta atrasada de filtros anteriores, que antes sobrescrevia a atual.
 */
import { useEffect, useState } from 'react';
import { SESSION_LIMITS, workoutService } from '../../services/workoutService';
import { buildHistoryRows, filterRowsByRange } from './historyRows';

const TEMPLATE_ANALYTICS_PAGE_SIZE = 100;
const VAZIO = { rows: [], prRows: [], chartData: [] };

export function useExerciseHistory({
    user,
    activeTab,
    searchMode,
    selectedTemplate,
    selectedExercise,
    selectedGlobalExercises,
    globalSearchTerm,
    chartRange,
    globalSessions,
    primeGlobalSessions
}) {
    const [resultado, setResultado] = useState({ key: null, ...VAZIO });

    const semBuscaGlobal = searchMode === 'global'
        && selectedGlobalExercises.length === 0
        && (!globalSearchTerm || globalSearchTerm.length < 2);
    const semFiltroDeTemplate = searchMode === 'template' && (!selectedTemplate || !selectedExercise);
    const deveBuscar = activeTab === 'analytics' && !!user && !semFiltroDeTemplate && !semBuscaGlobal;

    const requestKey = deveBuscar
        ? JSON.stringify([
            user.uid, searchMode, selectedTemplate, selectedExercise,
            selectedGlobalExercises, globalSearchTerm, chartRange,
            globalSessions ? globalSessions.length : -1
        ])
        : null;

    useEffect(() => {
        if (!deveBuscar) return undefined;
        let ativo = true;

        async function fetchHistory() {
            try {
                let docs = [];

                if (searchMode === 'global') {
                    if (globalSessions) {
                        docs = globalSessions;
                    } else {
                        const result = await workoutService.getHistory(
                            user.uid,
                            null,
                            null,
                            SESSION_LIMITS.analyticsGlobalPage
                        );
                        if (!ativo) return;
                        docs = result.data;
                        primeGlobalSessions(result);
                    }
                } else {
                    const result = await workoutService.getHistory(user.uid, selectedTemplate, null, TEMPLATE_ANALYTICS_PAGE_SIZE);
                    if (!ativo) return;
                    docs = result.data;
                }

                const { rows, prRows } = buildHistoryRows(docs, { searchMode, selectedExercise, selectedGlobalExercises });
                const chartData = filterRowsByRange(rows, chartRange);
                if (ativo) setResultado({ key: requestKey, rows, prRows, chartData });
            } catch (err) {
                console.error('Erro ao carregar histórico', err);
                if (ativo) setResultado((prev) => ({ ...prev, key: requestKey }));
            }
        }

        fetchHistory();
        return () => { ativo = false; };
    }, [
        deveBuscar, requestKey, user, searchMode, selectedTemplate, selectedExercise,
        selectedGlobalExercises, chartRange, globalSessions, primeGlobalSessions
    ]);

    // Busca global sem seleção mostra listas vazias, como antes; por derivação,
    // sem escrever estado.
    const visivel = semBuscaGlobal ? VAZIO : resultado;

    return {
        historyRows: visivel.rows,
        prRows: visivel.prRows,
        chartData: visivel.chartData,
        loadingHistory: requestKey !== null && resultado.key !== requestKey
    };
}
