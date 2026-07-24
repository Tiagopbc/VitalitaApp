# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Documentação, commits, PRs e comentários deste repositório são em **português**. Commits seguem Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## Comandos

```bash
npm run dev              # Vite em http://localhost:5175 (porta FIXA, ver "Portas" abaixo)
npm run build            # build de produção em dist/
npm run preview          # serve o build em http://localhost:4173 (porta fixa)
npm run lint             # ESLint — o CI reprova por lint
npm test -- --run        # Vitest sem watch (`npm test` sozinho fica em watch)
npm run test:rules       # regras do Firestore no emulador — exige Java 21
npm run test:coverage
npm --prefix functions test   # suíte das Cloud Functions, separada
```

Um teste isolado:

```bash
npm test -- --run src/services/workoutService.test.js
npm test -- --run -t "nome do caso"
```

Antes de commitar, rode a mesma sequência do CI — ele executa lint, Vitest, **testes das Functions**, regras do Firestore, build e coverage. A suíte de `functions/` tem `package.json` e `vitest.config.js` próprios e é fácil de esquecer:

```bash
npm run lint && npm test -- --run && npm --prefix functions test && npm run build
```

Vitest tem duas configurações: `vitest.config.js` (jsdom; cobre `src/**` e `api/**`, alias `@` → `src/`) e `vitest.rules.config.js` (node; só `tests/security/`, sem paralelismo).

## Arquitetura

PWA em React 19 + Vite, com Firebase Auth e Cloud Firestore direto do cliente. Não há servidor próprio além de três funções serverless na Vercel (`api/`) para push. Detalhes em [docs/architecture.md](docs/architecture.md) e [MANUAL_TECNICO.md](MANUAL_TECNICO.md).

- `src/AppAuthed.jsx` — árvore de rotas autenticadas e preload de telas.
- `src/context/WorkoutContext.jsx` — treino ativo, persistência e detecção de sessão fantasma.
- `src/services/` — todo acesso a Firebase e regra de negócio compartilhada.
- `src/utils/` — helpers puros (estatísticas, storage, observabilidade).

**Padrão orquestrador + sub-hooks.** Hooks grandes são um orquestrador fino compondo sub-hooks num diretório irmão: `useWorkoutSession.js` compõe `hooks/workout-session/*` (loader, sync, ações de série, finalização). O mesmo vale para `services/sessions/`, `hooks/workout-execution/` e `hooks/profile/`. Ao quebrar página ou hook grande, siga esse formato em vez de criar um arquivo novo solto.

**Integrações são defensivas.** Sentry, App Check e Cloud Functions são todos opcionais e inicializados sob demanda; falha em qualquer um deles nunca pode impedir o boot do app.

## Armadilhas específicas deste projeto

Ler antes de "consertar" algo que parece quebrado — vários destes já foram decisões conscientes.

**A API key do Firebase é pública e não deve ser rotacionada.** Ela é embutida no bundle por design e apenas identifica o projeto. Quem controla acesso são `firestore.rules`, as restrições da chave e o App Check. Um alerta de secret scanning já foi fechado como *won't fix* por isso (21/07/2026); se reaparecer, confira as restrições em vez de gerar chave nova. Detalhes em [MANUAL_TECNICO.md](MANUAL_TECNICO.md) §7.

**Portas de dev são fixas de propósito.** A API key restringe referrers e o console do Google rejeita curinga de porta, então `5175` (dev) e `4173` (preview) estão fixados em `vite.config.js` e registrados na chave. Não os altere.

**Previews da Vercel não autenticam nem leem o Firestore.** Curinga parcial de subdomínio (`vitalita-*.vercel.app`) não é aceito pelo console. Antes de concluir que um PR quebrou o app em preview, verifique se não é isso.

**`VITE_*` é embutida em tempo de build.** Mudar variável na Vercel não tem efeito sem redeploy.

**`user_stats` recalculado no cliente é intencional, não dívida.** `VITE_ENABLE_SERVER_USER_STATS` fica desligada por padrão para operar em custo zero; com ela desligada o cliente recalcula totais, streaks e conquistas a partir das sessões recentes (fallback em `ProfilePage.jsx` e `publishStats` de `HomeDashboard.jsx`). A Cloud Function existe mas não é lida.

**Nunca importe `firebase/auth` (ou qualquer pacote do Firebase) dinamicamente.** Todo o app importa esses pacotes de forma estática (`src/firebaseAuth.js`, `src/firebaseDb.js`). Um único `await import('firebase/auth')` faz o `manualChunks` do `vite.config.js` emitir o `vendor-firebase-app` com dependência circular, e o app **não passa da tela "Carregando..."** em produção, com `Cannot access 're' before initialization`. Aconteceu em 23/07/2026 e derrubou produção.

**Build de produção só é verificado rodando o bundle, com as flags de produção ligadas.** `npm run build` prova que compila, não que executa — e um `npm run preview` sem as `VITE_*` de produção pode esconder o bug, porque o Rollup remove por tree-shaking o código que a flag desliga. Foi assim que a quebra acima escapou. Para reproduzir o build real: `VITE_ENABLE_PDF_IMPORT=true npm run build && npm run preview` e abra http://localhost:4173.

**A importação por PDF é a única funcionalidade paga.** `api/parse-workout-pdf.js` chama a API da Anthropic (`claude-opus-4-8`) para ler a ficha, a ~US$ 0,04 por PDF. Exige três variáveis: `ANTHROPIC_API_KEY` e `FIREBASE_PROJECT_ID` (servidor, nunca `VITE_*`) e `VITE_ENABLE_PDF_IMPORT=true` (build) para exibir o botão — o cliente não consegue detectar a config do servidor sem gastar requisição. Sem elas o botão some ou a função responde 503, sem afetar o resto. A função **só parseia** — quem grava em `workout_templates` é o cliente autenticado via `workoutService.createTemplate`, respeitando as `firestore.rules`. A revisão humana no `CreateWorkoutPage` antes de salvar é proposital, não opcional. Detalhes em [MANUAL_TECNICO.md](MANUAL_TECNICO.md) §7.4.

**A importação por PDF lê VÁRIOS treinos e decompõe bi-sets.** A resposta é `{ workouts: [...] }` — um item por ficha do documento (Treino A, B, C). Bi-set/tri-set são quebrados em exercícios separados e consecutivos, marcados com `groupedWithPrevious`; o cliente (`assignGroupIds` em `workoutPdfImport.js`) converte isso no `groupId` que `exerciseGroups.js` usa para ligar a dupla. A decomposição é **rede de segurança determinística** no servidor (`decomposeExercise`): mesmo que a IA devolva "A + B" num nome só, a função separa. No `CreateWorkoutPage` os treinos entram numa **fila de revisão** — salva um, o próximo aparece.

**Toda escrita em `workout_templates` passa por `workoutService`.** `createTemplate`/`updateTemplate` são o caminho único usado pela criação manual, pela biblioteca de modelos (`src/data/starterWorkouts.js`) e pela importação por PDF. Não volte a chamar `addDoc` direto numa página.

**As `firestore.rules` só validam chaves de topo.** O `hasOnly` roda sobre `request.resource.data.keys()`, então campos *dentro* do array `exercises` (como o `targetWeight` da carga-alvo) não precisam ser liberados nas regras. Campo novo no topo do documento, sim — e aí exige cenário em `tests/security/firestore.rules.test.js`.

**O push de descanso não usa FCM.** É Web Push nativo com VAPID própria, agendado via QStash: `src/services/restPushService.js` → `api/schedule-rest-push.js` → `api/send-rest-push.js`, com `public/push-sw.js` importado no service worker pelo `vite-plugin-pwa`. Segredos de servidor (`QSTASH_TOKEN`, `QSTASH_URL`, `PUSH_INTERNAL_SECRET`, chave VAPID privada) existem só nas variáveis de ambiente da Vercel.

**Testar push só vale em iPhone com a tela bloqueada.** No desktop o push aparece mesmo com falhas que quebram o fluxo real.

**App Check está sem enforcement por decisão.** Ele só coleta métricas. Só ligue depois de dias com verificação perto de 100%, e apenas no Cloud Firestore — nunca no Authentication enquanto estiver em pré-lançamento, sob risco de travar o login. Ver [docs/app-check.md](docs/app-check.md).

## Segurança do Firestore

`firestore.rules` e `firestore.indexes.json` são versionados na raiz e validam propriedade, vínculo aluno–personal e campos permitidos. Qualquer mudança em regra precisa de cenário correspondente em `tests/security/firestore.rules.test.js`, que roda no emulador. Ver [docs/security-rules.md](docs/security-rules.md) e [docs/firestore-model.md](docs/firestore-model.md).
