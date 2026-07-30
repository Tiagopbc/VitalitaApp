---
name: porta-fixa-worktree-dev
description: >-
  Contexto sobre as três armadilhas de rodar `npm run dev` num git worktree
  deste repo: `.env.local` não é copiado pro worktree (é ignorado pelo git),
  a porta 5175 é um recurso único disputado entre todos os checkouts (fixa
  por causa da restrição de referrer da API key do Firebase), e a ferramenta
  `preview_start` sempre inicia o servidor a partir do checkout principal,
  nunca do worktree. Invoque antes de rodar `npm run dev`/`preview_start` num
  worktree deste repo, ou ao ver `auth/invalid-api-key`/"Variáveis de
  Ambiente Firebase Ausentes" num worktree recém-criado.
---

# Testar num worktree deste repo: três armadilhas

## 1. `.env.local` não existe no worktree

As credenciais reais do Firebase ficam em `.env.local` na raiz do checkout
principal, ignorado pelo git (`.gitignore:15` e `:44`, `.env` e
`.env*.local`). `git worktree add` — usado internamente pela ferramenta
`EnterWorktree` — só copia arquivos versionados, então todo worktree novo
nasce só com o `.env.example` (valores em branco). Sem `.env.local`, o app
quebra no boot com `[CRÍTICO] Variáveis de Ambiente Firebase Ausentes` e
`FirebaseError: Firebase: Error (auth/invalid-api-key)`.

**Correção:** linkar, não copiar — os dois checkouts usam o mesmo projeto
Firebase, então uma cópia fica desatualizada silenciosamente se a credencial
girar.

```bash
ln -sf /Users/tiagoc/VitalitaApp/.env.local \
       /Users/tiagoc/VitalitaApp/.claude/worktrees/<nome-do-worktree>/.env.local
```

O Vite só lê `.env.local` na subida do processo — se o dev server já estava
rodando antes do symlink existir, precisa reiniciar (`kill` + `npm run dev`
de novo) pra pegar as variáveis.

## 2. Porta 5175 é um recurso único, não por worktree

A restrição de referrer HTTP da API key do Firebase (Google Cloud Console)
só libera `http://localhost:5175/*` e `http://localhost:4173/*` — não dá pra
rodar em outra porta nem trocar isso (ver `CLAUDE.md`, "Portas de dev são
fixas de propósito"). Então só um `npm run dev` — de qualquer checkout,
principal ou worktree — pode ocupar a porta por vez. Se outro processo já
está lá (de outra sessão, de outro worktree, do usuário testando manualmente
ou de você mesmo numa rodada anterior), o navegador continua carregando
normalmente, só que servindo o código errado, **sem nenhum erro visível**.

**Antes de matar qualquer coisa na porta 5175, sempre identificar o dono:**

```bash
lsof -nP -iTCP:5175 -sTCP:LISTEN
ps -p <PID> -o pid,ppid,command
lsof -p <PID> | grep cwd
```

E confirmar com o usuário antes do `kill` — pode ser uma sessão concorrente
de verdade, não sobra de teste. Depois de subir o servidor certo, sempre
provar que o código servido é o esperado (ex.: `curl` num arquivo que você
sabe que mudou e procurar pelo trecho novo), nunca assumir pela ausência de
erro.

## 3. `preview_start` sempre nasce no checkout principal

A ferramenta `mcp__Claude_Browser__preview_start` (config `vitalita-dev` em
`.claude/launch.json`) inicia o `npm run dev` com cwd sempre em
`/Users/tiagoc/VitalitaApp`, mesmo chamada de dentro de uma sessão presa a
um worktree — confirmado via `lsof -p <pid> | grep cwd` no processo
resultante. É inútil pra servir código específico de um worktree.

**Correção:** subir o servidor direto via Bash, de dentro do worktree, em
background:

```bash
cd /Users/tiagoc/VitalitaApp/.claude/worktrees/<nome-do-worktree> && npm run dev
```

(`run_in_background: true`), e confirmar o cwd do processo resultante antes
de assumir que está servindo o worktree.

## Red flag

Testar visualmente uma mudança de um worktree e ver a tela "certa demais"
(sem nenhum erro, mas também sem a mudança esperada) — é sinal de estar
olhando o código do checkout errado, não de a mudança não ter funcionado.
