// src/Seeder.jsx

import React, { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Seus 5 treinos, agora com os novos IDs e Nomes
const workoutTemplates = [
    {
        id: 'treino-1', // ID antigo: dia-1
        name: 'Treino 1 - Peito, Ombros e Tríceps',
        exercises: [
            { group: 'Peito', name: 'Supino inclinado barra', target: '4x15/12//10/8', method: 'Pirâmide crescente' },
            { group: 'Peito', name: 'Supino inclinado halteres', target: '4x10-12', method: 'Convencional' },
            { group: 'Peito', name: 'Crucifixo', target: '4x10+10+10', method: 'Cluster set' },
            { group: 'Peito', name: 'Cross over polia baixa/alta', target: '4x até falha', method: 'Falha total' },
            { group: 'Ombros', name: 'Desenvolvimento halteres', target: '4x15/12//10/8', method: 'Pirâmide crescente' },
            { group: 'Ombros', name: 'Elevação lateral sentado', target: '4x10+10', method: 'Drop-set' },
            { group: 'Tríceps', name: 'Francês unilateral no cross', target: '4x15', method: 'Convencional' },
            { group: 'Tríceps', name: 'Triceps corda', target: '4x15/10/8', method: 'Pirâmide decrescente' },
            { group: 'Abdômen', name: 'Supra solo', target: '3x15-20', method: 'Convencional' },
        ],
    },
    {
        id: 'treino-2', // ID antigo: dia-2
        name: 'Treino 2 - Costas, Posterior Ombro e Bíceps',
        exercises: [
            { group: 'Costas', name: 'Remada curvada barra pronada', target: '4x15/12//10/8', method: 'Pirâmide crescente' },
            { group: 'Costas', name: 'Remada baixa supinada', target: '4x10-12', method: 'Cluster set' },
            { group: 'Costas', name: 'Remada serrote unilateral', target: '4x10+10', method: 'Drop-set' },
            { group: 'Costas', name: 'Remada articulada baixa', target: '4x12-15', method: 'Convencional' },
            { group: 'Costas', name: 'Pulley frente pronado', target: '4x12-15', method: 'Convencional' },
            { group: 'Costas', name: 'Pulldown barra pronada', target: '4x12-15', method: 'Convencional' },
            { group: 'Posterior Ombro', name: 'Crucifixo inverso máquina', target: '3x15-20', method: 'Convencional' },
            { group: 'Bíceps', name: 'Banco Scott máquina', target: '4x10', method: 'Bi-set' },
            { group: 'Bíceps', name: 'Rosca alternada com giro', target: '4x10', method: 'Bi-set' },
            { group: 'Abdômen', name: 'Infra banco', target: '3x15-20', method: 'Convencional' },
        ],
    },
    {
        id: 'treino-3', // ID antigo: dia-3
        name: 'Treino 3 - Pernas (Quadríceps)',
        exercises: [
            { group: 'Quadriceps', name: 'Agachamento no hack', target: '4x10+10+10', method: 'Cluster set' },
            { group: 'Quadríceps', name: 'Leg press 45°', target: '4x10-12', method: 'Convencional' },
            { group: 'Quadriceps', name: 'Afundo smith', target: '3x15/12/8/8', method: 'Pirâmide crescente' },
            { group: 'Quadríceps', name: 'Banco extensor', target: '4x10+10+10', method: 'Drop-set' },
            { group: 'Glúteos', name: 'Hiperextensão tronco', target: '4x12', method: 'Pico de contração' },
            { group: 'Panturrilha', name: 'Vertical máquina', target: '4x12-15', method: 'Convencional' },
            { group: 'Panturrilha', name: 'Sentado', target: '4x12-15', method: 'Pico de contração' },
        ],
    },
    {
        id: 'treino-4', // ID antigo: dia-5
        name: 'Treino 4 - Full Body + Braços',
        exercises: [
            { group: 'Peito', name: 'Supino declinado barra', target: '4x8+8+8', method: 'Cluster set' },
            { group: 'Peito', name: 'Crucifixo', target: '4x15-20', method: 'Convencional' },
            { group: 'Costas', name: 'Remada curvada pronada', target: '4x falha', method: 'Falha total' },
            { group: 'Costas', name: 'Pulldown barra pronada', target: '4x12-15', method: 'Convencional' },
            { group: 'Ombros', name: 'Elevação frontal polia', target: '5x8/10/12/15//20', method: 'Pirâmide decrescente' },
            { group: 'Ombros', name: 'Remada alta halteres', target: '4x falha', method: 'Convencional' },
            { group: 'Braços (Semana A)', name: 'Rosca direta barra W + Rosca alternada', target: '4x10-12', method: 'Bi-set' },
            { group: 'Braços (Semana B)', name: 'Tríceps corda + Francês unilateral', target: '4x12-15', method: 'Convencional' },
            { group: 'Abdômen', name: 'Supra ou infra', target: '3x15-20', method: 'Convencional' },
        ],
    },
    {
        id: 'treino-5', // ID antigo: dia-6
        name: 'Treino 5 - Pernas (Posteriores)',
        exercises: [
            { group: 'Posteriores', name: 'Stiff barra', target: '5x10', method: 'Convencional' },
            { group: 'Posteriores', name: 'Mesa flexora', target: '4x8', method: 'Descida controlada' },
            { group: 'Posteriores', name: 'Banco flexor', target: '4x8+12', method: 'Negativa' },
            { group: 'Glúteos', name: 'Terra sumô', target: '5x10', method: 'Convencional' },
            { group: 'Panturrilha', name: 'Vertical', target: '4x12-15', method: 'Convencional' },
            { group: 'Panturrilha', name: 'Leg press', target: '4x15-20', method: 'Convencional' },
        ],
    },
];

function Seeder() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSeedDatabase = async () => {
        setLoading(true);
        setMessage('Carregando 5 treinos no Firebase...');

        try {
            const batch = writeBatch(db);
            workoutTemplates.forEach((template) => {
                // Usa o novo ID (ex: 'treino-1')
                const docRef = doc(db, 'workout_templates', template.id);
                batch.set(docRef, template);
            });
            await batch.commit();
            setMessage('SUCESSO! Seus 5 treinos (templates) foram salvos com os novos nomes.');
        } catch (error) {
            console.error("Erro ao semear banco de dados: ", error);
            setMessage(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Ferramenta de Semeador (Seeder) de Treinos</h2>
            <p>Clique no botão abaixo para carregar os 5 templates de treino no Firebase.</p>
            <p><strong>Aviso:</strong> Faça isso apenas UMA VEZ.</p>
            <button onClick={handleSeedDatabase} disabled={loading} style={{ padding: '15px 30px', fontSize: '1.2em', cursor: 'pointer' }}>
                {loading ? 'Carregando...' : 'Carregar 5 Treinos no Banco'}
            </button>
            {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
        </div>
    );
}

export default Seeder;