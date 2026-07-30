---
name: verificacao-build-producao
description: >-
  Contexto sobre como verificar de verdade um build de produção do Vitalità antes
  de dar por encerrada uma mudança que mexe em chunking, imports do Firebase, flags
  VITE_* ou boot do app. Invoque antes de afirmar que "o build passou" com base só
  em `npm run build`, ou ao depurar algo que funciona em dev mas quebra só em
  produção/preview.
---

# Verificação de build de produção

## O problema

`npm run build` só prova que compila, **não que executa**. Um
`npm run preview` sem as `VITE_*` de produção pode esconder o mesmo bug, porque
o Rollup remove por tree-shaking o código que a flag desliga — o bug some do
bundle antes mesmo de rodar. Foi assim que a quebra de boot por import dinâmico
do `firebase/auth` (ver [boot-producao-firebase](../boot-producao-firebase/SKILL.md))
escapou de uma verificação aparentemente correta e derrubou produção em
23/07/2026.

## Como reproduzir o build real

```bash
VITE_ENABLE_PDF_IMPORT=true npm run build && npm run preview
```

Abra `http://localhost:4173` (porta fixa, registrada na API key — não altere) e
confirme que o app sai da tela "Carregando..." e chega ao login/dashboard sem
erro no console.

Também dá para usar a configuração `vitalita-preview` já registrada em
`.claude/launch.json` (porta 4173) com as ferramentas de preview do browser em
vez de abrir manualmente.

## Quando isso é obrigatório, não opcional

- Qualquer mudança em `vite.config.js` (`manualChunks`, plugins, `build.*`).
- Qualquer novo import de pacote do Firebase, estático ou dinâmico.
- Qualquer mudança que dependa de uma `VITE_*` estar ligada (a flag muda o que
  o Rollup inclui no bundle).

## Red flag

"Rodei `npm run build` e passou" não é evidência de que produção funciona —
é evidência de que compila. Sem o passo com preview e as flags de produção
ligadas, a afirmação de que o build está ok é injustificada.
