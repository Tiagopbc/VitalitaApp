# Arquitetura

O Vitalità é um PWA em React/Vite com Firebase Authentication e Cloud Firestore.

## Camadas Principais

- `src/AppAuthed.jsx`: árvore de rotas autenticadas e preloading de telas. A navegação (`BottomNavEnhanced`, `DesktopSidebar`) mora em `src/components/navigation/`.
- `src/context/AuthContext.jsx`: usuário autenticado e perfil, consumido por `ProtectedRoute` e pelo `WorkoutContext`.
- `src/context/WorkoutContext.jsx`: estado global de treino ativo e redirecionamento para execução.
- `src/pages/`: telas de produto, incluindo dashboard, treinos, histórico, perfil e personal.
- `src/services/`: acesso a Firebase e regras de negócio compartilhadas. Sessão de treino é fatiada em `src/services/sessions/` (recuperação, sessão ativa).
- `src/hooks/`: lógica reutilizável de execução de treino, timer e sessão. `useWorkoutSession` é um orquestrador fino que compõe sub-hooks em `src/hooks/workout-session/` (carregamento, sincronização, ações de série, finalização).
- `src/components/`: componentes de UI, navegação, execução, histórico, conquistas e compartilhamento. A raiz de `src/` fica só com o boot do app (`main.jsx`, `App.jsx`, `AppAuthed.jsx`, Firebase, Sentry e CSS global).
- `src/utils/`: helpers puros de estatísticas, storage seguro e performance.

## Backend Atual

- Firebase Auth gerencia identidade.
- Firestore guarda perfis, templates, sessões, vínculos aluno-personal e sessão ativa.
- Totais, streaks e conquistas são calculados no cliente a partir das sessões recentes (`publishStats` em `HomeDashboard.jsx` e `hooks/profile/useAchievements.js`, com os utilitários puros de `src/utils/`). O agregado `user_stats` e a Cloud Function que o escrevia foram removidos em 11/2026 (ADR-0006); não há Cloud Functions no projeto.
- Firestore offline persistence fica em `src/firebaseDb.js`.
- Regras e índices são versionados na raiz do projeto.
- Observabilidade opcional fica em `src/services/observabilityService.js`, com Sentry carregado sob demanda e sanitização em `src/utils/observability.js`.
- App Check opcional inicia antes de a arvore React disparar requisicoes em `src/services/appCheckService.js` e permanece sem enforcement durante a fase de monitoramento.

## Pontos de Evolução

- Quebrar as páginas grandes (`WorkoutExecutionPage.jsx`, `ProfilePage.jsx`, `LoginPage.jsx`) em subcomponentes e hooks menores, seguindo o padrão orquestrador + sub-hooks já adotado em `useWorkoutSession`. Diretórios previstos: `src/components/auth/`, `src/components/profile/`, `src/hooks/profile/`, `src/hooks/workout-execution/`.
- Migrar convites e ações sensíveis para Cloud Functions.
- Expandir a classificação de erros do Firestore e alertas operacionais do Sentry.

## Referências

- `docs/adr/` — decisões arquiteturais com trade-offs (ADRs)
- `docs/firestore-model.md`
- `docs/security-rules.md`
- `docs/performance-data.md`
- `docs/testing.md`
- `docs/observability.md`
- `docs/app-check.md`
