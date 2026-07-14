# Arquitetura

O Vitalità é um PWA em React/Vite com Firebase Authentication e Cloud Firestore.

## Camadas Principais

- `src/AppAuthed.jsx`: árvore de rotas autenticadas, navegação e preloading de telas.
- `src/context/WorkoutContext.jsx`: estado global de treino ativo e redirecionamento para execução.
- `src/pages/`: telas de produto, incluindo dashboard, treinos, histórico, perfil e personal.
- `src/services/`: acesso a Firebase e regras de negócio compartilhadas.
- `src/hooks/`: lógica reutilizável de execução de treino, timer e sessão.
- `src/components/`: componentes de UI, execução, histórico, conquistas e compartilhamento.
- `src/utils/`: helpers puros de estatísticas, storage seguro e performance.

## Backend Atual

- Firebase Auth gerencia identidade.
- Firestore guarda perfis, templates, sessões, vínculos aluno-personal e sessão ativa.
- Cloud Functions atualiza `user_stats/{userId}` a partir de sessões concluídas.
- Firestore offline persistence fica em `src/firebaseDb.js`.
- Regras e índices são versionados na raiz do projeto.
- Observabilidade opcional fica em `src/services/observabilityService.js`, com Sentry carregado sob demanda e sanitização em `src/utils/observability.js`.
- App Check opcional inicia antes de a arvore React disparar requisicoes em `src/services/appCheckService.js` e permanece sem enforcement durante a fase de monitoramento.

## Pontos de Evolução

- Separar `useWorkoutSession.js` em serviços menores para sessão ativa, recuperação e sincronização.
- Criar backfill e atualização incremental para agregados em `user_stats`.
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
