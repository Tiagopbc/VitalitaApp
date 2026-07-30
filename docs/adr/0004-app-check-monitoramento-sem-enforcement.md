# ADR-0004: App Check em modo monitoramento, sem enforcement

**Status:** Accepted
**Date:** 2026-07-14
**Deciders:** Tiago Cavalcanti

## Contexto

A API key do Firebase é pública por design
([MANUAL_TECNICO.md §7.1](../../MANUAL_TECNICO.md)) e não autoriza acesso —
quem autoriza é `firestore.rules`. O Firebase App Check adiciona uma camada
extra: atesta que a requisição vem do app legítimo (via reCAPTCHA
Enterprise), e pode opcionalmente **bloquear** requisições sem token válido
(enforcement).

O projeto não tem conta de faturamento vinculada — decisão deliberada para
operar a custo zero. A pergunta: ativar App Check com enforcement desde já
para reforçar a segurança, ou rodar só em modo observação primeiro?

## Decisão

App Check é inicializado com **reCAPTCHA Enterprise apenas para emitir
tokens e observar métricas**. Firestore e as demais APIs continuam aceitando
requisições sem token válido — **nenhum enforcement está ativo**. Detalhes
completos em [docs/app-check.md](../app-check.md).

## Opções consideradas

### Opção A: Monitoramento sem enforcement (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa — inicialização opcional, falha não bloqueia boot |
| Custo | Zero — cota gratuita de 10.000 assessments/mês do reCAPTCHA Enterprise, sem faturamento vinculado |
| Risco de bloquear tráfego legítimo | Nenhum — enforcement desligado |
| Cobertura de segurança | Parcial — App Check observa, mas não impede abuso |

**Prós:** zero risco de bloquear login, sincronização offline ou conclusão
de treino por token ausente/inválido em algum cliente não coberto (versão
antiga do PWA em cache, navegador não testado); permite validar métricas
reais antes de qualquer decisão de bloqueio; não precisa de conta de
faturamento vinculada, então excesso de cota falha graciosamente sem custo.
**Contras:** não bloqueia abuso automatizado enquanto durar essa fase —
proteção real continua sendo só `firestore.rules` + Auth.

### Opção B: Enforcement imediato

| Dimensão | Avaliação |
|---|---|
| Complexidade | Média — exige validar antes que todo cliente legítimo emita token corretamente |
| Custo | Mesmo tier gratuito, mas risco de precisar de faturamento se a cota estourar sob bloqueio ativo |
| Risco de bloquear tráfego legítimo | Alto — PWA instalado com cache antigo, navegadores não testados |
| Cobertura de segurança | Completa desde o início |

**Prós:** fecha a superfície de abuso imediatamente.
**Contras:** risco real de bloquear o próprio uso do app — PWA instalado
mantém versões antigas em cache por tempo indeterminado até atualizar;
nenhuma métrica prévia para saber se o app teria cobertura real antes de
ativar; reverter um bloqueio em produção é pior do que nunca tê-lo ativado
sem dados.

## Análise de trade-off

Para um app de uso pessoal/pequena escala sem conta de faturamento, o custo
de **um falso bloqueio** (usuário real trancado fora do próprio treino)
supera o benefício de fechar a superfície de abuso mais cedo — especialmente
porque `firestore.rules` já é a camada de autorização real; App Check é
defesa em profundidade, não a única barreira.

## Consequências

- Enforcement só deve ser avaliado quando: a versão com App Check estiver
  publicada e estável, as métricas mostrarem praticamente todo o tráfego
  legítimo verificado, login/sync offline/conclusão de treino tiverem sido
  testados no PWA, existir plano de rollback documentado, e o uso do
  provider permanecer dentro da cota gratuita.
- Ativar enforcement é uma **decisão separada**, não uma evolução automática
  desta — exige teste em Preview e aprovação explícita (ver
  `docs/app-check.md` §"Critério Para Enforcement Futuro").
- Não vincular Cloud Billing só para viabilizar App Check — se o volume se
  aproximar da cota gratuita, a resposta é remover
  `VITE_FIREBASE_APP_CHECK_SITE_KEY` temporariamente, não pagar por mais
  cota.

## Action Items

1. [x] Documentar a decisão (este ADR).
2. [ ] Revisar mensalmente o volume no console do reCAPTCHA Enterprise
   (checklist já existe em `docs/app-check.md`).
3. [ ] Reavaliar enforcement quando os critérios acima forem atendidos —
   como decisão nova, não automática.
