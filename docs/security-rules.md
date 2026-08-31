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
- **O código de 8 caracteres é o próprio ID do documento**, e as rules exigem `code == inviteId` na criação.
- O aluno informa o código no perfil.
- O app resgata o convite com `getDoc(trainer_invites/CODIGO)` — nunca por consulta.
- O aceite cria `trainer_students/{studentId_trainerId}` e atualiza o convite para `expired` com `usedBy` e `usedAt` no mesmo batch.
- As rules bloqueiam criação de vínculo sem convite consumido no mesmo batch.

### Por que `get` e `list` são separados

`allow read` cobre `get` e `list` de uma vez, e isso era um vazamento: o motor de
rules libera um `list` quando **os filtros da consulta**, sozinhos, provam a
condição da regra — ele não checa documento por documento. Com a regra antiga, a
consulta abaixo era liberada para qualquer autenticado, sem filtrar por `code`, e
devolvia todos os convites ativos com `code` e `trainerId`:

```js
query(collection(db, 'trainer_invites'),
      where('status', '==', 'active'),
      where('expiresAt', '>', umInstanteAdianteDoRelogioDoServidor))
```

Os dois filtros provam `resource.data.status == 'active' && resource.data.expiresAt
> request.time`, então a regra vale para qualquer resultado possível. De posse dos
códigos, um autenticado qualquer queimava o convite de outro aluno (o aceite grava
`status: 'expired'` e `usedBy`) e criava vínculo espúrio com o personal.

Hoje as duas operações são separadas:

- `allow get`: dono, ou convite ativo e não expirado, ou quem já usou. Resgatar exige
  **conhecer o código**, que é o ID — 32⁸ ≈ 1,1 × 10¹² combinações.
- `allow list`: só `resource.data.trainerId == request.auth.uid`. Toda consulta à
  coleção precisa filtrar por `trainerId`, o que cobre `getActiveTrainerInvite`,
  `createTrainerInvite` e a exportação LGPD.

Cenário de regressão: `bloqueia enumeracao de convites ativos por quem nao e o dono`
em `tests/security/firestore.rules.test.js`. Ele usa um limite de `expiresAt`
deliberadamente à frente do relógio do servidor — com `Timestamp.now()` do cliente o
`list` pode ser negado por acaso e o teste passa sem provar nada.

### Convites criados antes da mudança

Convites antigos têm ID automático e não podem mais ser resgatados. Não há migração:
o TTL é de 7 dias e cada personal tem no máximo um convite ativo. `getActiveTrainerInvite`
ignora convite cujo `code` não bate com o ID do documento, então `ensureActiveTrainerInvite`
emite um substituto e revoga o antigo na primeira vez que o personal abre o painel.

## Checklist ao Alterar Rules

- Verificar se o front-end ainda escreve os campos permitidos.
- Atualizar `docs/firestore-model.md` quando coleções/campos mudarem.
- Atualizar `firestore.indexes.json` quando uma query nova exigir índice composto.
- Adicionar ou atualizar teste em `tests/security/firestore.rules.test.js`.
