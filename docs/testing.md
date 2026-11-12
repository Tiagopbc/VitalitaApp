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
- O CI executa lint, knip, Vitest, regras do Firestore, build e coverage em pull requests para `main`.
- `npm run knip` reprova se um arquivo, export ou dependência ficar sem importador. Os pontos de entrada que ele não descobre sozinho — funções da Vercel em `api/`, o service worker de push e a suíte de rules — estão declarados no `knip.json`.
- `tests/security/firestore.rules.test.js` roda contra o Firebase Emulator.
- `npm run test:coverage` reprova abaixo do piso definido em `vitest.config.js` (linhas 53%, statements 51%, funções 49%, branches 47%).
- O CI roda `npm audit --omit=dev --audit-level=critical`. O nível fica em `critical` porque o `@firebase/firestore` fixa um `@grpc/grpc-js` com avisos *high* do lado servidor do gRPC, que o bundle do navegador não usa (ver `CLAUDE.md`).
- Não há teste de ponta a ponta: o Cypress saiu por estar quebrado e fora do CI (ADR-0005).
- Páginas grandes seguem o padrão orquestrador + sub-hooks, e as regras puras de cada uma têm teste próprio ao lado do hook (`src/hooks/<página>/*.test.js`). Ao refatorar, os testes da página passam sem edição; quando a mudança não altera comportamento, um teste de caracterização escrito antes deve passar antes e depois.

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
- Sessão de força e de cardio com o payload real do app são aceitas.
- Sessão com `completedAt` forjado (antedatado, pós-datado ou do relógio do cliente) é negada.
- Campo numérico ou de lista com tipo errado na sessão é negado.
- `notes` da sessão é editável pelo dono; qualquer outro campo, não.
