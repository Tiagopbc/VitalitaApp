// src/HistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs
} from 'firebase/firestore';

function HistoryPage({ onBack, initialTemplate, initialExercise }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate || '');
    const [selectedExercise, setSelectedExercise] = useState(initialExercise || '');
    const [historyRows, setHistoryRows] = useState([]);
    const [prRows, setPrRows] = useState([]);
    const [loading, setLoading] = useState(false);

    // se o App mudar os valores iniciais enquanto a tela estiver aberta
    useEffect(() => {
        if (initialTemplate) {
            setSelectedTemplate(initialTemplate);
        }
        if (initialExercise) {
            setSelectedExercise(initialExercise);
        }
    }, [initialTemplate, initialExercise]);

    // carrega lista de templates para o seletor
    useEffect(() => {
        async function loadTemplates() {
            const snap = await getDocs(collection(db, 'workout_templates'));
            const list = snap.docs.map(d => d.data().name || d.id);
            setTemplates(list.sort());
        }
        loadTemplates();
    }, []);

    // sempre que filtro mudar, recarrega histórico
    useEffect(() => {
        async function loadHistory() {
            if (!selectedTemplate || !selectedExercise) {
                setHistoryRows([]);
                setPrRows([]);
                return;
            }

            setLoading(true);
            try {
                const sessionsRef = collection(db, 'workout_sessions');
                const q = query(
                    sessionsRef,
                    where('templateName', '==', selectedTemplate),
                    orderBy('completedAt', 'desc')
                );
                const snap = await getDocs(q);

                const rows = [];
                const prsMap = {};

                snap.forEach(docSnap => {
                    const data = docSnap.data();
                    const results = data.results || {};
                    const result = results[selectedExercise];
                    if (!result) return;

                    const weight = result.weight || 0;
                    const reps = result.reps || 0;
                    const date = data.completedAt?.toDate?.() || null;

                    rows.push({
                        id: docSnap.id,
                        date,
                        weight,
                        reps,
                        note: result.note || ''
                    });

                    // PR simples por carga
                    const key = String(weight);
                    if (!prsMap[key] || reps > prsMap[key].reps) {
                        prsMap[key] = { weight, reps };
                    }
                });

                setHistoryRows(rows);

                const prs = Object.values(prsMap)
                    .sort((a, b) => a.weight - b.weight);
                setPrRows(prs);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [selectedTemplate, selectedExercise]);

    return (
        <div className="history-page">
            <button
                type="button"
                className="btn-back-primary"
                onClick={onBack}
            >
                Voltar
            </button>

            <h2>Histórico</h2>

            <p className="history-intro">
                Veja a evolução das suas cargas e repetições para cada exercício.
            </p>

            <div className="history-content">
                <div className="history-filters">
                    <div className="history-filter-group">
                        <label>Rotina</label>
                        <select
                            value={selectedTemplate || ''}
                            onChange={(e) => {
                                setSelectedTemplate(e.target.value);
                                setSelectedExercise('');
                            }}
                        >
                            <option value="">Selecionar</option>
                            {templates.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="history-filter-group">
                        <label>Exercício</label>
                        {/* aqui você pode receber a lista de exercícios pelo App
                ou por outra consulta ao Firestore, se quiser refinar */}
                        <input
                            type="text"
                            value={selectedExercise || ''}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            placeholder="Nome exato do exercício"
                        />
                    </div>
                </div>

                <div className="history-card">
                    <div className="history-card-header">
                        <h3>Sessões recentes</h3>
                        {loading && <span>Carregando…</span>}
                    </div>

                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                            <tr>
                                <th>Data</th>
                                <th>Carga</th>
                                <th>Reps</th>
                                <th>Obs</th>
                            </tr>
                            </thead>
                            <tbody>
                            {historyRows.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        {row.date
                                            ? row.date.toLocaleDateString('pt-BR')
                                            : '—'}
                                    </td>
                                    <td>{row.weight}</td>
                                    <td>{row.reps}</td>
                                    <td>{row.note}</td>
                                </tr>
                            ))}

                            {historyRows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4}>Nenhum registro para este filtro.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {prRows.length > 0 && (
                        <div className="history-pr-table-wrapper">
                            <h4>Reps máximas por carga</h4>
                            <table className="history-pr-table">
                                <thead>
                                <tr>
                                    <th>Carga</th>
                                    <th>Reps máx</th>
                                </tr>
                                </thead>
                                <tbody>
                                {prRows.map((row) => (
                                    <tr key={row.weight}>
                                        <td>{row.weight}</td>
                                        <td>{row.reps}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HistoryPage;