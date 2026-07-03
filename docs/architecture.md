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
- Firestore offline persistence fica em `src/firebaseDb.js`.
- Regras e índices são versionados na raiz do projeto.

## Pontos de Evolução

- Separar `useWorkoutSession.js` em serviços menores para sessão ativa, recuperação e sincronização.
- Trocar leituras completas de histórico por agregados em `user_stats`.
- Migrar convites e ações sensíveis para Cloud Functions.
- Expandir observabilidade do Sentry com tags de rota, versão, PWA/offline e erros de Firestore.

## Referências

- `docs/firestore-model.md`
- `docs/security-rules.md`
- `docs/performance-data.md`
- `docs/testing.md`
