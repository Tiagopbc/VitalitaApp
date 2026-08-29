# Validação em aparelho do push de descanso (iOS)

Três dos quatro defeitos corrigidos no [PR #75](https://github.com/Tiagopbc/VitalitaApp/pull/75)
só se manifestam num iPhone: o `AudioContext` suspenso pelo iOS, o push chegando
com a tela bloqueada e o agendamento falhando sem rede. O PR foi mesclado com
isso explicitamente **não validado**, e o aviso vivia só no corpo do PR — onde
some. Este documento existe para o registro não depender mais disso, e para a
próxima validação ter método em vez de memória.

## O que foi validado

**28/08/2026**, no deployment `dpl_GyZWUuNL4xYfcwtjJj5SfFkwGqoc` (commit
`47b54a0`), com o app instalado na tela de início e notificações concedidas.

| Comportamento | Resultado | Evidência |
| --- | --- | --- |
| Banner âmbar quando o agendamento falha | ✅ | Banner na tela às 15:12 **sem nenhuma requisição** tendo chegado ao `/api/schedule-rest-push` |
| Bipe de fim de descanso após segundo plano | ✅ | Confirmado a ouvido, depois de sair e voltar do app |
| Push entregue com a tela bloqueada | ✅ | `send` às 15:45:05 **sem `cancel` posterior** (ver assinatura abaixo) |

O quarto — o `PwaReinstallNotice` — não é validável sob demanda por desenho: a
detecção só vale da *próxima* mudança de tag de janela em diante. Ver
`src/utils/windowConfig.js`.

## Como reproduzir

Pré-condições que, se ignoradas, produzem falso negativo silencioso:

- **App instalado pela tela de início.** Fora disso o aviso `ios-install` tem
  precedência no código (`applyPushHint` nunca o sobrescreve) e você vê a
  mensagem errada, não a que está testando.
- **Permissão de notificação concedida.** Sem ela o motivo vira `permission` e o
  texto do banner é outro.
- **Descanso de no mínimo 5 s** (`MIN_PUSH_DELAY_SECONDS`). Abaixo disso o
  agendamento nem é tentado — é o motivo `below-min-delay`, esperado e mudo.

### 1. Banner âmbar de falha

Ligue o **Modo Avião** — só desligar o Wi-Fi não serve, a requisição sai pelo
celular e o agendamento dá certo. Ligue **antes** de iniciar o descanso: o
agendamento acontece ao iniciar, retomar ou ajustar, nunca ao ir para segundo
plano. Esperado: faixa âmbar com "Não foi possível agendar o aviso em segundo
plano". Desligar o Modo Avião e ajustar a duração deve **limpar** o banner —
vale testar, é a metade da recuperação.

### 2. Bipe após segundo plano

**Chavinha de silencioso desligada** — o WebAudio no iOS obedece ao interruptor
físico, e esse é o falso negativo mais comum aqui. Inicie um descanso, mande o
app para segundo plano (sem bloquear a tela), volte, e deixe terminar com o app
à vista. Esperado: vibração **e** três bipes ascendentes. O defeito antigo dava
vibração sem som, e a partir da primeira ida a segundo plano o som ficava mudo
pelo resto da sessão.

### 3. Push com a tela bloqueada

Rede ligada. Descanso de **≥ 30 s**, app à vista acompanhando o contador, e
bloqueie a tela faltando **uns 3 segundos**. Essa janela é a que importa: o
código antigo cancelava o push aos 5 s restantes e o `setInterval` congelava logo
depois, então não sobrava nem push nem alerta local. Fique com a tela bloqueada
por mais uns 30 s depois da notificação chegar — é isso que produz a assinatura
verificável abaixo.

## Como confirmar por fora: a assinatura nos logs da Vercel

O relato de quem testou não distingue "push chegou com a tela bloqueada" de
"push chegou com o app aberto". Os logs de runtime da Vercel distinguem, e de
graça — o formato do ciclo já diz em que estado o aparelho estava.

Consulte os logs de runtime do projeto `vitalitaapp` escopados ao deployment em
produção. **Os horários são UTC; o local é UTC-3.**

Ao concluir um descanso com o app acordado, o timer chama
`cancelScheduledPush()` sobre uma mensagem **já entregue** — cancelamento inócuo,
silencioso por design, mas que aparece no log. É daí que sai a leitura:

| Formato do ciclo | O que aconteceu |
| --- | --- |
| `send` → `cancel` 1-2 s depois | App **acordado** no fim do descanso. Não prova nada sobre tela bloqueada. |
| `send` **sem `cancel` atrás** | JS congelado ou inalcançável na entrega — **compatível com a tela bloqueada**, mas ver a ressalva abaixo. |
| `cancel` 1 s **antes** do `send` | Cancelamento perdeu a corrida para o QStash, que já havia despachado. |
| `schedule` → `cancel`, sem `send` | Descanso fechado, pausado ou ajustado antes do fim. |

**Ressalva: a ausência de `cancel` prova menos do que parece.** Ela prova que o
JS não rodou *ou* não alcançou o servidor — e tela bloqueada é só uma das
causas. App encerrado, app em segundo plano e falha de rede produzem a mesma
assinatura, porque `cancelRestPush` é melhor esforço e engole erro de `fetch`
por desenho (`src/services/restPushService.js`). Ou seja: o log **corrobora** a
observação feita no aparelho, não a substitui. Uma validação futura apoiada só
nos logs pode dar por confirmado um comportamento que ninguém viu acontecer.

O ciclo validado em 28/08/2026 foi `schedule` 15:44:27 → `send` 15:45:05, e o
evento seguinte só veio 5 min 37 s depois, um `schedule` novo. Nenhum
cancelamento no meio.

Repare que a alternativa óbvia fica descartada pelo próprio formato: se o timer
tivesse sido fechado antes do fim, o cancelamento teria saído **antes** do
`send`, como na quarta linha da tabela. Não saiu — logo o descanso estava
correndo e o aparelho, suspenso.

## Limite honesto

Os logs provam que a notificação foi despachada e que o JS do app estava
congelado naquele instante. Eles **não** provam que ela apareceu visualmente na
tela bloqueada — essa metade continua sendo observação humana. O que o método
elimina é a parte que a memória erra: em que estado o aparelho estava.
