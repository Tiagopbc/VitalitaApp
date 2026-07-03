# Performance e dados

Este documento registra as decisões atuais para reduzir leituras grandes no Firestore sem mudar o modelo de produto.

## Leituras de sessões

- `getHistory(userId, templateName, lastDoc, pageSize)` é a API principal para histórico paginado.
- `getRecentSessions(userId, limitCount)` deve ser usada em telas de resumo e estatísticas recentes.
- `subscribeToRecentSessions(userId, callback, limitCount)` deve ser usada em dashboards que precisam de atualização em tempo real.
- `getAllSessions(userId)` continua existindo apenas como compatibilidade para fluxos que ainda dependem de histórico completo.

## Limites atuais

Os limites ficam centralizados em `SESSION_LIMITS` no `workoutService`:

- `dashboardRecent`: 120 sessões recentes.
- `analyticsGlobalPage`: 120 sessões por página na busca global de evolução.
- `profileStats`: 300 sessões recentes para perfil/conquistas.
- `achievementCheck`: 300 sessões recentes para avaliação pós-treino.

## Comportamento por tela

- HomeDashboard: assina somente as sessões recentes, em vez de observar todo o histórico.
- HomeDashboard: prefere `user_stats` para totais, streaks e próxima conquista quando o agregado existe.
- HistoryPage/Diário: usa paginação com `getHistory`.
- HistoryPage/Evolução global: carrega uma página recente e permite carregar mais histórico sob demanda.
- ProfilePage: prefere `user_stats` para estatísticas e conquistas; usa janela recente apenas como fallback.

## Agregados `user_stats`

`user_stats/{userId}` é escrito por Cloud Functions quando uma sessão é criada em
`workout_sessions`. As regras bloqueiam escrita do cliente, então totais vitalícios,
streaks e conquistas deixam de depender de cálculo confiável no navegador.

Campos usados pelo app:

- `totalWorkouts`
- `totalTonnageKg` / `totalVolume`
- `totalSets`, `totalReps`, `prsCount`, `distinctExercises`
- `currentWeeklyStreak`, `longestWeeklyStreak`, `weeklyCompleted`, `weeklyGoal`
- `currentDailyStreak`, `longestDailyStreak`
- `achievementStats`
- `achievements`

## Próxima evolução

- Rodar backfill administrativo documentado em `docs/user-stats-backfill.md`.
- Evoluir o rebuild para atualização incremental quando o volume por usuário justificar reduzir leituras server-side.
