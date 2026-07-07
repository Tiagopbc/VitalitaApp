# Vitalità: Case de Portfolio

## Resumo

O Vitalità é um PWA de acompanhamento de treinos criado como projeto de estudo e
portfolio. O foco foi construir uma aplicacao usavel de ponta a ponta, com uma
base tecnica que demonstra preocupacao real com arquitetura, seguranca,
performance e evolucao de produto.

## Problema

Apps de treino muitas vezes caem em dois extremos:

- simples demais, funcionando como bloco de notas sem gerar dados uteis;
- inchados demais, com excesso de recursos que desviam o foco do treino.

O objetivo do Vitalità é oferecer uma experiencia direta para registrar treinos,
acompanhar consistencia e visualizar evolucao, mantendo o fluxo rapido durante a
execucao.

## Solucao

O app combina:

- execucao de treino mobile-first;
- historico paginado;
- dashboard de progresso;
- sistema de conquistas;
- modo aluno e personal trainer;
- PWA instalavel;
- Firebase Auth e Firestore;
- regras de seguranca testadas.

## Screenshots

As capturas abaixo foram geradas a partir da demo publicada em producao. O fluxo de cadastro usa dados ficticios e foi interrompido antes da criacao de conta, para evitar escrita desnecessaria em producao.

| Login | Cadastro | Dados pessoais |
| --- | --- | --- |
| ![Tela de login do Vitalità](assets/screenshots/vitalita-login.png) | ![Tela de cadastro do Vitalità](assets/screenshots/vitalita-signup-account.png) | ![Tela de dados pessoais do cadastro do Vitalità](assets/screenshots/vitalita-signup-profile.png) |

## Destaques Tecnicos

### Segurança

- Firestore rules versionadas.
- Testes automatizados com Firebase Emulator.
- Modelo aluno-personal com vinculos ativos.
- Escrita bloqueada em colecoes sensiveis como `user_stats`.

### Performance

- Historico com paginacao.
- Dashboards baseados em janelas recentes.
- Evita leituras completas indefinidas no cliente.
- Estrutura de agregados server-side planejada para uma fase futura.

### Operacao Sem Custo

O projeto foi mantido no Firebase Spark para nao gerar custos enquanto estiver
em uso pessoal. Recursos que exigiriam Blaze, como Cloud Functions, foram
implementados/documentados como camada opcional e protegidos por feature flag.

### Qualidade

- CI com lint, testes, build, coverage e rules tests.
- Documentacao tecnica em `docs/`.
- PRs separados por etapa de evolucao.
- Checklist de seguranca e impacto em Firestore.

## Trade-offs

### Por que manter Spark?

Como o app é usado como estudo pessoal, nao faz sentido assumir custo recorrente
para uma funcionalidade server-side que ainda nao é necessaria em producao.

### Por que documentar Functions mesmo sem deploy?

Porque mostra o desenho profissional de evolucao: quando houver necessidade real
de escala, o caminho para agregados e backfill ja esta planejado e testavel.

### Por que usar fallback no cliente?

O fallback permite manter a experiencia funcionando sem depender de infraestrutura
paga. Ao mesmo tempo, o codigo esta pronto para preferir `user_stats` se a feature
flag for ativada no futuro.

## Resultado

O Vitalità evoluiu de um MVP funcional para um projeto com caracteristicas de
produto profissional:

- regras de acesso mais maduras;
- testes automatizados;
- melhor controle de leituras;
- CI mais completo;
- documentacao tecnica;
- estrategia clara de custo zero;
- roadmap realista para evoluir sem reescrever a base.

## Proximas Melhorias

- Criar conta demo anonima para capturar telas internas com dados ficticios.
- Melhorar acabamento visual das telas mais usadas.
- Criar uma demo guiada para LinkedIn.
- Adicionar observabilidade leve.
- Revisar App Check em modo monitoramento.
