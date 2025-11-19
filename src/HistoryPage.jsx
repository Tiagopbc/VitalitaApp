// src/HistoryPage.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { db } from './firebaseConfig';
import {
    collection,
    getDocs,
    orderBy,
    query
} from 'firebase/firestore';

function HistoryPage({ onBack, initialExercise }) {
    const [loading, setLoading] = useState(true);

    // mapa: nomeExercicio -> lista de registros
    const [exerciseHistory, setExerciseHistory] = useState({});
    const [exerciseList, setExerciseList] = useState([]);

    // filtros
    const [selectedExercise, setSelectedExercise] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('todos');

    useEffect(() => {
        async function loadHistory() {
            setLoading(true);

            try {
                // busca sessões de treino
                const sessionsQ = query(
                    collection(db, 'workout_sessions'),
                    orderBy('completedAt', 'desc')
                );
                const sessionsSnap = await getDocs(sessionsQ);

                const historyMap = {};
                const templateNamesSet = new Set();

                sessionsSnap.forEach((docSnap) => {
                    const data = docSnap.data();
                    const results = data.results || {};
                    const templateName = data.templateName || data.templateId || 'Sem nome';
                    const completedAt = data.completedAt?.toDate
                        ? data.completedAt.toDate()
                        : null;

                    templateNamesSet.add(templateName);

                    Object.entries(results).forEach(([exerciseName, r]) => {
                        const weight = Number(r.weight) || 0;
                        const reps = Number(r.reps) || 0;
                        const target = r.target || '';
                        const note = r.note || '';

                        if (!historyMap[exerciseName]) {
                            historyMap[exerciseName] = [];
                        }

                        historyMap[exerciseName].push({
                            date: completedAt,
                            weight,
                            reps,
                            volume: weight * reps,
                            templateName,
                            target,
                            note
                        });
                    });
                });

                // calcula PR por exercício e marca no histórico
                Object.keys(historyMap).forEach((exerciseName) => {
                    const list = historyMap[exerciseName];

                    let bestWeight = 0;
                    let bestReps = 0;

                    list.forEach((entry) => {
                        if (entry.weight > bestWeight) {
                            bestWeight = entry.weight;
                            bestReps = entry.reps;
                        } else if (
                            entry.weight === bestWeight &&
                            entry.reps > bestReps
                        ) {
                            bestReps = entry.reps;
                        }
                    });

                    historyMap[exerciseName] = list
                        .map((entry) => ({
                            ...entry,
                            isPr:
                                bestWeight > 0 &&
                                entry.weight === bestWeight &&
                                entry.reps === bestReps
                        }))
                        .sort((a, b) => {
                            const tA = a.date ? a.date.getTime() : 0;
                            const tB = b.date ? b.date.getTime() : 0;
                            return tB - tA;
                        });
                });

                const exerciseNames = Object.keys(historyMap).sort((a, b) =>
                    a.localeCompare(b, 'pt-BR')
                );

                setExerciseHistory(historyMap);
                setExerciseList(exerciseNames);
                setTemplates(['todos', ...Array.from(templateNamesSet).sort()]);
                setSelectedExercise(
                    initialExercise && exerciseNames.includes(initialExercise)
                        ? initialExercise
                        : exerciseNames[0] || ''
                );
            } catch (error) {
                console.error('Erro ao carregar histórico', error);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [initialExercise]);

    const filteredEntries = useMemo(() => {
        if (!selectedExercise || !exerciseHistory[selectedExercise]) {
            return [];
        }

        const base = exerciseHistory[selectedExercise];

        if (selectedTemplate === 'todos') {
            return base;
        }

        return base.filter(
            (entry) => entry.templateName === selectedTemplate
        );
    }, [exerciseHistory, selectedExercise, selectedTemplate]);

    const formatDate = (date) => {
        if (!date) {
            return 'sem data';
        }
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    };

    const formatWeight = (w) => {
        if (!w) return '0 kg';
        return `${w.toFixed(1).replace('.', ',')} kg`;
    };

    // dados do gráfico, usa só os últimos 12 registros para ficar limpo
    const chartData = useMemo(() => {
        if (!filteredEntries.length) return [];

        const recent = [...filteredEntries]
            .slice()
            .reverse()
            .slice(-12);

        return recent;
    }, [filteredEntries]);

    const renderChart = () => {
        if (!chartData.length) {
            return (
                <p className="history-chart-empty">
                    Sem dados suficientes para gráfico deste exercício.
                </p>
            );
        }

        const width = 280;
        const height = 140;
        const paddingX = 24;
        const paddingY = 20;

        const maxWeight = Math.max(
            ...chartData.map((e) => e.weight),
            1
        );

        const usableWidth = width - paddingX * 2;
        const usableHeight = height - paddingY * 2;

        const stepX =
            chartData.length > 1
                ? usableWidth / (chartData.length - 1)
                : 0;

        const points = chartData.map((entry, index) => {
            const x = paddingX + index * stepX;
            const y =
                paddingY +
                usableHeight * (1 - entry.weight / maxWeight);
            return { x, y, weight: entry.weight, reps: entry.reps };
        });

        const pathD =
            points.length > 1
                ? points
                    .map((p, index) =>
                        index === 0
                            ? `M ${p.x} ${p.y}`
                            : `L ${p.x} ${p.y}`
                    )
                    .join(' ')
                : '';

        return (
            <svg
                className="history-chart"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Gráfico de evolução de carga"
            >
                {/* eixo base */}
                <line
                    x1={paddingX}
                    y1={height - paddingY}
                    x2={width - paddingX}
                    y2={height - paddingY}
                    className="history-chart-axis"
                />

                {/* linha de peso */}
                {pathD && (
                    <path
                        d={pathD}
                        className="history-chart-line"
                    />
                )}

                {/* pontos */}
                {points.map((p, index) => (
                    <g key={index}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={3}
                            className="history-chart-point"
                        />
                        <text
                            x={p.x}
                            y={p.y - 6}
                            className="history-chart-label"
                            textAnchor="middle"
                        >
                            {p.weight.toFixed(1).replace('.', ',')}
                        </text>
                    </g>
                ))}
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="history-page">
                <button
                    type="button"
                    className="btn-back-primary"
                    onClick={onBack}
                >
                    Voltar
                </button>
                <p>Carregando histórico de exercícios...</p>
            </div>
        );
    }

    return (
        <div className="history-page">
            <button
                type="button"
                className="btn-back-primary"
                onClick={onBack}
            >
                Voltar
            </button>

            <h2>Histórico por exercício</h2>

            <p className="history-intro">
                Selecione um exercício para ver a evolução de carga, repetições e recordes pessoais.
            </p>

            <div className="history-content">
                {/* filtros */}
                <div className="history-filters">
                    {/* primeiro a rotina */}
                    <div className="history-filter-group">
                        <label htmlFor="template-select">Rotina</label>
                        <select
                            id="template-select"
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                        >
                            {templates.map((tpl) => (
                                <option key={tpl} value={tpl}>
                                    {tpl === 'todos' ? 'Todas' : tpl}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* depois o exercício */}
                    <div className="history-filter-group">
                        <label htmlFor="exercise-select">Exercício</label>
                        <select
                            id="exercise-select"
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                        >
                            {exerciseList.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* gráfico e tabela */}
                <div className="history-chart-card">
                    <h3>Evolução da carga</h3>
                    {renderChart()}
                </div>

                <div className="history-card">
                    <div className="history-card-header">
                        <h3>Sessões registradas</h3>
                        <span>
              {filteredEntries.length} registros
            </span>
                    </div>

                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                            <tr>
                                <th>Data</th>
                                <th>Rotina</th>
                                <th>Peso</th>
                                <th>Reps</th>
                                <th>Volume</th>
                                <th>PR</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredEntries.map((entry, index) => (
                                <tr
                                    key={index}
                                    className={
                                        entry.isPr ? 'history-row-pr' : ''
                                    }
                                >
                                    <td>{formatDate(entry.date)}</td>
                                    <td>{entry.templateName}</td>
                                    <td>{formatWeight(entry.weight)}</td>
                                    <td>{entry.reps}</td>
                                    <td>{entry.volume}</td>
                                    <td>{entry.isPr ? '★' : ''}</td>
                                </tr>
                            ))}
                            {filteredEntries.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        Nenhum registro encontrado para este filtro.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HistoryPage;