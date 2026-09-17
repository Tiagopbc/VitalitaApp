# ADR-0005: Sem testes E2E por enquanto

**Status:** Accepted
**Date:** 2026-09-17
**Deciders:** Tiago Cavalcanti

## Contexto

O projeto tinha um único teste ponta a ponta: `cypress/e2e/happy_path.cy.js`,
127 linhas cobrindo cadastro → criar treino → executar → finalizar. Nascido no
commit `5c88626`, nunca mais tocado depois de `c1357fa`.

Dois fatos levantados no mapeamento da revisão geral de 2026-09:

**Ele nunca rodou automaticamente.** O `.github/workflows/ci.yml` tem dez
passos — lint, Vitest, testes das Functions, emulador do Firestore, build,
coverage — e nenhum deles invoca Cypress. Também não havia script `e2e` ou
`cypress` no `package.json`. Rodar exigia lembrar de digitar `npx cypress`.

**E estava quebrado.** A linha 120 faz `cy.contains(/Treino Concluído!/i)`.
Esse texto existe em exatamente dois lugares no código — `useWorkoutShare.js` e
`WorkoutDetailsModal.jsx` — e nos dois é o campo `title` do payload da Web Share
API, que nunca chega ao DOM. A tela que o teste tenta inspecionar é o
`WorkoutFinishModal`, que renderiza o `ShareableWorkoutCard`; esse card é um
`<canvas>`, e o rótulo "TREINO CONCLUÍDO" é **desenhado em pixel**.
`cy.contains` não enxerga pixel. O teste falharia ali e nunca chegaria às
asserções seguintes.

Ou seja: o projeto carregava a dependência do Cypress (mais o
`eslint-plugin-cypress`) e a aparência de ter cobertura E2E, sem ter nem uma
coisa nem outra.

## Decisão

**Remover o Cypress e não substituí-lo agora.** Saem a dependência, o plugin do
ESLint, o `cypress.config.js` e o único spec.

A rede de segurança do projeto passa a ser, por inteiro:

- 485 testes de unidade e integração em 54 arquivos (Vitest + Testing Library),
  incluindo os hooks de sessão e as páginas principais;
- 12 testes das Cloud Functions, em suíte própria;
- 15 cenários das `firestore.rules` rodando no emulador do Firestore, que é
  onde mora o risco real deste app — autorização, não navegação;
- build de produção no CI.

## Opções consideradas

**Consertar o assert e colocar no CI.** Exigiria trocar `cy.contains` por uma
asserção sobre o canvas (ou adicionar um `data-testid` só para teste) **e**
subir emuladores de Auth e Firestore no workflow, porque o teste faz cadastro
real. Custo de um a dois dias, para cobrir um fluxo que os testes de unidade já
exercitam por partes.

**Consertar e manter fora do CI.** Barato, mas preserva exatamente o problema
que gerou esta decisão: um teste que ninguém roda volta a apodrecer, e o próximo
a olhar confia numa cobertura que não existe.

**Trocar por Playwright.** Ferramenta melhor para o caso, mas a escolha da
ferramenta não é o gargalo — o gargalo é que ninguém roda E2E hoje, e nenhuma
ferramenta conserta isso sozinha.

## Análise de trade-off

O que se perde é real: nenhum teste hoje percorre o app inteiro como um usuário,
então uma quebra de integração entre telas — uma rota que some, um contexto que
não provê — só aparece no uso manual.

Dois fatores tornam isso aceitável neste momento. O app tem **um usuário**, que
é o dono, e que testa no aparelho a cada mudança relevante; o custo de descobrir
uma quebra é minutos, não incidente. E o risco mais caro deste app não é
navegação, é **autorização** — um erro nas `firestore.rules` expõe dado de
terceiro, e isso já tem 15 cenários rodando no emulador a cada push, como o
PR #86 demonstrou ao ser pego por um cenário novo.

Manter o Cypress quebrado não comprava nada dessa proteção, e cobrava:
dependência a atualizar, plugin no ESLint, e a impressão falsa de cobertura.

## Consequências

- O `package.json` perde três devDependencies (`cypress`,
  `eslint-plugin-cypress` e, por tabela nesta mesma limpeza, `lighthouse`).
- Uma quebra de integração entre telas passa a ser pega pelo uso, não pelo CI.
- Se um teste de unidade novo precisar de DOM real de ponta a ponta, a resposta
  é escrever um teste de integração com Testing Library, não reintroduzir E2E
  para um caso só.

## Quando reabrir

Esta decisão é de momento, não de princípio. Volta à mesa quando **qualquer um**
destes acontecer:

- **Um segundo usuário.** A partir do momento em que alguém além do dono depende
  do app, descobrir quebra pelo uso deixa de ser aceitável.
- **Um fluxo crítico sem cobertura de unidade.** Hoje os caminhos de risco têm
  teste por partes; se surgir um que só faça sentido ponta a ponta — um
  pagamento, um onboarding com várias telas — ele justifica a suíte sozinho.
- **Uma quebra de integração em produção.** Um incidente que um E2E teria pego é
  o argumento mais forte possível, e deve ser tratado como gatilho.

Ao reabrir, começar por Playwright, com emuladores de Auth e Firestore no CI
desde o primeiro teste. Um E2E fora do CI é o estado que esta ADR removeu.

## Action Items

- [x] Remover `cypress`, `eslint-plugin-cypress`, `cypress.config.js` e
      `cypress/e2e/happy_path.cy.js`
- [x] Tirar o `pluginCypress` do `eslint.config.js`
- [x] Atualizar `docs/testing.md`
- [ ] Revisitar esta decisão se qualquer gatilho de "Quando reabrir" ocorrer
