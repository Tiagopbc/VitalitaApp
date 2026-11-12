# Arquitetura

O Vitalità é um PWA em React/Vite com Firebase Authentication e Cloud Firestore.

## Camadas Principais

- `src/AppAuthed.jsx`: árvore de rotas autenticadas e preloading de telas. A navegação (`BottomNavEnhanced`, `DesktopSidebar`) mora em `src/components/navigation/`.
- `src/context/AuthContext.jsx`: usuário autenticado e perfil, consumido por `ProtectedRoute` e pelo `WorkoutContext`.
- `src/context/WorkoutContext.jsx`: estado global de treino ativo e redirecionamento para execução.
- `src/pages/`: telas de produto, incluindo dashboard, treinos, histórico, perfil e personal.
- `src/services/`: acesso a Firebase e regras de negócio compartilhadas. Sessão de treino é fatiada em `src/services/sessions/` (recuperação, sessão ativa).
- `src/hooks/`: lógica reutilizável de execução de treino, timer e sessão. `useWorkoutSession` é um orquestrador fino que compõe sub-hooks em `src/hooks/workout-session/` (carregamento, sincronização, ações de série, finalização). O mesmo formato vale para `src/hooks/history/` (diário, filtros, cache da busca global e histórico por exercício), que a `HistoryPage` compõe, para `src/hooks/home/` (dados e estatísticas, cache local, compartilhamento da frase), que a `HomeDashboard` compõe, para `src/hooks/create-workout/` (rascunho da ficha, editor de exercício, busca no catálogo, fila do PDF e salvamento), que a `CreateWorkoutPage` compõe, e para `src/hooks/workouts/` (lista de fichas, filtros, menu do card, ordenação e ações), que a `WorkoutsPage` compõe.
- `src/components/`: componentes de UI, navegação, execução, histórico, conquistas e compartilhamento. A raiz de `src/` fica só com o boot do app (`main.jsx`, `App.jsx`, `AppAuthed.jsx`, Firebase, Sentry e CSS global).
- `src/utils/`: helpers puros de estatísticas, storage seguro e performance.

## Backend Atual

- Firebase Auth gerencia identidade.
- Firestore guarda perfis, templates, sessões, vínculos aluno-personal e sessão ativa.
- Totais, streaks e conquistas são calculados no cliente a partir das sessões recentes (`publishStats` em `hooks/home/useHomeDashboardData.js` e `hooks/profile/useAchievements.js`, com os utilitários puros de `src/utils/`). O agregado `user_stats` e a Cloud Function que o escrevia foram removidos em 11/2026 (ADR-0006); não há Cloud Functions no projeto.
- Firestore offline persistence fica em `src/firebaseDb.js`.
- Regras e índices são versionados na raiz do projeto.
- Observabilidade opcional fica em `src/services/observabilityService.js`, com Sentry carregado sob demanda e sanitização em `src/utils/observability.js`.
- App Check opcional inicia antes de a arvore React disparar requisicoes em `src/services/appCheckService.js` e permanece sem enforcement durante a fase de monitoramento.

## Pontos de Evolução

- As quatro páginas de 700+ linhas viraram orquestradores na revisão geral 2026-09 (D16–D19). A `LoginPage` seguiu o mesmo caminho em 11/2026 (`src/hooks/login/`). Ainda passam de ~300 linhas `TrainerDashboard.jsx` (477) e `WorkoutExecutionPage.jsx` (437): quando forem tocadas, seguir o mesmo formato, com `src/hooks/<página>/` e `src/components/<página>/`.
- Convites e demais ações sensíveis seguem protegidos pelas `firestore.rules`. Mover qualquer um para servidor exige ADR novo: o projeto não tem Cloud Functions (ADR-0001, ADR-0006).
- Expandir a classificação de erros do Firestore e alertas operacionais do Sentry.

## Referências

- `docs/adr/` — decisões arquiteturais com trade-offs (ADRs)
- `docs/firestore-model.md`
- `docs/security-rules.md`
- `docs/performance-data.md`
- `docs/testing.md`
- `docs/observability.md`
- `docs/app-check.md`
