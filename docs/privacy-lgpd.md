# Privacidade e LGPD

Este documento descreve o tratamento de dados do Vitalità como app de estudo,
portfólio e uso individual. Ele não substitui revisão jurídica formal, mas cria
uma base profissional para evolução do produto.

## Objetivos

- Minimizar coleta de dados ao necessário para treino, histórico e acompanhamento.
- Deixar claro quais dados existem em cada coleção do Firestore.
- Registrar versão de consentimento sem coletar IP, user agent ou hashes extras.
- Planejar exportação e exclusão de conta sem depender de infraestrutura paga.

## Versões legais atuais

- Política de Privacidade: `2026-07-07`
- Termos de Uso: `2026-07-07`

Novos cadastros por e-mail salvam no perfil:

```js
privacyConsent: {
  acceptedAt: serverTimestamp(),
  privacyVersion: '2026-07-07',
  termsVersion: '2026-07-07',
  source: 'email_signup'
}
```

Contas antigas podem não ter esse campo. A interface deve tratar esse caso sem
bloquear o usuário.

## Mapa de Dados

### `users/{userId}`

Finalidade:

- Identificação da conta.
- Perfil físico usado em estatísticas e experiência personalizada.
- Preferências de treino, descanso e meta semanal.
- Registro de versão de consentimento.

Dados:

- `fullName`, `displayName`, `email`, `photoURL`
- `createdAt`, `updatedAt`, `lastActiveAt`
- `activeWorkoutId`
- `weight`, `height`, `age`, `gender`, `goal`, `weeklyGoal`
- `birthDate`, `heightCm`, `weightKg`
- `defaultRestTime`, `autoStartTimer`
- `achievements`
- `privacyConsent`

Leitura:

- Próprio usuário.
- Personal vinculado ao aluno, quando aplicável.

Escrita:

- Próprio usuário.

### `workout_templates/{templateId}`

Finalidade:

- Guardar fichas de treino criadas pelo aluno ou atribuídas por personal.

Dados:

- `userId`, `createdBy`
- `name`, `exercises`
- `assignedByTrainer`
- `createdAt`, `updatedAt`
- `category`, `estimatedDuration`, `muscleGroups`
- `isFavorite`, `isArchived`, `lastPerformed`, `timesPerformed`

### `workout_sessions/{sessionId}`

Finalidade:

- Histórico concluído de treinos e cardio.
- Base para evolução, streaks, conquistas e métricas agregadas.

Dados:

- `userId`
- `templateId`, `templateName`, `workoutName`
- `duration`, `elapsedSeconds`
- `exercises`
- `createdAt`, `completedAt`, `completedAtClient`
- Campos de cardio: `isCardio`, `activityType`, `durationMin`,
  `distanceKm`, `intensity`, `calories`, `notes`

### `active_workouts/{userId}`

Finalidade:

- Recuperar sessão ativa se o app fechar, recarregar ou ficar offline.

Dados:

- `userId`
- `templateId`
- `elapsedSeconds`
- `exercises`
- `updatedAt`

Retenção:

- Deve existir apenas enquanto houver treino ativo recuperável.

### `trainer_students/{studentId_trainerId}`

Finalidade:

- Representar vínculo entre aluno e personal.

Dados:

- `studentId`
- `trainerId`
- `status`
- `linkedAt`
- `inviteId`

### `trainer_invites/{inviteId}`

Finalidade:

- Permitir convite revogável, expirável e de uso único para vínculo com personal.

Dados:

- `trainerId`
- `code`
- `status`
- `createdAt`
- `expiresAt`
- `usedBy`
- `usedAt`

### `user_stats/{userId}`

Finalidade:

- Evitar leituras grandes de histórico no cliente.
- Servir dados rápidos para dashboard, perfil e conquistas.

Dados:

- Totais de treinos, cardio, volume, séries, reps e recordes.
- Streaks diários e semanais.
- Meta semanal e completados na semana.
- Máximas por exercício.
- Estado de conquistas.
- `lastWorkoutAt`, `updatedAt`, `schemaVersion`, `source`.

Escrita:

- Apenas backend/rotina administrativa.
- Cliente lê e usa fallback recente quando o agregado ainda não existe.

## Exportação de Dados

Primeira versão implementada: exportação JSON gerada no cliente para o próprio usuário
a partir da tela de Perfil.

Escopo mínimo:

- Perfil em `users/{userId}`.
- Fichas em `workout_templates` do usuário.
- Histórico em `workout_sessions` do usuário.
- Sessão ativa em `active_workouts/{userId}`, se existir.
- Vínculos em `trainer_students` em que o usuário seja aluno ou personal.
- Convites em `trainer_invites` criados pelo usuário, quando ele for personal.
- Agregado em `user_stats/{userId}`.

Observações:

- A exportação lê apenas documentos que as regras permitem ao usuário autenticado.
- A exportação pode consumir leituras proporcionais ao volume de histórico do usuário.
- Para histórico grande, uma próxima versão pode paginar ou dividir o arquivo.
- O JSON deve incluir `exportedAt` e `schemaVersion`.
- CSV pode ser adicionado depois para histórico e evolução por exercício.

## Exclusão de Conta

Sem Cloud Functions pagas, a exclusão completa deve ser tratada com cuidado:

1. Revogar sessão ativa em `active_workouts/{userId}`.
2. Excluir ou anonimizar fichas em `workout_templates`.
3. Excluir histórico em `workout_sessions`.
4. Excluir vínculo como aluno em `trainer_students`.
5. Revogar convites criados pelo usuário como personal.
6. Excluir `user_stats/{userId}`.
7. Excluir `users/{userId}`.
8. Excluir conta no Firebase Auth.

Riscos:

- Exclusão feita só no cliente pode falhar no meio do processo.
- Sem função server-side, é mais difícil garantir atomicidade e auditoria.
- Para produção real, preferir uma Cloud Function callable ou rotina
  administrativa autenticada.

## Compartilhamento com Personal

- O vínculo aluno-personal deve ser explícito via convite.
- O aluno deve conseguir revogar o compartilhamento em uma etapa futura.
- O personal deve ler apenas dados necessários para acompanhamento.
- Histórico concluído não deve ser alterado pelo personal.

## Próximas Melhorias

- Criar fluxo de exportação JSON na interface do perfil.
- Criar solicitação de exclusão de conta com confirmação forte.
- Criar revogação de vínculo aluno-personal.
- Criar log de auditoria para ações sensíveis.
- Considerar Cloud Function apenas se o projeto sair do modo estudo gratuito.
