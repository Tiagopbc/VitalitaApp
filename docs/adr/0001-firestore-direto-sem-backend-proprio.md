# ADR-0001: Firestore acessado direto do cliente, sem backend próprio

**Status:** Accepted
**Date:** 2026-06-15 (decisão original de projeto; registrada retroativamente em 2026-07-29)
**Deciders:** Tiago Cavalcanti

## Contexto

O Vitalità é um PWA de acompanhamento de treino para aluno e personal, com uso
pessoal/pequena escala e sem orçamento para infraestrutura de servidor
dedicada. Toda a leitura e escrita de dados de produto (perfis, templates de
treino, sessões, vínculo aluno-personal, sessão ativa) precisa de baixa
latência offline-first, já que o app é usado durante o treino, muitas vezes
com conectividade instável em academia.

A pergunta arquitetural: o cliente acessa o banco de dados direto, ou existe
uma camada de API própria (REST/GraphQL) entre o app e o banco?

## Decisão

O cliente acessa o **Cloud Firestore diretamente**, sem servidor de aplicação
próprio. Autorização é responsabilidade de `firestore.rules`, versionadas na
raiz do repositório, não de uma camada de API. Não existe backend dedicado —
apenas quatro funções serverless na Vercel (`api/`) para os fluxos que não
podem rodar no cliente: `parse-workout-pdf.js` para a importação de treino
por PDF (chama a API da Anthropic), e `schedule-rest-push.js`,
`send-rest-push.js` e `cancel-rest-push.js` para o push de descanso
(agendamento, envio e cancelamento via QStash). Uma Cloud Function opcional
(`functions/`) recalcula `user_stats`, mas está desligada por padrão (ver
[ADR-0003](0003-user-stats-client-side-por-custo.md)).

## Opções consideradas

### Opção A: Firestore direto do cliente (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa — sem servidor de aplicação para manter, deployar ou escalar |
| Custo | Zero fixo — paga por uso do Firestore, dentro da cota gratuita para o volume atual |
| Escalabilidade | Boa até o ponto em que regras de autorização ficam complexas demais para `firestore.rules` |
| Familiaridade da equipe | Alta — um único desenvolvedor, já domina o SDK client-side do Firebase |
| Offline-first | Nativo — persistência offline do Firestore resolve o requisito de uso em academia sem esforço extra |

**Prós:** zero infraestrutura de servidor para operar; offline-first de graça;
deploy é só o front-end estático; latência baixa (sem hop de API própria).
**Contras:** lógica de autorização fica em `firestore.rules`, uma DSL menos
expressiva que código de aplicação; toda regra de negócio que dependa de
validação server-side (ex.: limites, agregações confiáveis) exige Cloud
Function à parte; superfície de ataque é a query do cliente, não um endpoint
controlado.

### Opção B: API própria entre cliente e banco

| Dimensão | Avaliação |
|---|---|
| Complexidade | Alta — servidor para escrever, testar, deployar e observar |
| Custo | Recorrente — cômputo sempre ligado, mesmo com tráfego baixo |
| Escalabilidade | Melhor para regras de negócio complexas, mas sem necessidade atual |
| Familiaridade da equipe | Exigiria stack de backend adicional |
| Offline-first | Precisaria ser reimplementado manualmente (cache, fila de sync) |

**Prós:** autorização e regra de negócio em código de verdade, mais fácil de
testar; controle fino sobre agregações e efeitos colaterais.
**Contras:** custo de infraestrutura recorrente para um projeto de baixa
escala; reimplementar offline-first do zero; mais uma peça para manter e
monitorar sem ganho proporcional no estágio atual do produto.

## Análise de trade-off

O fator decisivo foi **custo fixo zero + offline-first nativo** para um app
de uso pessoal/pequena escala, contra a perda de expressividade em
autorização. Essa perda é mitigada mantendo `firestore.rules` deliberadamente
simples (só chaves de topo, ver
[escrita-workout-templates](../../.claude/skills/escrita-workout-templates/SKILL.md))
e empurrando qualquer lógica que exija confiança de servidor (parsing de PDF,
push, agregações) para as quatro funções serverless da Vercel — mantendo
essas funções mínimas e sem virar um backend de fato.

## Consequências

- Toda mudança de campo no topo de um documento validado precisa de cenário
  correspondente em `tests/security/firestore.rules.test.js` — não há camada
  de API para centralizar essa validação.
- Regra de negócio que dependa de ver múltiplos documentos de forma
  consistente (ex.: agregação confiável de estatísticas) não cabe em
  `firestore.rules` e empurra para Cloud Function — como já aconteceu com
  `user_stats`.
- Sem backend próprio, não há lugar natural para rate limiting, auditoria
  centralizada ou lógica sensível — é a limitação conhecida documentada em
  `docs/security-rules.md` para o fluxo de convites aluno-personal.
- Revisitar esta decisão faz sentido se o produto crescer para múltiplos
  personals gerenciando muitos alunos simultaneamente, ponto em que a
  auditoria/rate-limit centralizados passam a valer o custo de um backend.

## Action Items

1. [x] Documentar a decisão (este ADR).
2. [ ] Nenhuma ação de implementação pendente — decisão já em vigor.
