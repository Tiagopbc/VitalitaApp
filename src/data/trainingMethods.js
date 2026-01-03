
/**
 * trainingMethods.js
 * Static data definition for various training methods available in the app.
 * Includes descriptions, how-to guides, usage tips, and caution notes for each method.
 */
export const trainingMethods = [
    {
        id: 1,
        name: "Drop-set",
        icon: "TrendingDown",
        description: "Ao terminar a série, reduza a carga e continue sem descanso.",
        howTo: [
            "Escolha uma carga que leve perto da falha muscular.",
            "Ao terminar as repetições, reduza a carga em torno de 20% a 30% e continue.",
            "Repita esse processo duas ou três vezes na mesma série, se fizer sentido para o treino."
        ],
        whenToUse: [
            "Aumenta o tempo sob tensão muscular.",
            "Ótimo para finalizar o músculo no fim do treino.",
            "Funciona muito bem em máquinas e halteres."
        ],
        caution: [
            "Use com moderação, pois a fadiga acumulada é alta.",
            "Evite aplicar em todos os exercícios do treino."
        ]
    },
    {
        id: 2,
        name: "Pirâmide Crescente",
        icon: "TrendingUp",
        description: "Comece mais leve e aumente a carga enquanto reduz o número de repetições.",
        howTo: [
            "Inicie com uma série usando carga mais leve e repetições mais altas.",
            "Em cada série seguinte, aumente a carga e reduza um pouco as repetições.",
            "Exemplo: 15 repetições, depois 12, depois 10, depois 8."
        ],
        whenToUse: [
            "Aquece bem a musculatura ao longo das primeiras séries.",
            "Ajuda a encontrar a carga ideal à medida que o exercício progride.",
            "Boa opção para exercícios principais, como supino ou agachamento guiado."
        ],
        caution: [
            "Evite começar leve demais para não gastar energia à toa.",
            "Mantenha a técnica estável mesmo quando a carga aumentar."
        ]
    },
    {
        id: 3,
        name: "Pirâmide Decrescente",
        icon: "TrendingDown",
        description: "Comece pesado com menos repetições e, depois, reduza a carga aumentando as repetições.",
        howTo: [
            "Inicie com uma série usando carga mais alta e poucas repetições.",
            "Em cada série seguinte, reduza um pouco a carga e aumente as repetições.",
            "Exemplo: 8 repetições, depois 10, depois 12, depois 15."
        ],
        whenToUse: [
            "Permite usar mais força logo no início, quando há menos fadiga.",
            "Mantém o músculo trabalhando em diferentes faixas de repetições."
        ],
        caution: [
            "Capriche no aquecimento antes da primeira série pesada.",
            "Evite exagerar na carga para não comprometer a técnica."
        ]
    },
    {
        id: 4,
        name: "Cluster set",
        icon: "Grid",
        description: "Divida uma série longa em mini blocos com pausas bem curtas.",
        howTo: [
            "Escolha uma carga relativamente alta.",
            "Faça um pequeno bloco de repetições, por exemplo 4 ou 5.",
            "Descanse de 10 a 20 segundos e repita o bloco.",
            "Some todos os blocos, que contam como uma única série estendida."
        ],
        whenToUse: [
            "Permite trabalhar com cargas altas por mais tempo.",
            "Ajuda a manter a técnica graças aos minidescansos.",
            "Boa opção para ganhos de força e hipertrofia."
        ],
        caution: [
            "Controle bem o tempo das pausas, senão o método perde o efeito.",
            "Evite usar em todos os exercícios para não tornar o treino excessivamente longo."
        ]
    },
    {
        id: 5,
        name: "Bi-set",
        icon: "Link2",
        description: "Realize dois exercícios seguidos para o mesmo grupo muscular, sem descanso entre eles.",
        howTo: [
            "Escolha dois exercícios que combinem bem para o mesmo músculo.",
            "Execute a série completa do primeiro exercício.",
            "Sem descansar, passe imediatamente para o segundo.",
            "Descanse apenas depois de completar os dois exercícios."
        ],
        whenToUse: [
            "Aumenta bastante a intensidade do treino.",
            "Ajuda a economizar tempo, já que concentra mais trabalho em menos séries.",
            "Boa estratégia para músculos que respondem bem a maior volume de treino."
        ],
        caution: [
            "Reduza um pouco a carga em relação ao que usaria em séries isoladas.",
            "Controle a respiração, pois o esforço contínuo é maior."
        ]
    },
    {
        id: 6,
        name: "Pico de contração",
        icon: "Focus",
        description: "Segure um ou dois segundos no ponto de máxima contração do movimento.",
        howTo: [
            "Execute o movimento de forma controlada até o ponto de maior contração.",
            "Segure a posição por um ou dois segundos.",
            "Retorne controlando a fase excêntrica, sem deixar a carga \"cair\"."
        ],
        whenToUse: [
            "Melhora a conexão mente-músculo.",
            "Mantém o músculo sob tensão por mais tempo.",
            "Funciona muito bem para panturrilhas, bíceps e ombros."
        ],
        caution: [
            "Evite travar completamente as articulações.",
            "Se a carga estiver alta demais, será difícil segurar o pico com boa técnica."
        ]
    },
    {
        id: 7,
        name: "Falha total",
        icon: "AlertTriangle",
        description: "Leve a série até o ponto em que não é possível completar outra repetição com boa técnica.",
        howTo: [
            "Escolha uma carga adequada para a faixa de repetições planejada.",
            "Execute o movimento até não conseguir realizar outra repetição com técnica segura.",
            "Ao atingir esse ponto, encerre a série de forma controlada."
        ],
        whenToUse: [
            "Pode gerar um estímulo forte para o músculo quando aplicado com critério.",
            "Geralmente funciona melhor na última série de um exercício."
        ],
        caution: [
            "Use com moderação, pois o desgaste é maior.",
            "Evite aplicar falha total em exercícios extremamente pesados ou complexos."
        ]
    },
    {
        id: 8,
        name: "Negativa",
        icon: "TrendingDown",
        description: "Enfatiza uma fase excêntrica (descida) do movimento, controlando por 4-5 segundos.",
        howTo: [
            "Execute o movimento de forma controlada.",
            "A fase de descida, ou excêntrica, deve ser intencionalmente lenta e controlada, durando de 4 a 5 segundos.",
            "A fase de subida (concêntrica) pode ser mais explosiva."
        ],
        whenToUse: [
            "Aumenta o dano muscular controlado, ideal para hipertrofia.",
            "Ajuda a fortalecer o músculo sob tensão prolongada.",
            "Boa opção para exercícios como Banco Flexor."
        ],
        caution: [
            "Reduza a carga se for difícil manter o controle lento da descida.",
            "Foque na técnica para evitar lesões devido ao estresse na fase excêntrica."
        ]
    },
    {
        id: 9,
        name: "Convencional",
        icon: "Repeat",
        description: "Série tradicional com a mesma carga, repetições contínuas e descanso normal entre as séries.",
        howTo: [
            "Defina a carga de acordo com a faixa de repetições planejada.",
            "Execute todas as repetições com movimento controlado.",
            "Descanse o tempo combinado e repita o processo nas próximas séries."
        ],
        whenToUse: [
            "Serve como base para qualquer treino bem estruturado.",
            "Facilita o controle de volume e de progressão de carga.",
            "Costuma ser menos estressante para o sistema nervoso do que métodos avançados."
        ],
        caution: [
            "Mantenha a técnica sempre em primeiro lugar, mesmo em séries simples.",
            "Progrida a carga aos poucos, sem pressa e sem sacrificar a execução."
        ]
    },
    {
        id: 10,
        name: "Cardio 140 bpm",
        icon: "Heart",
        description: "Manter a frequência cardíaca média em 140 batimentos por minuto é uma escolha de intensidade estratégica.",
        howTo: [
            "Monitore sua frequência cardíaca durante os 15 a 30 minutos de esteira ou bicicleta.",
            "Ajuste a velocidade e a inclinação, se for o caso, para manter seu batimento cardíaco em torno de 140 bpm.",
            "O ritmo deve ser aquele em que você consegue falar frases curtas, mas não manter uma conversa contínua."
        ],
        whenToUse: [
            "Melhora Cardiorrespiratória: Esta zona de intensidade é ideal para fortalecer o coração e os pulmões, aumentando sua capacidade aeróbica.",
            "Gasto Calórico Efetivo: Auxilia na composição corporal, maximizando o uso de gordura como fonte de energia.",
            "Complemento Ideal: A intensidade é controlada o suficiente para não interferir na recuperação dos músculos trabalhados na musculação."
        ],
        caution: [
            "Evite o Excesso: Não eleve a intensidade a ponto de gerar fadiga excessiva que comprometa o desempenho nos treinos de força.",
            "Consistência: Mantenha a intensidade constante e controlada durante todo o período estipulado.",
            "Hidratação: Beba água antes, durante e após o exercício."
        ]
    },
    {
        id: 11,
        name: "Rest-Pause",
        icon: "Clock",
        description: "Realize uma série até a falha, descanse por poucos segundos e continue a série para mais algumas repetições.",
        howTo: [
            "Execute a série com a carga habitual até a falha ou quase falha.",
            "Descanse apenas 10 a 15 segundos (sem soltar o peso, se possível).",
            "Faça o máximo de repetições extras que conseguir.",
            "Você pode repetir esse processo mais uma vez, se aguentar."
        ],
        whenToUse: [
            "Excelente para aumentar a intensidade e o volume em menos tempo.",
            "Indicado para quebrar platôs de força ou hipertrofia.",
            "Funciona bem em máquinas e exercícios isolados."
        ],
        caution: [
            "A técnica tende a degradar na parte final, fique atento.",
            "Não recomendado para exercícios perigosos sem supervisão (ex: agachamento livre pesado)."
        ]
    }
];
