# Architecture Decision Records

Registro das decisões arquiteturais do Vitalità — o *porquê* por trás de
escolhas que, sem isso, só existem como "armadilha" espalhada no CLAUDE.md.

| ADR | Decisão | Status |
|---|---|---|
| [0001](0001-firestore-direto-sem-backend-proprio.md) | Firestore direto do cliente, sem backend próprio | Accepted |
| [0002](0002-web-push-vapid-qstash-sem-fcm.md) | Push de descanso via Web Push/VAPID + QStash, sem FCM | Accepted |
| [0003](0003-user-stats-client-side-por-custo.md) | `user_stats` client-side por padrão, agregação server-side opcional | Accepted |
| [0004](0004-app-check-monitoramento-sem-enforcement.md) | App Check em monitoramento, sem enforcement | Accepted |
| [0005](0005-sem-e2e-por-enquanto.md) | Sem testes E2E por enquanto; Cypress removido | Accepted |

## Quando criar um ADR novo

Ao tomar (ou identificar retroativamente) uma decisão arquitetural com
trade-off real — não uma preferência de estilo, mas algo que outra pessoa
poderia razoavelmente ter feito diferente. Use o skill `engineering:architecture`
e siga o formato dos ADRs existentes (Context → Decision → Options Considered
→ Trade-off Analysis → Consequences → Action Items).
