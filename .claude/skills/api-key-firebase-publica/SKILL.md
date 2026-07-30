---
name: api-key-firebase-publica
description: >-
  Contexto sobre por que a API key do Firebase do Vitalità é pública por design e
  não deve ser rotacionada. Invoque antes de reagir a um alerta de secret scanning
  sobre a API key do Firebase embutida no bundle, ou antes de propor rotacionar a
  chave ou removê-la do código.
---

# API key do Firebase é pública por design

## A regra

A API key do Firebase **é pública e não deve ser rotacionada**. Ela é embutida
no bundle de propósito — só identifica o projeto, não concede acesso por si
só. Quem controla acesso de verdade são:

- `firestore.rules` (autorização por documento).
- As restrições de referrer/API na própria chave, no Google Cloud Console.
- App Check (ver [docs/app-check.md](../../../docs/app-check.md) — sem
  enforcement por decisão, não é lacuna esquecida).

## Histórico

Um alerta de secret scanning sobre essa chave já foi fechado como **won't
fix** em 21/07/2026. Se reaparecer (novo scanner, novo bot, nova pessoa no
time notando), a ação correta é **conferir as restrições de referrer da
chave**, não gerar uma chave nova.

## O que verificar se o alerta reaparecer

1. Confirmar em MANUAL_TECNICO.md §7 que a chave nesse commit é a mesma já
   avaliada.
2. Conferir no Google Cloud Console que os referrers ainda estão restritos aos
   domínios esperados (produção + `5175`/`4173` locais — portas fixas de
   propósito, ver `vite.config.js`).
3. Se os referrers estiverem corretos, responder ao alerta como falso
   positivo/won't-fix, sem rotacionar.

## Red flag

Qualquer proposta de gerar nova API key do Firebase, mover a chave para
variável de ambiente "secreta", ou tratar esse alerta como incidente sem antes
checar as restrições existentes.
