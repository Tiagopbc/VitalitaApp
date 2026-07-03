# Backfill de `user_stats`

O backfill gera `user_stats/{userId}` para usuários que já tinham histórico antes
da Cloud Function ser deployada.

O script fica em `functions/scripts/backfillUserStats.js` e usa o mesmo calculator
server-side da Function.

## Segurança Operacional

- O modo padrão é dry-run.
- O script só grava quando `--write` é informado.
- Use `--limit-users` para validar em lote pequeno antes de rodar completo.
- Use `--user <uid>` para testar um usuário específico.
- Nunca commitar credenciais ou service account no repositório.

## Autenticação

Opção recomendada para ambiente local:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/para/service-account.json"
```

A service account precisa de permissão para ler `users`, ler `workout_sessions`
e escrever `user_stats`.

## Dry-Run

```bash
npm --prefix functions run backfill:user-stats -- \
  --project <firebase-project-id> \
  --limit-users 5
```

## Gravar Um Usuário

```bash
npm --prefix functions run backfill:user-stats -- \
  --project <firebase-project-id> \
  --user <uid> \
  --write
```

## Gravar Lote Completo

```bash
npm --prefix functions run backfill:user-stats -- \
  --project <firebase-project-id> \
  --batch-size 50 \
  --max-sessions 2000 \
  --write
```

## Verificações Após Rodar

- Conferir contagem de documentos em `user_stats`.
- Abrir o perfil de um usuário antigo e confirmar totais/conquistas.
- Conferir logs do script para usuários com erro.
- Se `backfillTruncated` aparecer como `true`, revisar o usuário manualmente ou
  aumentar `--max-sessions` em uma nova execução controlada.
