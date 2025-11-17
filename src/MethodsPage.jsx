// src/MethodsPage.jsx

import React, { useMemo } from 'react';

const METHODS = [
    {
        id: 'drop-set',
        name: 'Drop-set',
        aliases: ['Drop-set', 'Drop Set', 'Drop-sete'],
        short: 'Ao terminar a série, reduza a carga e continue sem descanso.',
        how: [
            'Escolha uma carga que leve perto da falha muscular.',
            'Ao terminar as repetições, reduza a carga em torno de 20 a 30 por cento e continue.',
            'Repita esse processo duas ou três vezes na mesma série, se fizer sentido para o treino.'
        ],
        benefits: [
            'Aumenta o tempo sob tensão muscular.',
            'Ótimo para finalizar o músculo no fim do treino.',
            'Funciona muito bem em máquinas e halteres.'
        ],
        cautions: [
            'Use com moderação, pois a fadiga acumulada é alta.',
            'Evite aplicar em todos os exercícios do treino.'
        ]
    },
    {
        id: 'piramide-crescente',
        name: 'Pirâmide crescente',
        aliases: ['Pirâmide crescente', 'Pirâmide crescente '],
        short: 'Comece mais leve e aumente a carga enquanto reduz o número de repetições.',
        how: [
            'Inicie com uma série usando carga mais leve e repetições mais altas.',
            'Em cada série seguinte, aumente a carga e reduza um pouco as repetições.',
            'Exemplo: 15 repetições, depois 12, depois 10, depois 8.'
        ],
        benefits: [
            'Aquece bem a musculatura ao longo das primeiras séries.',
            'Ajuda a encontrar a carga ideal à medida que o exercício progride.',
            'Boa opção para exercícios principais, como supino ou agachamento guiado.'
        ],
        cautions: [
            'Evite começar leve demais para não gastar energia à toa.',
            'Mantenha a técnica estável mesmo quando a carga aumentar.'
        ]
    },
    {
        id: 'piramide-decrescente',
        name: 'Pirâmide decrescente',
        aliases: ['Pirâmide decrescente'],
        short: 'Comece pesado com menos repetições e, depois, reduza a carga aumentando as repetições.',
        how: [
            'Inicie com uma série usando carga mais alta e poucas repetições.',
            'Em cada série seguinte, reduza um pouco a carga e aumente as repetições.',
            'Exemplo: 8 repetições, depois 10, depois 12, depois 15.'
        ],
        benefits: [
            'Permite usar mais força logo no início, quando há menos fadiga.',
            'Mantém o músculo trabalhando em diferentes faixas de repetições.'
        ],
        cautions: [
            'Capriche no aquecimento antes da primeira série pesada.',
            'Evite exagerar na carga para não comprometer a técnica.'
        ]
    },
    {
        id: 'cluster-set',
        name: 'Cluster set',
        aliases: ['Cluster set', 'Cluster Set'],
        short: 'Divida uma série longa em mini blocos com pausas bem curtas.',
        how: [
            'Escolha uma carga relativamente alta.',
            'Faça um pequeno bloco de repetições, por exemplo 4 ou 5.',
            'Descanse de 10 a 20 segundos e repita o bloco.',
            'Some todos os blocos, que contam como uma única série estendida.'
        ],
        benefits: [
            'Permite trabalhar com cargas altas por mais tempo.',
            'Ajuda a manter a técnica graças aos minidescansos.',
            'Boa opção para ganhos de força e hipertrofia.'
        ],
        cautions: [
            'Controle bem o tempo das pausas, senão o método perde o efeito.',
            'Evite usar em todos os exercícios para não tornar o treino excessivamente longo.'
        ]
    },
    {
        id: 'bi-set',
        name: 'Bi-set',
        aliases: ['Bi-set', 'Bi set', 'Bi-sete'],
        short: 'Realize dois exercícios seguidos para o mesmo grupo muscular, sem descanso entre eles.',
        how: [
            'Escolha dois exercícios que combinem bem para o mesmo músculo.',
            'Execute a série completa do primeiro exercício.',
            'Sem descansar, passe imediatamente para o segundo.',
            'Descanse apenas depois de completar os dois exercícios.'
        ],
        benefits: [
            'Aumenta bastante a intensidade do treino.',
            'Ajuda a economizar tempo, já que concentra mais trabalho em menos séries.',
            'Boa estratégia para músculos que respondem bem a maior volume de treino.'
        ],
        cautions: [
            'Reduza um pouco a carga em relação ao que usaria em séries isoladas.',
            'Controle a respiração, pois o esforço contínuo é maior.'
        ]
    },
    {
        id: 'pico-contracao',
        name: 'Pico de contração',
        aliases: ['Pico de contração', 'Pico de contracao'],
        short: 'Segure um ou dois segundos no ponto de máxima contração do movimento.',
        how: [
            'Execute o movimento de forma controlada até o ponto de maior contração.',
            'Segure a posição por um ou dois segundos.',
            'Retorne controlando a fase excêntrica, sem deixar a carga “cair”.'
        ],
        benefits: [
            'Melhora a conexão mente-músculo.',
            'Mantém o músculo sob tensão por mais tempo.',
            'Funciona muito bem para panturrilhas, bíceps e ombros.'
        ],
        cautions: [
            'Evite travar completamente as articulações.',
            'Se a carga estiver alta demais, será difícil segurar o pico com boa técnica.'
        ]
    },
    {
        id: 'falha-total',
        name: 'Falha total',
        aliases: ['Falha total', 'Falta total'],
        short: 'Leve a série até o ponto em que não é possível completar outra repetição com boa técnica.',
        how: [
            'Escolha uma carga adequada para a faixa de repetições planejada.',
            'Execute o movimento até não conseguir realizar outra repetição com técnica segura.',
            'Ao atingir esse ponto, encerre a série de forma controlada.'
        ],
        benefits: [
            'Pode gerar um estímulo forte para o músculo quando aplicado com critério.',
            'Geralmente funciona melhor na última série de um exercício.'
        ],
        cautions: [
            'Use com moderação, pois o desgaste é maior.',
            'Evite aplicar falha total em exercícios extremamente pesados ou complexos.'
        ]
    },
    {
        id: 'convencional',
        name: 'Convencional',
        aliases: ['Convencional'],
        short: 'Série tradicional com a mesma carga, repetições contínuas e descanso normal entre as séries.',
        how: [
            'Defina a carga de acordo com a faixa de repetições planejada.',
            'Execute todas as repetições com movimento controlado.',
            'Descanse o tempo combinado e repita o processo nas próximas séries.'
        ],
        benefits: [
            'Serve como base para qualquer treino bem estruturado.',
            'Facilita o controle de volume e de progressão de carga.',
            'Costuma ser menos estressante para o sistema nervoso do que métodos avançados.'
        ],
        cautions: [
            'Mantenha a técnica sempre em primeiro lugar, mesmo em séries simples.',
            'Progrida a carga aos poucos, sem pressa e sem sacrificar a execução.'
        ]
    }
];

function normalize(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function MethodsPage({ onBack, initialMethod }) {
    const highlightedId = useMemo(() => {
        if (!initialMethod) {
            return null;
        }

        const normalized = normalize(initialMethod);

        const found = METHODS.find((m) =>
            [m.name, ...(m.aliases || [])].some(
                (alias) => normalize(alias) === normalized
            )
        );

        return found ? found.id : null;
    }, [initialMethod]);

    return (
        <div className="methods-page">
            <button
                type="button"
                className="btn-back-primary"
                onClick={onBack}
            >
                Voltar
            </button>

            <h2>Métodos de treino</h2>

            <p className="methods-intro">
                Abaixo estão resumidos os principais métodos que aparecem nos treinos.
                Sempre que surgir “Drop-set”, “Pirâmide”, “Cluster” ou outro método,
                consulte esta tela para lembrar rapidamente como aplicar cada um deles.
            </p>

            <div className="methods-grid">
                {METHODS.map((method) => {
                    const isHighlighted = method.id === highlightedId;

                    return (
                        <article
                            key={method.id}
                            className={
                                'method-card' +
                                (isHighlighted ? ' method-card-highlight' : '')
                            }
                        >
                            <h3 className="method-title">{method.name}</h3>
                            <p className="method-short">{method.short}</p>

                            <div className="method-section">
                                <h4>Como executar</h4>
                                <ul>
                                    {method.how.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="method-section">
                                <h4>Quando usar</h4>
                                <ul>
                                    {method.benefits.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="method-section">
                                <h4>Cuidados</h4>
                                <ul>
                                    {method.cautions.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default MethodsPage;