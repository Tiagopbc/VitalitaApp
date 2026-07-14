# Observabilidade

O Vitalita usa uma integracao opcional com Sentry para diagnosticar falhas tecnicas sem tornar o servico obrigatorio para desenvolvimento ou uso pessoal.

## Decisao Arquitetural: Sentry Somente em Preview

**Status:** aceita em 14/07/2026.

O Sentry fica habilitado exclusivamente nos deploys de Preview da Vercel. O ambiente Production nao deve possuir `VITE_SENTRY_DSN`.

Motivos:

- manter a producao pessoal sem dependencia operacional externa;
- limitar coleta de telemetria e exposicao acidental de dados;
- validar erros, metadados e sanitizacao em um ambiente controlado;
- preservar o objetivo de estudo e portfolio sem criar custo recorrente.

Consequencias:

- erros de Production nao sao enviados automaticamente ao Sentry;
- erros reproduzidos em Preview possuem stack trace e contexto tecnico sanitizado;
- remover ou deixar vazio o DSN desativa a integracao sem afetar o app;
- ativar o Sentry em Production exige uma nova decisao explicita e revisao deste documento.

## Estado Padrao

- A observabilidade fica desligada quando `VITE_SENTRY_DSN` esta vazio.
- O pacote do Sentry so e carregado em builds publicados que possuem um DSN configurado.
- Tracing fica desligado por padrao para reduzir trafego, custo e impacto no carregamento.
- Nenhuma identidade de usuario e enviada pelo codigo da aplicacao.

## Configuracao

Variaveis opcionais:

```bash
VITE_SENTRY_DSN=
VITE_SENTRY_TRACING=false
VITE_APP_ENV=
VITE_APP_VERSION=
```

Na Vercel, adicione `VITE_SENTRY_DSN` somente em **Project Settings > Environment Variables > Preview**. Nao selecione Production. `VITE_SENTRY_TRACING` deve permanecer `false`.

Na Vercel, o build converte automaticamente `VERCEL_ENV` em `VITE_APP_ENV` e `VERCEL_GIT_COMMIT_SHA` em `VITE_APP_VERSION`. Assim, eventos de Preview recebem `environment=preview` e a versao usa os sete primeiros caracteres do commit publicado. Nao e necessario cadastrar essas duas variaveis manualmente na Vercel.

`VITE_APP_ENV` e `VITE_APP_VERSION` continuam disponiveis como overrides para desenvolvimento local ou outro provedor de deploy. O tracing deve continuar `false` enquanto o objetivo for apenas diagnostico de erros.

No painel do Sentry, ative tambem **Security & Privacy > Prevent Storing of IP Addresses**, mantenha o data scrubber padrao ligado e escolha a menor retencao disponivel para o projeto.

## Dados Tecnicos Coletados

Tags:

- rota normalizada, sem IDs de treino;
- versao da aplicacao;
- execucao como PWA;
- estado online ou offline;
- tipo de dispositivo por largura de viewport.

Eventos instrumentados:

- `react_render_failed`;
- `workout_load_failed`;
- `session_sync_failed`;
- mudanca de rota e conectividade como breadcrumbs tecnicos.

## Privacidade

Antes do envio, a integracao:

- remove `user`, e-mail e IDs informados pelo app;
- remove query strings, hashes, headers, cookies e corpo de requisicoes;
- normaliza rotas com identificadores;
- descarta breadcrumbs de console e cliques;
- aceita somente um conjunto limitado de contexto diagnostico.

Essa protecao reduz exposicao acidental, mas nao substitui a revisao do painel e da politica de retencao do Sentry.

## Validacao

1. Configure o DSN apenas no ambiente Preview.
2. Publique uma branch de teste.
3. Abra rotas principais e alterne entre online e offline.
4. Gere um erro controlado somente em ambiente de teste.
5. Confirme que o evento nao contem usuario, e-mail, token, query string ou ID de treino.
6. Confirme as tags `environment=preview`, `appVersion`, `route`, `deviceType`, `isOffline` e `isPwa`.
7. Resolva ou arquive o erro controlado no Sentry apos a verificacao.

## Checklist Operacional

- `VITE_SENTRY_DSN` existe apenas em Preview.
- `VITE_SENTRY_TRACING=false` em Preview.
- Production permanece sem DSN.
- **Prevent Storing of IP Addresses** esta ativado.
- **Require Data Scrubber** e **Require Using Default Scrubbers** estao ativados.
- Session Replay, Logging e tracing permanecem desativados.

## Proxima Evolucao

- classificar erros `permission-denied` do Firestore;
- instrumentar conflitos de sessao e falhas de criacao de treino;
- definir alertas de baixa frequencia para erros criticos;
- documentar um procedimento curto de triagem e encerramento de incidentes.
