# Arquitetura

O Vitalità é um PWA em React/Vite com Firebase Authentication e Cloud Firestore.

## Camadas Principais

- `src/AppAuthed.jsx`: árvore de rotas autenticadas, navegação e preloading de telas.
- `src/context/WorkoutContext.jsx`: estado global de treino ativo e redirecionamento para execução.
- `src/pages/`: telas de produto, incluindo dashboard, treinos, histórico, perfil e personal.
- `src/services/`: acesso a Firebase e regras de negócio compartilhadas. Sessão de treino é fatiada em `src/services/sessions/` (recuperação, sessão ativa).
- `src/hooks/`: lógica reutilizável de execução de treino, timer e sessão. `useWorkoutSession` é um orquestrador fino que compõe sub-hooks em `src/hooks/workout-session/` (carregamento, sincronização, ações de série, finalização).
- `src/components/`: componentes de UI, execução, histórico, conquistas e compartilhamento.
- `src/utils/`: helpers puros de estatísticas, storage seguro e performance.

## Backend Atual

- Firebase Auth gerencia identidade.
- Firestore guarda perfis, templates, sessões, vínculos aluno-personal e sessão ativa.
- Agregados de `user_stats/{userId}` são opcionais e controlados pela flag `VITE_ENABLE_SERVER_USER_STATS` (`src/services/userStatsService.js`), desligada por padrão para operar em custo zero. Com a flag desligada, existe uma Cloud Function (`rebuildUserStatsOnSessionCreated` em `functions/`) que pode atualizar `user_stats`, mas o cliente não a lê: os totais, streaks e conquistas são recalculados no cliente a partir das sessões recentes (fallback em `ProfilePage.jsx` e no `publishStats` de `HomeDashboard.jsx`, usando os utilitários puros de `src/utils/`). É uma decisão consciente de custo, não uma pendência.
- Firestore offline persistence fica em `src/firebaseDb.js`.
- Regras e índices são versionados na raiz do projeto.
- Observabilidade opcional fica em `src/services/observabilityService.js`, com Sentry carregado sob demanda e sanitização em `src/utils/observability.js`.
- App Check opcional inicia antes de a arvore React disparar requisicoes em `src/services/appCheckService.js` e permanece sem enforcement durante a fase de monitoramento.

## Pontos de Evolução

- Quebrar as páginas grandes (`WorkoutExecutionPage.jsx`, `ProfilePage.jsx`, `LoginPage.jsx`) em subcomponentes e hooks menores, seguindo o padrão orquestrador + sub-hooks já adotado em `useWorkoutSession`. Diretórios previstos: `src/components/auth/`, `src/components/profile/`, `src/hooks/profile/`, `src/hooks/workout-execution/`.
- Criar atualização incremental para agregados em `user_stats` (hoje o cálculo client-side é integral), como pré-requisito para ligar `VITE_ENABLE_SERVER_USER_STATS` sem regressão de custo.
- Migrar convites e ações sensíveis para Cloud Functions.
- Expandir a classificação de erros do Firestore e alertas operacionais do Sentry.

## Referências

- `docs/firestore-model.md`
- `docs/functions-deploy.md`
- `docs/security-rules.md`
- `docs/performance-data.md`
- `docs/user-stats-backfill.md`
- `docs/testing.md`
- `docs/observability.md`
- `docs/app-check.md`
