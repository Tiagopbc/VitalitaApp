# Firebase App Check

O Vitalita integra o Firebase App Check como uma camada opcional de validacao do cliente web. A primeira fase serve apenas para emitir tokens e observar metricas. Nenhum produto Firebase deve ter enforcement ativado nesta etapa.

## Decisao Arquitetural: Monitoramento Sem Enforcement

**Status:** aceita em 14/07/2026.

O App Check e inicializado com reCAPTCHA Enterprise para classificar o trafego, mas Firestore e demais APIs continuam aceitando requisicoes sem token valido. O objetivo atual e conhecer o comportamento dos clientes legitimos antes de considerar qualquer bloqueio.

Esta decisao e independente do Sentry: o App Check pode ser monitorado no app publicado, enquanto o Sentry permanece restrito a Preview.

## Estado Padrao

- Sem `VITE_FIREBASE_APP_CHECK_SITE_KEY`, o SDK nao e inicializado.
- Uma falha ao iniciar App Check nao bloqueia login, Firestore ou renderizacao do app.
- O provider de debug fica desligado por padrao e nunca e habilitado em build de producao.
- Authentication, Firestore Rules e as demais protecoes continuam sendo obrigatorias; App Check nao substitui autorizacao.
- Nenhuma API Firebase deve ter enforcement ativado nesta fase.

## Configuracao Monitorada

1. No Firebase Console, abra **Security > App Check**.
2. Registre o app web do Vitalita com reCAPTCHA Enterprise.
3. Mantenha Firestore, Storage e demais APIs suportadas sem enforcement.
4. Copie somente a site key publica criada para o app.
5. Na Vercel, configure:

```bash
VITE_FIREBASE_APP_CHECK_SITE_KEY=site_key_publica
VITE_FIREBASE_APP_CHECK_DEBUG=false
```

6. Publique a versao e use o app normalmente.
7. Consulte **Security > App Check > APIs** para comparar requisicoes verificadas, desatualizadas, de origem desconhecida e invalidas.

A site key e publica por natureza. Credenciais privadas, tokens de debug e chaves de conta de servico nunca devem ser salvos em variaveis `VITE_*`.

## Protecao de Custo

O projeto deve permanecer sem conta de faturamento vinculada para esta fase. O reCAPTCHA Enterprise oferece uma cota sem custo de 10.000 assessments por mes. O App Check normalmente renova tokens aproximadamente duas vezes por hora por cliente ativo, portanto o uso pessoal esperado fica muito abaixo dessa cota.

Sem faturamento habilitado, exceder a cota nao gera cobranca automatica: novas verificacoes podem falhar ate a renovacao da cota. Como o enforcement permanece desligado, isso nao deve bloquear o acesso ao Firebase nesta fase.

Guardrails:

- nao vincular Cloud Billing apenas para ativar App Check;
- manter o TTL padrao de uma hora;
- revisar mensalmente o volume no console do reCAPTCHA Enterprise;
- se o volume se aproximar da cota, remover temporariamente `VITE_FIREBASE_APP_CHECK_SITE_KEY` e publicar novamente;
- nao ativar enforcement para tentar reduzir consumo.

## Leitura das Metricas

As categorias principais no Firebase Console sao:

- **Verified requests:** token valido emitido para o app registrado;
- **Outdated client:** versao antiga do app ainda sem App Check;
- **Unknown origin:** origem nao registrada ou inesperada;
- **Invalid requests:** token invalido ou que nao pode ser verificado;
- **Reused token:** token reaproveitado de forma suspeita.

Durante o monitoramento, essas categorias servem para diagnostico. Elas nao devem disparar bloqueio automatico.

## Diagnostico: Verificadas Presas em 0%

De 21/07 a 07/08/2026 o Cloud Firestore ficou em 0% verificadas e 100% sem verificacao. O numero
parado parece "ainda ha pouco trafego", mas nesse caso era falha: o App Check nunca emitiu um token.

O sinal esta no console do navegador em producao:

```
@firebase/app-check: AppCheck: 403 error.
Attempts allowed again after 01d:00m:00s (appCheck/initial-throttle)
```

A causa foi um par de chaves reCAPTCHA Enterprise no mesmo projeto: o bundle usava `vitalita-appcheck`
enquanto o registro em **App Check > Apps** apontava para `vitalita-web-app-check`, orfa de uma
tentativa anterior. O Firebase recebia um atestado assinado pela chave errada e respondia
`App attestation failed`. A correcao foi alinhar o registro com a chave do bundle, sem redeploy.

### Painel no proprio app

Abrir a URL com `?debug=appcheck` liga um painel fixo no rodape com o estado do token. Ele existe
porque o Sentry fica desligado em Production por decisao (ver `observability.md`) e o PWA instalado
no iPhone nao tem console acessivel. A flag persiste em `localStorage`, entao sobrevive a navegacao
e ao app aberto pela tela de inicio; `?debug=off` desliga (e vale tambem para o painel de push, que
abre com `?debug=push`).

Estados possiveis:

| Estado | Significado |
| --- | --- |
| `ativo` | Token emitido com sucesso na ultima verificacao. |
| `falhando (<codigo>)` | O SDK inicializou mas nao conseguiu o token. E o caso do incidente. |
| `desligado (sem site key)` | Variavel de ambiente ausente ou build de desenvolvimento. Nao e quebra. |

O painel tambem lista o historico de falhas. Sucesso repetido nao entra na lista de proposito: com
20 posicoes, registrar todo boot bem-sucedido empurraria para fora justamente a falha que se quer
enxergar.

### Ordem de investigacao

Quando o percentual nao sai do zero:

1. Confirme que o SDK inicializa: `typeof window.grecaptcha` deve ser `"object"` e
   `document.querySelector('.grecaptcha-badge')` deve existir. Se nao, o problema e a variavel de
   ambiente ou o redeploy, nao o registro.
2. Compare a site key do bundle com a registrada em **App Check > Apps** (clique na linha do app).
   Divergencia entre as duas e a causa mais provavel do `App attestation failed`.
3. Confirme que a chave existe no projeto em **Google Cloud > Seguranca > reCAPTCHA Enterprise**. O
   ID da chave e a propria site key.
4. Se a resposta do 403 disser que as requisicoes para a API estao bloqueadas, o problema e a lista
   de APIs permitidas da Browser key, nao o App Check.

O procedimento de troca manual de token, que diagnostica isso em segundos sem esperar o throttle de
24 horas, esta na secao 7.3 do `MANUAL_TECNICO.md`.

Ao validar a correcao, lembre que o throttle de 24 horas e por navegador: use janela anonima ou
apague o IndexedDB `firebase-app-check-database`. Sucesso nao gera log, entao a ausencia de erro novo
no console e o sinal de que funcionou.

## Desenvolvimento Local

O provider de debug deve ser usado somente quando for necessario testar App Check localmente:

```bash
VITE_FIREBASE_APP_CHECK_SITE_KEY=site_key_publica
VITE_FIREBASE_APP_CHECK_DEBUG=true
```

Ao abrir o app local, o Firebase imprime um token de debug no console do navegador. Cadastre esse token em **Security > App Check > Apps > Manage debug tokens**.

O token de debug deve permanecer privado. Nao o adicione ao `.env.example`, GitHub, Vercel ou documentacao. Depois do teste, remova o token no Firebase Console e volte `VITE_FIREBASE_APP_CHECK_DEBUG` para `false`.

## Criterio Para Enforcement Futuro

Enforcement continua fora do escopo atual. Ele so deve ser avaliado quando:

- a versao com App Check estiver publicada e estavel;
- as metricas mostrarem que praticamente todo o trafego legitimo esta verificado;
- login, sincronizacao offline e conclusao de treino tiverem sido testados no PWA;
- houver procedimento de rollback documentado;
- o uso do provider permanecer dentro da cota sem custo definida para o projeto.

A avaliacao futura nao significa autorizacao para ativar enforcement. A mudanca exige decisao separada, teste em Preview, plano de rollback e aprovacao explicita.

Ativar enforcement antes disso pode bloquear versoes antigas, navegadores legitimos ou o proprio fluxo de treino.

## Rollback

1. Confirme que nenhum produto Firebase esta com enforcement ativo.
2. Remova `VITE_FIREBASE_APP_CHECK_SITE_KEY` da Vercel.
3. Publique novamente.

Sem a variavel, o app volta ao comportamento anterior sem depender do SDK de App Check.
