// src/MethodsPage.jsx
import React from 'react';
import './style.css';

const TRAINING_METHODS = [
    {
        id: 'cluster',
        name: 'Cluster Set',
        short: 'Séries divididas em blocos menores com micro descansos.',
        how: [
            'Defino uma carga próxima da minha carga pesada para o exercício.',
            'Divido a série em blocos menores, por exemplo quatro blocos de três repetições.',
            'Faço um bloco, descanso de dez a vinte segundos, e repito até completar o total.',
            'Descanso normalmente entre as séries principais.'
        ],
        when: 'Uso em exercícios mais pesados, como agachamento, supino ou remada, quando quero manter carga alta com técnica boa.'
    },
    {
        id: 'piramide-crescente',
        name: 'Pirâmide crescente',
        short: 'A cada série aumento a carga e reduzo um pouco as repetições.',
        how: [
            'Começo com carga leve e repetições mais altas, por exemplo doze repetições.',
            'Aumento a carga a cada série e reduzo as repetições, por exemplo doze, dez, oito, seis.',
            'Mantenho a técnica estável, mesmo com a carga subindo.'
        ],
        when: 'Uso quando quero aquecer bem, sentir a progressão de carga e terminar perto da minha zona de esforço máximo controlado.'
    },
    {
        id: 'drop-set',
        name: 'Drop set',
        short: 'Chego perto da falha, tiro peso e continuo sem descanso.',
        how: [
            'Escolho uma carga em que chego perto da falha no número de repetições planejado.',
            'Quando chego próximo da falha, reduzo a carga em cerca de vinte a trinta por cento.',
            'Continuo a série sem descanso, apenas ajustando a carga.',
            'Repito o processo se o planejamento pedir dois ou três drops.'
        ],
        when: 'Uso principalmente em máquinas e exercícios isoladores, para gerar um estresse extra sem sobrecarregar tanto as articulações.'
    }
];

function MethodsPage({ onBack }) {
    return (
        <div className="methods-page">
            <button className="btn-back" onClick={onBack}>
                ‹ Voltar
            </button>

            <h2>Métodos de treino</h2>
            <p className="methods-intro">
                Aqui eu deixo os métodos que uso no Vitalità. Quando fico na dúvida
                durante o treino, volto nesta tela para relembrar rapidamente como
                aplicar cada um.
            </p>

            <div className="methods-grid">
                {TRAINING_METHODS.map((method) => (
                    <article key={method.id} className="method-card">
                        <h3 className="method-title">{method.name}</h3>
                        <p className="method-short">{method.short}</p>

                        <div className="method-section">
                            <h4>Como eu faço</h4>
                            <ul>
                                {method.how.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="method-section">
                            <h4>Quando eu uso</h4>
                            <p>{method.when}</p>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default MethodsPage;