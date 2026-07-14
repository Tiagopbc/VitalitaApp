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
