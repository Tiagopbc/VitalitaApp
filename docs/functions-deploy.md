# Deploy de Functions

Este documento descreve o rollout controlado da Function que atualiza
`user_stats/{userId}`.

## Pré-requisitos

- Confirmar o Firebase project id de produção.
- Garantir uma conta com permissões para deploy de Cloud Functions, Firestore e leitura de logs.
- Autenticar o Firebase CLI local ou usar uma service account adequada.
- Rodar validação local antes do deploy.

Como o repositório não versiona `.firebaserc`, use sempre `--project` no deploy
até definirmos o alvo padrão.

## Validação Pré-Deploy

```bash
npm ci
npm ci --prefix functions
npm run lint
npm --prefix functions test
npm run test:rules
npm run build
```

## Deploy Inicial

Use o Firebase CLI local do projeto:

```bash
./node_modules/.bin/firebase deploy \
  --only functions:rebuildUserStatsOnSessionCreated \
  --project <firebase-project-id>
```

Se o CLI reclamar da checagem de atualização local, rode com:

```bash
FIREBASE_CLI_DISABLE_UPDATE_CHECK=1 ./node_modules/.bin/firebase deploy \
  --only functions:rebuildUserStatsOnSessionCreated \
  --project <firebase-project-id>
```

## Monitoramento Pós-Deploy

Após o deploy:

1. Finalizar uma sessão de treino com usuário de teste.
2. Verificar se `user_stats/{userId}` foi criado/atualizado.
3. Conferir logs:

```bash
./node_modules/.bin/firebase functions:log \
  --only rebuildUserStatsOnSessionCreated \
  --project <firebase-project-id>
```

4. Validar Home/Profile no app com esse usuário.

## Rollback

Se houver falha, remover a Function ou voltar o deploy anterior pelo Console/Firebase CLI.
O app continua funcionando com fallback para sessões recentes enquanto `user_stats`
não estiver disponível.
