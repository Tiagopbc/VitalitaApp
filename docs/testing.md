# Testes e Validação

## Comandos Locais

```bash
npm run lint
npm run knip
npm test -- --run
npm run test:rules
npm run build
```

## Estado Atual

- Vitest cobre serviços, páginas principais, contexto de treino e utilitários.
- O CI executa lint, knip, Vitest, testes das Functions, regras do Firestore, build e coverage em pull requests para `main`.
- `npm run knip` reprova se um arquivo, export ou dependência ficar sem importador. Os pontos de entrada que ele não descobre sozinho — funções da Vercel em `api/`, o service worker de push, a suíte de rules e as Cloud Functions — estão declarados no `knip.json`.
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
- Convite exige `code` igual ao ID do documento na criação.
- Só o personal dono lista `trainer_invites`; terceiro autenticado não enumera convites ativos.
