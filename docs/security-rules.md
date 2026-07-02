# Regras de Segurança

As regras do Firestore priorizam integridade dos dados do aluno e controle do vínculo aluno-personal.

## Objetivos da Sprint 1

- Permitir prescrição de treino por personal vinculado.
- Bloquear alteração e deleção de histórico pelo personal.
- Impedir alteração de campos de propriedade como `userId`, `createdBy` e `createdAt`.
- Versionar índices necessários para queries paginadas e ordenadas.

## Decisões Atuais

- Perfis em `users` não são leitura pública.
- Personal vinculado pode ler o perfil e histórico do aluno.
- Histórico de treino é criado pelo aluno dono da sessão.
- Personal pode ler histórico, mas não alterar cargas, repetições, conclusão de séries ou deletar sessão.
- Templates podem ser criados/editados por aluno dono ou personal vinculado.

## Limite Conhecido

O fluxo de convite agora usa `trainer_invites` com código revogável, expiração e consumo em batch. Ainda falta mover criação, aceite e revogação para Cloud Functions para ganhar auditoria centralizada, rate limit e prevenção mais forte contra abuso.

## Convites Aluno-Personal

- O personal cria um convite ativo em `trainer_invites`.
- O aluno informa o código no perfil.
- O app busca um convite `active` não expirado.
- O aceite cria `trainer_students/{studentId_trainerId}` e atualiza o convite para `expired` com `usedBy` e `usedAt` no mesmo batch.
- As rules bloqueiam criação de vínculo sem convite consumido no mesmo batch.

## Checklist ao Alterar Rules

- Verificar se o front-end ainda escreve os campos permitidos.
- Atualizar `docs/firestore-model.md` quando coleções/campos mudarem.
- Atualizar `firestore.indexes.json` quando uma query nova exigir índice composto.
- Adicionar ou atualizar teste em `tests/security/firestore.rules.test.js`.
