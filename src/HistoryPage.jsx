import React, { useEffect, useState, useMemo } from 'react';
import { db } from './firebaseConfig';
import {
    collection,
    getDocs,
    query,
    orderBy
} from 'firebase/firestore';

function HistoryPage({ onBack }) {
    const [loading, setLoading] = useState(true);
    const [exerciseHistory, setExerciseHistory] = useState({});
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('todos');
    const [selectedExercise, setSelectedExercise] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);

            try {
                const sessionsRef = collection(db, 'workout_sessions');
                const q = query(sessionsRef, orderBy('completedAt', 'asc'));
                const snap = await getDocs(q);

                const historyMap = {};
                const templateSet = new Set();

                snap.forEach(docSnap => {
                    const data = docSnap.data();
                    const results = data.results || {};
                    const templateName = data.templateName || '';
                    const timestamp = data.completedAt;
                    let date = null;

                    if (templateName) {
                        templateSet.add(templateName);
                    }

                    if (timestamp && typeof timestamp.toDate === 'function') {
                        date = timestamp.toDate();
                    }

                    Object.entries(results).forEach(([exerciseName, info]) => {
                        const weight = info.weight || 0;
                        const target = info.target || '';
                        const note = info.note || '';

                        if (!historyMap[exerciseName]) {
                            historyMap[exerciseName] = [];
                        }

                        historyMap[exerciseName].push({
                            date,
                            templateName,
                            weight,
                            target,
                            note
                        });
                    });
                });

                Object.keys(historyMap).forEach(name => {
                    historyMap[name].sort((a, b) => {
                        if (!a.date || !b.date) {
                            return 0;
                        }
                        return a.date.getTime() - b.date.getTime();
                    });
                });

                setExerciseHistory(historyMap);

                const templateList = Array.from(templateSet).sort((a, b) =>
                    a.localeCompare(b)
                );
                setTemplates(templateList);

                const exerciseNames = Object.keys(historyMap);
                if (exerciseNames.length > 0) {
                    const firstExercise = exerciseNames.sort((a, b) =>
                        a.localeCompare(b)
                    )[0];

                    setSelectedExercise(prev => {
                        if (prev && historyMap[prev]) {
                            return prev;
                        }
                        return firstExercise || '';
                    });
                }
            } catch (error) {
                console.error('Erro ao carregar histórico: ', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const allExerciseNames = useMemo(
        () => Object.keys(exerciseHistory).sort((a, b) => a.localeCompare(b)),
        [exerciseHistory]
    );

    const filteredExercises = useMemo(() => {
        if (selectedTemplate === 'todos') {
            return allExerciseNames;
        }

        return allExerciseNames.filter(name => {
            const entries = exerciseHistory[name] || [];
            return entries.some(e => e.templateName === selectedTemplate);
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
        return base.filter(e => e.templateName === selectedTemplate);
    }, [exerciseHistory, selectedExercise, selectedTemplate]);

    const formatDate = (date) => {
        if (!date) {
            return 'Sem data';
        }
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderChart = () => {
        const entries = currentExerciseEntries.filter(e => e.weight > 0);
        if (entries.length === 0) {
            return (
                <p className="history-chart-empty">
                    Ainda não há dados suficientes para montar o gráfico deste exercício.
                </p>
            );
        }

        const maxWeight = entries.reduce(
            (max, e) => (e.weight > max ? e.weight : max),
            0
        );

        const width = 360;
        const height = 160;
        const paddingX = 30;
        const paddingY = 20;

        const usableWidth = width - paddingX * 2;
        const usableHeight = height - paddingY * 2;

        const points = entries.map((entry, index) => {
            const x =
                entries.length === 1
                    ? paddingX + usableWidth / 2
                    : paddingX + (usableWidth * index) / (entries.length - 1);

            const ratio = maxWeight > 0 ? entry.weight / maxWeight : 0;
            const y = paddingY + usableHeight - ratio * usableHeight;

            return `${x},${y}`;
        });

        const valuesForTicks = [
            maxWeight,
            Math.round(maxWeight * 0.66),
            Math.round(maxWeight * 0.33)
        ].filter(v => v > 0);

        return (
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="history-chart"
            >
                <line
                    x1={paddingX}
                    y1={paddingY + usableHeight}
                    x2={paddingX + usableWidth}
                    y2={paddingY + usableHeight}
                    className="history-chart-axis"
                />
                <line
                    x1={paddingX}
                    y1={paddingY}
                    x2={paddingX}
                    y2={paddingY + usableHeight}
                    className="history-chart-axis"
                />

                {valuesForTicks.map((value, index) => {
                    const ratio = maxWeight > 0 ? value / maxWeight : 0;
                    const y =
                        paddingY + usableHeight - ratio * usableHeight;

                    return (
                        <g key={index}>
                            <line
                                x1={paddingX}
                                y1={y}
                                x2={paddingX + usableWidth}
                                y2={y}
                                className="history-chart-grid"
                            />
                            <text
                                x={paddingX - 6}
                                y={y + 4}
                                className="history-chart-label"
                            >
                                {value} kg
                            </text>
                        </g>
                    );
                })}

                <polyline
                    points={points.join(' ')}
                    className="history-chart-line"
                    fill="none"
                />

                {entries.map((entry, index) => {
                    const x =
                        entries.length === 1
                            ? paddingX + usableWidth / 2
                            : paddingX +
                            (usableWidth * index) / (entries.length - 1);

                    const ratio =
                        maxWeight > 0 ? entry.weight / maxWeight : 0;
                    const y =
                        paddingY + usableHeight - ratio * usableHeight;

                    return (
                        <g key={index}>
                            <circle
                                cx={x}
                                cy={y}
                                r={3}
                                className="history-chart-point"
                            />
                            <text
                                x={x}
                                y={height - 4}
                                className="history-chart-date"
                            >
                                {entry.date
                                    ? entry.date.toLocaleDateString(
                                        'pt-BR',
                                        {
                                            day: '2-digit',
                                            month: '2-digit'
                                        }
                                    )
                                    : ''}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="history-page">
                <button className="btn-back" onClick={onBack}>
                    {'< Voltar'}
                </button>
                <h2>Históricos</h2>
                <p>Carregando histórico...</p>
            </div>
        );
    }

    if (allExerciseNames.length === 0) {
        return (
            <div className="history-page">
                <button className="btn-back" onClick={onBack}>
                    {'< Voltar'}
                </button>
                <h2>Históricos</h2>
                <p>Ainda não há sessões salvas para exibir.</p>
            </div>
        );
    }

    return (
        <div className="history-page">
            <button className="btn-back" onClick={onBack}>
                {'< Voltar'}
            </button>
            <h2>Históricos</h2>
            <p className="history-intro">
                Acompanhe sua evolução filtrando por treino e escolhendo um exercício específico para visualizar a curva de progressão.
            </p>

            <div className="history-filters">
                <div className="history-filter-row">
                    <div className="history-filter">
                        <label>Treino</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                        >
                            <option value="todos">Todos os treinos</option>
                            {templates.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="history-filter">
                        <label>Exercício</label>
                        <select
                            value={selectedExercise}
                            onChange={(e) =>
                                setSelectedExercise(e.target.value)
                            }
                        >
                            <option value="">
                                Selecione um exercício
                            </option>
                            {filteredExercises.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedExercise && (
                <div className="history-chart-card">
                    <h3>Evolução do exercício</h3>
                    <p className="history-chart-title">
                        {selectedExercise}{' '}
                        {selectedTemplate !== 'todos' &&
                            `• ${selectedTemplate}`}
                    </p>
                    {renderChart()}
                </div>
            )}

            {selectedExercise && currentExerciseEntries.length > 0 && (
                <div className="history-card">
                    <div className="history-card-header">
                        <h3>Registro detalhado</h3>
                    </div>
                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                            <tr>
                                <th>Data</th>
                                <th>Treino</th>
                                <th>Peso</th>
                                <th>Observação</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentExerciseEntries.map((entry, idx) => (
                                <tr key={idx}>
                                    <td>{formatDate(entry.date)}</td>
                                    <td>{entry.templateName}</td>
                                    <td>
                                        {entry.weight
                                            ? `${entry.weight} kg`
                                            : 'sem registro'}
                                    </td>
                                    <td>{entry.note}</td>
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
