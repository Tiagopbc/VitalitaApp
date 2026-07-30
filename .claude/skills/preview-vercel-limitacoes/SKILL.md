---
name: preview-vercel-limitacoes
description: >-
  Contexto sobre por que previews da Vercel do Vitalità não autenticam nem leem o
  Firestore. Invoque antes de diagnosticar "PR quebrou o app" com base num preview
  *.vercel.app, ou antes de tentar liberar o domínio de preview na Google Cloud
  Console para "corrigir" login/Firestore no preview.
---

# Limitação de auth/Firestore em preview da Vercel

## O que acontece

Previews da Vercel (`vitalita-*.vercel.app`, um domínio por PR/branch) **não
autenticam nem leem o Firestore**. Não é bug do PR — é limitação da API key do
Firebase: o console do Google não aceita curinga parcial de subdomínio, só
curinga de path (`vitalita-*.vercel.app/*` não existe como opção, só domínio
completo por entrada). Cadastrar cada preview individualmente não escala.

## Antes de investigar como quebra

Se um PR "quebrou" auth ou leitura do Firestore **só no ambiente de preview**,
mas funciona em `npm run dev` (5175) ou `npm run preview` local (4173), a causa
mais provável é essa limitação conhecida, não o diff do PR. Confirme rodando o
mesmo build localmente antes de assumir regressão.

## Não tente resolver mudando a API key

A key já está com os referrers corretos para os domínios que o projeto usa de
verdade (produção + `5175`/`4173` locais). Ver
[api-key-firebase-publica](../api-key-firebase-publica/SKILL.md). Adicionar
previews da Vercel à lista de referrers não é uma correção de bug — é uma
mudança de escopo de acesso, e não escala por PR.

## Red flag

Diagnóstico de "regressão" baseado só em comportamento observado num preview
`*.vercel.app`, sem reproduzir localmente primeiro.
