# Rascunho Para LinkedIn

## Versao Curta

Estou evoluindo o Vitalità, um PWA de acompanhamento de treinos que comecei como
projeto de estudo e transformei em um case tecnico de engenharia de software.

O foco nao foi apenas criar uma interface bonita. Trabalhei em pontos que fazem
um produto parecer mais profissional por dentro:

- regras de seguranca no Firestore;
- testes automatizados das rules com Firebase Emulator;
- CI com lint, testes, build e coverage;
- historico paginado para reduzir leituras;
- estrategia de custo zero no Firebase Spark;
- arquitetura documentada para uma futura camada server-side com Cloud Functions;
- fluxo aluno-personal com permissoes mais claras.

Como o projeto ainda é pessoal, decidi manter tudo no plano gratuito e documentar
as partes que exigiriam infraestrutura paga como evolucao futura. Esse trade-off
tambem faz parte da engenharia: escolher a solucao certa para o contexto atual.

Repositorio: https://github.com/Tiagopbc/VitalitaApp
Demo: https://vitalita.vercel.app

## Versao Mais Narrativa

Tenho usado o Vitalità como meu laboratorio pessoal para praticar engenharia de
software aplicada a um produto real.

Ele nasceu como um app de treinos, mas aos poucos virou um projeto onde consigo
explorar decisoes que aparecem em produtos de verdade: seguranca, performance,
privacidade, testes, CI, custo operacional e evolucao de arquitetura.

Nas ultimas iteracoes, trabalhei em:

- hardening das regras do Firestore;
- testes automatizados das permissoes;
- paginacao de historico para evitar leituras grandes;
- documentacao tecnica em `docs/`;
- estrategia de `user_stats` server-side planejada, mas desativada por padrao para manter custo zero no Firebase Spark;
- scripts e backfill opcionais para uma futura fase com Cloud Functions.

O ponto mais interessante foi justamente o trade-off: eu poderia ativar Blaze e
deployar Functions, mas como o app ainda é pessoal e de estudo, preferi manter o
projeto sem custo e deixar o caminho profissional documentado e testado para o
futuro.

Esse tipo de decisao me interessa bastante: construir com ambicao tecnica, mas
sem perder o senso de contexto.

Repositorio: https://github.com/Tiagopbc/VitalitaApp
Demo: https://vitalita.vercel.app
