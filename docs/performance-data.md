# Performance e dados

Este documento registra as decisões atuais para reduzir leituras grandes no Firestore sem mudar o modelo de produto.

## Leituras de sessões

- `getHistory(userId, templateName, lastDoc, pageSize)` é a API principal para histórico paginado.
- `getRecentSessions(userId, limitCount)` deve ser usada em telas de resumo e estatísticas recentes.
- `subscribeToRecentSessions(userId, callback, limitCount)` deve ser usada em dashboards que precisam de atualização em tempo real.
- `getAllSessions(userId)` continua existindo apenas como compatibilidade para fluxos que ainda dependem de histórico completo.

## Limites atuais

Os limites ficam centralizados em `SESSION_LIMITS` no `workoutService`:

- `dashboardRecent`: 60 sessões recentes.
- `analyticsGlobalPage`: 120 sessões por página na busca global de evolução.
- `profileStats`: 300 sessões recentes para perfil/conquistas.
- `achievementCheck`: 300 sessões recentes para avaliação pós-treino.

## Comportamento por tela

- HomeDashboard: assina somente as sessões recentes, em vez de observar todo o histórico.
- HistoryPage/Diário: usa paginação com `getHistory`.
- HistoryPage/Evolução global: carrega uma página recente e permite carregar mais histórico sob demanda.
- ProfilePage: calcula estatísticas e conquistas a partir da janela recente (`profileStats`).

## Agregados `user_stats` (removidos)

A coleção e a Cloud Function que a escrevia saíram em 11/2026 (ADR-0006). Totais
vitalícios, streaks e conquistas são calculados no cliente sobre a janela recente;
o custo é proporcional aos limites acima, não ao histórico inteiro.

## Próxima evolução

- Se o volume por usuário crescer além dos limites acima, reavaliar um agregado
  incremental — com ADR novo.
