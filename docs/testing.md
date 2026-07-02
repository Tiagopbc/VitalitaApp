# Testes e Validação

## Comandos Locais

```bash
npm run lint
npm test -- --run
npm run test:rules
npm run build
```

## Estado Atual

- Vitest cobre serviços, páginas principais, contexto de treino e utilitários.
- Cypress possui um fluxo feliz em `cypress/e2e`.
- O CI executa lint, Vitest, build e coverage em pull requests para `main`.
- `tests/security/firestore.rules.test.js` roda contra o Firebase Emulator.

## Próxima Evolução

Expandir a cobertura do Firebase Emulator Suite conforme novas coleções entrarem.

Cenários prioritários:

- Usuário lê e escreve o próprio perfil.
- Personal lê perfil de aluno vinculado.
- Personal não lê aluno não vinculado.
- Aluno cria treino para si mesmo.
- Personal cria treino para aluno vinculado.
- Personal não cria treino para aluno não vinculado.
- Personal lê histórico de aluno vinculado.
- Personal não altera nem deleta histórico do aluno.
- Usuário não falsifica `createdBy`.
- Usuário não cria vínculo `trainer_students` em nome de outro aluno.
- Aluno só cria vínculo se consumir convite ativo no mesmo batch.
- Convites expirados ou revogados não podem ser usados.
