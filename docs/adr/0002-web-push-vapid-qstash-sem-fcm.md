# ADR-0002: Push de descanso via Web Push/VAPID + QStash, sem FCM

**Status:** Accepted
**Date:** 2026-07-19 (decisão original de projeto; registrada retroativamente em 2026-07-29)
**Deciders:** Tiago Cavalcanti

## Contexto

O timer de descanso entre séries precisa notificar o aluno quando o descanso
acaba, mesmo com a tela do celular bloqueada — é o caso de uso principal
(academia, celular no bolso ou na bancada). O Vitalità já usa só Firebase
Auth + Firestore, sem outros produtos Firebase habilitados na API key (ver
[ADR-0004](0004-app-check-monitoramento-sem-enforcement.md) e
`MANUAL_TECNICO.md` §7.2 — a key está restrita a 6 APIs, sem Cloud Messaging).

A pergunta: usar Firebase Cloud Messaging (FCM), a opção "óbvia" já que o
projeto é Firebase, ou implementar Web Push nativo com chaves VAPID próprias?

## Decisão

O push de descanso usa **Web Push nativo do navegador com par de chaves VAPID
próprio**, agendado e disparado via QStash (fila com delay), **não FCM**.
`src/services/restPushService.js` chama três funções serverless: agenda em
`api/schedule-rest-push.js`, que o QStash dispara depois em
`api/send-rest-push.js`; quando o descanso é interrompido ou reiniciado antes
do fim (`RestTimer.jsx`), o cliente chama `api/cancel-rest-push.js` para
cancelar o envio agendado. `public/push-sw.js` é registrado pelo
`vite-plugin-pwa`. Segredos
de servidor (`QSTASH_TOKEN`, `QSTASH_URL`, `PUSH_INTERNAL_SECRET`, chave
VAPID privada) vivem só nas variáveis de ambiente da Vercel.

## Opções consideradas

### Opção A: Web Push nativo + VAPID + QStash (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Média — implementação manual do protocolo Web Push e do agendamento |
| Custo | Zero fixo — QStash tem tier gratuito suficiente para uso pessoal |
| Escalabilidade | Suficiente para o volume atual; delay/agendamento é o próprio motivo de existir |
| Familiaridade da equipe | Exigiu aprender o protocolo Web Push do zero |
| Superfície da API key | Não exige habilitar Cloud Messaging na key do Firebase |

**Prós:** não adiciona a API do Cloud Messaging à superfície da key (menos
permissões = menos risco); QStash resolve o agendamento com delay de forma
nativa, sem precisar de um worker/cron próprio; funciona com o SDK-padrão do
navegador (`PushManager`), sem depender do SDK do Firebase para isso.
**Contras:** protocolo Web Push é mais manual que a API do FCM; exige gerar e
guardar um par de chaves VAPID próprio; menos documentação pronta do que o
caminho "oficial" do Firebase.

### Opção B: Firebase Cloud Messaging (FCM)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa a princípio — SDK do Firebase já integrado ao projeto |
| Custo | Zero fixo, mas exigiria agendamento externo mesmo assim (FCM não agenda com delay nativo) |
| Escalabilidade | Boa, mas redundante para o volume atual |
| Familiaridade da equipe | Alta, por já usar Firebase Auth/Firestore |
| Superfície da API key | Exigiria habilitar Cloud Messaging na key, ampliando permissões |

**Prós:** integração mais direta com o resto do stack Firebase; SDK maduro e
bem documentado.
**Contras:** FCM não resolve sozinho o agendamento com delay que o timer de
descanso precisa (a notificação dispara minutos depois do início do
descanso, não na hora do "envio") — ainda precisaria de uma fila externa tipo
QStash por cima; amplia a superfície de permissões da API key pública sem
necessidade, já que o projeto evita habilitar APIs que não usa.

## Análise de trade-off

O ponto decisivo não foi custo — as duas opções são gratuitas no volume
atual — foi **superfície de permissão da API key** e o fato de que **o
agendamento com delay já ia exigir uma fila externa de qualquer forma**,
tornando o FCM uma camada a mais sem eliminar a necessidade do QStash. Dado
isso, ir direto de Web Push nativo + QStash evita depender de mais um produto
Firebase habilitado.

## Consequências

- Testar esse fluxo só é confiável em iPhone com a tela bloqueada — desktop
  mascara falhas reais (ver
  [push-descanso](../../.claude/skills/push-descanso/SKILL.md)).
- A chave VAPID privada e o token do QStash são segredos de servidor de
  verdade (diferente da API key do Firebase) e precisam ficar fora do
  repositório.
- Qualquer mudança nesse fluxo não pode reintroduzir FCM sem repassar por
  essa decisão — habilitar Cloud Messaging na API key muda a superfície de
  permissão documentada em `MANUAL_TECNICO.md` §7.2.

## Action Items

1. [x] Documentar a decisão (este ADR).
2. [ ] Nenhuma ação de implementação pendente — decisão já em vigor desde 2026-07-19.
