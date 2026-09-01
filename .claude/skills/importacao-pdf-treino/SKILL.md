---
name: importacao-pdf-treino
description: >-
  Contexto para trabalhar na importação de treino por PDF do Vitalità — a função
  serverless api/parse-workout-pdf.js que chama a API da Anthropic, o formato
  { workouts: [...] }, a decomposição de bi-sets, a fila de revisão no
  CreateWorkoutPage e como isso interage com as firestore.rules. Invoque ao mexer
  em parse-workout-pdf, workoutPdfImport, importação/leitura de ficha por PDF,
  bi-set/tri-set, groupedWithPrevious/groupId ou no botão de importar treino.
---

# Importação de treino por PDF

A **única funcionalidade paga** do app. Ler antes de mexer no fluxo.

## Custo e configuração

`api/parse-workout-pdf.js` chama a API da Anthropic (`claude-opus-5`) para ler a
ficha. O preço por token é o mesmo do `claude-opus-4-8` que ele substituiu
(US$ 5 / US$ 25 por milhão), mas desde 27/08/2026 o modelo **pensa** — então o
~US$ 0,04 por PDF herdado da estimativa antiga vale como piso, não como média,
enquanto não houver medição real. Exige três variáveis:

- `ANTHROPIC_API_KEY` e `FIREBASE_PROJECT_ID` — **servidor**, nunca `VITE_*`.
- `VITE_ENABLE_PDF_IMPORT=true` — **build**, para exibir o botão. O cliente não
  consegue detectar a config do servidor sem gastar requisição.

Sem elas o botão some ou a função responde 503, sem afetar o resto do app.

## A forma da requisição é proposital — não "conserte"

`thinking: { type: 'adaptive' }` **junto com** `tool_choice` forçado é suportado e
intencional. A restrição que existe na documentação — só `auto` ou `none` — vale
para o pensamento **manual** (`thinking: { type: 'enabled' }`), que este código não
usa. A doc oficial de [forcing tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)
diz o contrário para o modo adaptativo: *"Adaptive thinking, including on models
where thinking is on by default such as Claude Opus 5, supports forced tool use."*
A única plataforma que exige `disabled` ao lado de escolha forçada é a Amazon
Bedrock, que não é por onde este projeto fala com a API.

Uma revisão automática (Codex, no PR #82) já alegou o oposto, prevendo 502 em toda
importação. É falso — e aplicar a sugestão reintroduziria justamente a falha que o
comentário no código descreve: com o pensamento desligado, o Opus 5 às vezes
escreve a chamada de ferramenta como texto comum, e a função, que depende de
receber um bloco `tool_use`, devolve `parse_failed` sem erro nenhum no log.

## Fronteira de responsabilidade (proposital)

A função **só parseia**. Quem grava em `workout_templates` é o cliente autenticado
via `workoutService.createTemplate`, respeitando as `firestore.rules`. A revisão
humana no `CreateWorkoutPage` antes de salvar é proposital, não opcional.

> Toda escrita em `workout_templates` passa por `workoutService`
> (`createTemplate`/`updateTemplate`). Não volte a chamar `addDoc` direto numa página.

## Vários treinos e decomposição de bi-sets

A resposta é `{ workouts: [...] }` — um item por ficha do documento (Treino A, B, C).

- Bi-set/tri-set são quebrados em exercícios separados e consecutivos, marcados com
  `groupedWithPrevious`. O cliente (`assignGroupIds` em `workoutPdfImport.js`)
  converte isso no `groupId` que `exerciseGroups.js` usa para religar a dupla.
  **Só o `groupId` é definido — o `method` fica "Convencional".** Nenhuma UI deve
  usar a tag de método para sinalizar agrupamento; ver o skill `method-vs-groupid`.
- A decomposição é **rede de segurança determinística** no servidor
  (`decomposeExercise`): mesmo que a IA devolva "A + B" num nome só, a função separa.
- No `CreateWorkoutPage` os treinos entram numa **fila de revisão** — salva um, o
  próximo aparece.

## Interação com as firestore.rules

As `firestore.rules` só validam **chaves de topo**: o `hasOnly` roda sobre
`request.resource.data.keys()`, então campos *dentro* do array `exercises` (como o
`targetWeight` da carga-alvo) não precisam ser liberados nas regras. Campo novo no
**topo** do documento, sim — e aí exige cenário em
`tests/security/firestore.rules.test.js`.

## Referências

- [MANUAL_TECNICO.md](../../../MANUAL_TECNICO.md) §7.4
- [docs/security-rules.md](../../../docs/security-rules.md)
