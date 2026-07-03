# Modelo Firestore

Este documento descreve o modelo atual e os campos esperados pelas regras de segurança.

## `users/{userId}`

Perfil do usuário autenticado.

Campos comuns:

- `fullName`, `displayName`, `email`
- `createdAt`, `updatedAt`, `lastActiveAt`
- `activeWorkoutId`
- `weight`, `height`, `age`, `gender`, `goal`, `weeklyGoal`
- `birthDate`, `heightCm`, `weightKg`
- `defaultRestTime`, `autoStartTimer`
- `achievements`

Leitura:

- O próprio usuário.
- Personal vinculado ao aluno.

Escrita:

- Apenas o próprio usuário.

## `workout_templates/{templateId}`

Ficha de treino do aluno ou do próprio usuário.

Campos esperados:

- `userId`: dono do treino.
- `createdBy`: usuário que criou o treino.
- `name`
- `exercises`
- `assignedByTrainer`
- `createdAt`, `updatedAt`
- Campos opcionais: `category`, `estimatedDuration`, `muscleGroups`, `isFavorite`, `isArchived`, `lastPerformed`, `timesPerformed`.

Regras principais:

- Aluno pode criar treino para si mesmo.
- Personal pode criar treino para aluno vinculado.
- `createdBy` deve ser o usuário autenticado na criação.
- `userId`, `createdBy` e `createdAt` não devem ser alterados depois da criação.

## `workout_sessions/{sessionId}`

Histórico concluído de treino ou cardio.

Campos esperados:

- `userId`
- `templateId`, `templateName`, `workoutName`
- `duration`, `elapsedSeconds`
- `exercises`
- `createdAt`, `completedAt`, `completedAtClient`
- Campos de cardio: `isCardio`, `activityType`, `durationMin`, `distanceKm`, `intensity`, `calories`, `notes`

Regras principais:

- Aluno cria e lê o próprio histórico.
- Personal vinculado pode ler o histórico do aluno.
- Personal nao pode alterar nem deletar histórico.
- Atualizações do aluno ficam restritas a campos não críticos.

## `trainer_students/{studentId_trainerId}`

Vínculo entre aluno e personal.

Campos esperados:

- `studentId`
- `trainerId`
- `status`
- `linkedAt`
- `inviteId`

Criação:

- O aluno só pode criar vínculo para si mesmo.
- A criação exige `inviteId`.
- O convite precisa estar ativo e ser consumido no mesmo batch.

## `active_workouts/{userId}`

Snapshot da sessão ativa do usuário.

Campos esperados:

- `userId`
- `templateId`
- `elapsedSeconds`
- `exercises`
- `updatedAt`

Escrita:

- Apenas o próprio usuário.

## `trainer_invites/{inviteId}`

Convites revogáveis, expiráveis e de uso único.

Campos:

- `trainerId`
- `code`
- `status`: `active`, `revoked` ou `expired`
- `createdAt`
- `expiresAt`
- `usedBy`
- `usedAt`

Regras principais:

- Personal cria convite para si mesmo.
- Personal pode revogar convite ativo.
- Aluno autenticado pode ler convite ativo e não expirado.
- Ao aceitar, o aluno cria `trainer_students` e atualiza o convite para `expired` no mesmo batch.

## `user_stats/{userId}`

Agregados server-side para performance, streaks e conquistas. O front end pode ler,
mas nao pode escrever nesta coleção.

Campos principais:

- `userId`
- `schemaVersion`
- `source`
- `totalWorkouts`
- `strengthWorkouts`
- `cardioWorkouts`
- `currentStreak`
- `longestStreak`
- `currentWeeklyStreak`
- `longestWeeklyStreak`
- `currentDailyStreak`
- `longestDailyStreak`
- `weeklyGoal`
- `weeklyCompleted`
- `totalVolume`
- `totalTonnageKg`
- `monthlyVolume`
- `totalSets`
- `totalReps`
- `prsCount`
- `distinctExercises`
- `exerciseMaxes`
- `achievementStats`
- `achievements`
- `lastWorkoutAt`
- `updatedAt`

Atualização:

- Cloud Functions atualiza o documento quando uma sessão em `workout_sessions` é criada.
- O cliente usa fallback temporário para uma janela recente se o agregado ainda não existir.
