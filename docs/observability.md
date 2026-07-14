# Observabilidade

O Vitalita usa uma integracao opcional com Sentry para diagnosticar falhas tecnicas sem tornar o servico obrigatorio para desenvolvimento ou uso pessoal.

## Estado Padrao

- A observabilidade fica desligada quando `VITE_SENTRY_DSN` esta vazio.
- O pacote do Sentry so e carregado quando o app de producao possui um DSN configurado.
- Tracing fica desligado por padrao para reduzir trafego, custo e impacto no carregamento.
- Nenhuma identidade de usuario e enviada pelo codigo da aplicacao.

## Configuracao

Variaveis opcionais:

```bash
VITE_SENTRY_DSN=
VITE_SENTRY_TRACING=false
VITE_APP_VERSION=
```

Na Vercel, adicione essas variaveis em **Project Settings > Environment Variables**. Para o primeiro teste, configure apenas o DSN em Preview. Depois de validar os eventos, replique em Production.

`VITE_APP_VERSION` pode receber uma versao curta ou o hash do commit publicado. O tracing deve continuar `false` enquanto o objetivo for apenas diagnostico de erros.

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
6. Ative em Production somente depois dessa verificacao.

## Proxima Evolucao

- classificar erros `permission-denied` do Firestore;
- instrumentar conflitos de sessao e falhas de criacao de treino;
- definir alertas de baixa frequencia para erros criticos;
- documentar um procedimento curto de triagem e encerramento de incidentes.
