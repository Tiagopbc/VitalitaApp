// src/HistoryPage.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { db } from './firebaseConfig';
import {
    collection,
    getDocs,
    orderBy,
    query
} from 'firebase/firestore';

function HistoryPage({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [exerciseHistory, setExerciseHistory] = useState({});
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('todos');
    const [selectedExercise, setSelectedExercise] = useState('');

    useEffect(() => {
        async function loadHistory() {
            try {
                const sessionsRef = collection(db, 'workout_sessions');
                const q = query(sessionsRef, orderBy('completedAt', 'asc'));
                const snapshot = await getDocs(q);

                const historyByExercise = {};
                const templateNames = new Set();

                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const templateName = data.templateName || 'Treino';
                    templateNames.add(templateName);

                    let completedAt = data.completedAt;
                    let completedDate;

                    if (completedAt && typeof completedAt.toDate === 'function') {
                        completedDate = completedAt.toDate();
                    } else if (data.createdAt) {
                        completedDate = new Date(data.createdAt);
                    } else {
                        completedDate = new Date();
                    }

                    const results = data.results || {};

                    Object.entries(results).forEach(([exerciseName, result]) => {
                        if (!historyByExercise[exerciseName]) {
                            historyByExercise[exerciseName] = [];
                        }

                        historyByExercise[exerciseName].push({
                            id: docSnap.id,
                            date: completedDate,
                            templateName,
                            weight: typeof result.weight === 'number'
                                ? result.weight
                                : Number(result.weight) || 0,
                            target: result.target || ''
                        });
                    });
                });

                Object.keys(historyByExercise).forEach((name) => {
                    historyByExercise[name].sort((a, b) => a.date - b.date);
                });

                setExerciseHistory(historyByExercise);
                setTemplates(['todos', ...Array.from(templateNames).sort()]);
            } catch (error) {
                console.error('Erro ao carregar histórico', error);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, []);

    const allExerciseNames = useMemo(
        () => Object.keys(exerciseHistory).sort((a, b) => a.localeCompare(b)),
        [exerciseHistory]
    );

    const filteredExercises = useMemo(() => {
        if (selectedTemplate === 'todos') {
            return allExerciseNames;
        }

        return allExerciseNames.filter((name) => {
            const entries = exerciseHistory[name] || [];
            return entries.some((entry) => entry.templateName === selectedTemplate);
        });
    }, [allExerciseNames, exerciseHistory, selectedTemplate]);

    const currentExerciseEntries = useMemo(() => {
        if (!selectedExercise || !exerciseHistory[selectedExercise]) {
            return [];
        }

        const base = exerciseHistory[selectedExercise];

        if (selectedTemplate === 'todos') {
            return base;
        }

        return base.filter((entry) => entry.templateName === selectedTemplate);
    }, [exerciseHistory, selectedExercise, selectedTemplate]);

    const formatDate = (date) => {
        if (!date) {
            return '';
        }

        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    };

    const formatWeight = (value) => {
        if (!value) {
            return '-';
        }
        return `${value.toFixed(1)} kg`;
    };

    const renderChart = () => {
        const entries = currentExerciseEntries;

        if (!entries.length) {
            return (
                <p className="history-chart-empty">
                    Selecione um exercício para ver a evolução das cargas.
                </p>
            );
        }

        if (entries.length === 1) {
            return (
                <p className="history-chart-empty">
                    Faça mais sessões com este exercício para ver o gráfico de evolução.
                </p>
            );
        }

        const weights = entries.map((e) => e.weight || 0);
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);

        const width = 320;
        const height = 160;
        const paddingX = 32;
        const paddingY = 24;

        const range = maxWeight - minWeight || 1;

        const points = entries.map((entry, index) => {
            const x =
                entries.length === 1
                    ? width / 2
                    : paddingX +
                    ((width - paddingX * 2) * index) /
                    (entries.length - 1);

            const normalized = (entry.weight - minWeight) / range;
            const y = height - paddingY - normalized * (height - paddingY * 2);

            return { x, y, entry };
        });

        const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

        return (
            <svg
                className="history-chart"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
            >
                <line
                    x1={paddingX}
                    y1={height - paddingY}
                    x2={width - paddingX}
                    y2={height - paddingY}
                    className="history-chart-axis"
                />
                <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={paddingX}
                    y2={height - paddingY}
                    className="history-chart-axis"
                />

                <polyline
                    points={polylinePoints}
                    className="history-chart-line"
                    fill="none"
                />

                {points.map((p, index) => (
                    <g key={index}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={3.2}
                            className="history-chart-point"
                        />
                        <text
                            x={p.x}
                            y={p.y - 8}
                            className="history-chart-label"
                        >
                            {p.entry.weight}
                        </text>
                        <text
                            x={p.x}
                            y={height - paddingY + 14}
                            className="history-chart-date"
                        >
                            {formatDate(p.entry.date)}
                        </text>
                    </g>
                ))}
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="history-page">
                <button className="btn-back-primary" onClick={onBack}>
                    Voltar
                </button>
                <h2>Históricos</h2>
                <p className="history-intro">Carregando histórico...</p>
            </div>
        );
    }

    if (!allExerciseNames.length) {
        return (
            <div className="history-page">
                <button className="btn-back-primary" onClick={onBack}>
                    Voltar
                </button>
                <h2>Históricos</h2>
                <p className="history-intro">
                    Ainda não há treinos registrados. Salve um treino para começar a ver a evolução.
                </p>
            </div>
        );
    }

    return (
        <div className="history-page">
            <button className="btn-back-primary" onClick={onBack}>
                Voltar
            </button>

            <h2>Históricos</h2>
            <p className="history-intro">
                Aqui eu acompanho como meus pesos evoluíram em cada exercício ao longo do tempo.
            </p>

            <div className="history-filters">
                <div className="history-filter-row">
                    <div className="history-filter">
                        <label>Filtrar por treino</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => {
                                setSelectedTemplate(e.target.value);
                                setSelectedExercise('');
                            }}
                        >
                            {templates.map((tpl) => (
                                <option key={tpl} value={tpl}>
                                    {tpl === 'todos' ? 'Todos os treinos' : tpl}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="history-filter">
                        <label>Exercício</label>
                        <select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                        >
                            <option value="">Selecione um exercício</option>
                            {filteredExercises.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="history-chart-card">
                <h3>Evolução do peso</h3>
                <p className="history-chart-title">
                    {selectedExercise
                        ? `Exercício: ${selectedExercise}`
                        : 'Selecione um exercício para visualizar o gráfico.'}
                </p>
                {renderChart()}
            </div>

            {selectedExercise && currentExerciseEntries.length > 0 && (
                <div className="history-card">
                    <div className="history-card-header">
                        <h3>Histórico detalhado</h3>
                        <span>
              {selectedExercise} ·{' '}
                            {selectedTemplate === 'todos'
                                ? 'Todos os treinos'
                                : `Treino ${selectedTemplate}`}
            </span>
                    </div>

                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                            <tr>
                                <th>Data</th>
                                <th>Treino</th>
                                <th>Peso</th>
                                <th>Meta</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentExerciseEntries.map((entry) => (
                                <tr key={entry.id + String(entry.date)}>
                                    <td>{formatDate(entry.date)}</td>
                                    <td>{entry.templateName}</td>
                                    <td>{formatWeight(entry.weight)}</td>
                                    <td>{entry.target}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HistoryPage;