
# Manual Técnico - Vitalità (v3)

Este documento serve como um guia técnico para o desenvolvimento, manutenção e compreensão da arquitetura do projeto **Vitalità**, uma aplicação web progressiva (PWA) focada em gestão de treinos e acompanhamento de alunos.

## 1. Visão Geral do Projeto

O **Vitalità** é uma aplicação Single Page Application (SPA) construída com **React** e **Vite**, utilizando **Firebase** como backend (Authentication, Firestore). O projeto foca em alta performance e experiência do usuário (UX), com animações fluidas, design responsivo (Mobile First) e funcionalidades de persistência de estado para evitar perda de dados durante treinos.

### Principais Funcionalidades
- **Gestão de Treinos:** Criação, edição e execução de rotinas de treino.
- **Modo Execução:** Interface focada durante o treino, com cronômetro, registro de cargas e feedback visual.
- **Histórico e Evolução:** Acompanhamento detalhado de sessões passadas e progresso de carga.
- **Modo Treinador:** Dashboard para personal trainers gerenciarem múltiplos alunos, verem histórico e atribuírem treinos.
- **Gamificação:** Sistema de "Streak" e metas semanais.

## 2. Tecnologias e Stack

### Core
- **[React 19](https://react.dev/):** Biblioteca principal para construção de interfaces.
- **[Vite](https://vitejs.dev/):** Build tool e servidor de desenvolvimento ultrarrápido.
- **[Firebase](https://firebase.google.com/):**
    - **Authentication:** Gerenciamento de usuários.
    - **Firestore:** Banco de dados NoSQL em tempo real.

### Estilização e UI
- **[Tailwind CSS v4](https://tailwindcss.com/):** Framework de utilitários CSS para estilização rápida e consistente.
- **[Framer Motion](https://www.framer.com/motion/):** Biblioteca para animações complexas e transições de layout.
- **[Lucide React](https://lucide.dev/):** Coleção de ícones vetoriais leves.
- **[Sonner](https://sonner.emilkowal.ski/):** Componente de notificações (Toast) elegante e performático.

### Gerenciamento de Estado e Dados
- **Context API (React):** Gerenciamento de estado global para Autenticação (`AuthContext`) e Sessão de Treino (`WorkoutContext`).
- **Hooks Customizados:** Encapsulamento de lógica reutilizável (ex: `useWorkout`).

### Testes
- **[Vitest](https://vitest.dev/):** Framework de testes unitários e de integração (compatível com Jest).
- **React Testing Library:** Utilitários para testar componentes React.

## 3. Estrutura de Diretórios (`src/`)

A estrutura do projeto segue um padrão modular e organizado:

```
src/
├── components/         # Componentes reutilizáveis de UI (Botões, Cards, Modais)
│   ├── execution/      # Componentes específicos da tela de execução de treino
│   └── ...
├── context/            # Contextos do React (Estado Global)
│   ├── AuthContext.jsx     # Gerencia usuário logado e status de autenticação
│   └── WorkoutContext.jsx  # Gerencia sessão ativa, timer e persistência
├── data/               # Dados estáticos e constantes
├── hooks/              # Custom Hooks (Lógica reutilizável)
├── pages/              # Componentes de Página (Rotas do React Router)
│   ├── HomeDashboard.jsx       # Tela inicial
│   ├── WorkoutExecutionPage.jsx # Tela de execução de treino
│   ├── TrainerDashboard.jsx    # Área do treinador
│   └── ...
├── services/           # Camada de comunicação com APIs/Firebase
│   ├── userService.js      # Operações relacionadas a usuários
│   └── workoutService.js   # Lógica complexa de busca e cache de treinos
├── utils/              # Funções utilitárias puras (Formatadores, Cifras)
├── App.jsx             # Componente Raiz, Roteamento e Layout Base
├── main.jsx            # Ponto de entrada da aplicação React
└── firebaseConfig.js   # Inicialização e configuração do Firebase
```

## 4. Arquitetura e Fluxos Chave

### 4.1. Autenticação (`AuthContext`)
O `AuthContext` monitora o estado do usuário via `onAuthStateChanged` do Firebase. Ele fornece o objeto `user` para toda a aplicação e protege rotas privadas (`ProtectedRoute`).

### 4.2. Execução de Treino (`WorkoutContext` & `useWorkout`)
Este é o núcleo do app. O fluxo de treino é robusto contra falhas (ex: recarregar a página).
- **Persistência:** O ID do treino ativo é salvo no `localStorage` e no Firestore (`active_workouts`).
- **Sincronização:** O `WorkoutContext` monitora mudanças no Firestore para detectar se um treino foi iniciado em outro dispositivo ou se é uma "sessão fantasma" (ghost session), limpando o estado se necessário.
- **Estado Local:** Durante a execução, as mudanças (pesos, reps) são gerenciadas localmente no componente para performance instantânea, e salvas ao finalizar.

### 4.3. Serviço de Treinos (`workoutService.js`)
Centraliza a lógica de negócios para treinos. Implementa padrões como:
- **Cache em Memória:** Armazena templates por 5 minutos para evitar leituras desnecessárias no Firestore.
- **Client-Side Sorting:** Ordena treinos alfabeticamente no cliente.
- **Paginação:** Suporta carga incremental do histórico.

### 4.4. Otimização de Performance
- **Lazy Loading:** Páginas "pesadas" como `HistoryPage`, `MethodsPage` e `TrainerDashboard` são carregadas sob demanda usando `React.lazy` e `Suspense`.
- **Renderização Condicional:** O layout principal (Sidebar/BottomNav) se adapta dinamicamente (Mobile/Desktop) e se esconde em telas de "Foco" (como Execução e Login).

## 5. Setup e Comandos

Para rodar o projeto localmente:

1.  **Instalar dependências:**
    ```bash
    npm install
    ```

2.  **Rodar servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O servidor iniciará em `http://localhost:5175` (porta fixada em `vite.config.js`).

3.  **Build para Produção:**
    ```bash
    npm run build
    ```
    Gera os arquivos estáticos na pasta `dist/`.

4.  **Rodar Testes:**
    ```bash
    npm run test
    ```
    Executa a suíte de testes com Vitest.

## 6. Padronização de Código e Linting

O projeto utiliza **ESLint** para garantir a qualidade do código. Configurações importantes incluem regras para:
- Hooks do React (regras de dependência).
- Prevenção de variáveis não utilizadas.
- Padrões de importação modernos (ES Modules).

Recomenda-se rodar `npm run lint` antes de commits importantes.

## 7. Segurança das Credenciais

### 7.1. A API key do Firebase é pública

A `VITE_FIREBASE_API_KEY` é embutida no bundle JavaScript em tempo de build e vai para o navegador
de todo usuário — isso é inerente a qualquer app Firebase web, não um descuido. Ela identifica o
projeto; **não autoriza acesso a nada**. Quem controla acesso são as regras do Firestore
(`firestore.rules`), as restrições da chave e o App Check.

Consequência prática: **rotacionar essa chave não aumenta a segurança**, porque a chave nova seria
igualmente pública. O alerta de secret scanning nº 1 deste repositório foi fechado como *won't fix*
por esse motivo, em 21/07/2026, após aplicar as restrições descritas abaixo. Se um alerta
equivalente reaparecer, a resposta é conferir as restrições — não gerar uma chave nova.

O que **de fato** precisa ficar fora do repositório são os segredos de servidor: a chave privada
VAPID e o token do QStash, ambos definidos apenas nas variáveis de ambiente da Vercel.

### 7.2. Restrições da Browser key

A única API key do projeto (`Browser key (auto created by Firebase)`, projeto Google Cloud
`app-treino-17bbf`) está restrita a estes referrers HTTP:

| Referrer | Motivo |
| --- | --- |
| `https://vitalita.vercel.app/*` | produção |
| `https://app-treino-17bbf.firebaseapp.com/*` | **obrigatório** — `signInWithPopup` abre o popup do Google neste domínio |
| `http://localhost:5175/*` | `npm run dev` |
| `http://localhost:4173/*` | `npm run preview` |

E limitada a 6 APIs: Cloud Firestore, Identity Toolkit, Token Service, Firebase Installations,
Firebase App Check e reCAPTCHA Enterprise.

O app **não usa** Storage, Analytics, Remote Config, Functions callable nem Firebase Cloud
Messaging — o push de fim de descanso é Web Push nativo com VAPID própria via QStash
(`src/services/restPushService.js`), sem FCM.

> **Deploys de preview da Vercel não conseguem autenticar nem ler o Firestore**, porque o console
> do Google não aceita curinga parcial de subdomínio (`vitalita-*.vercel.app`). Antes de concluir
> que um PR quebrou o app em preview, verifique se não é isso. Para reativá-los, bastaria adicionar
> `https://*.vercel.app/*` — ao custo de liberar qualquer site hospedado em `.vercel.app`.

Curingas em porta (`http://localhost:*/*`) também são rejeitados; por isso as portas estão fixas.

### 7.3. App Check

O App Check está ativo com reCAPTCHA Enterprise (chave `vitalita-appcheck`, score-based, sem
desafio visível). A ativação é feita só por variável de ambiente: `src/utils/appCheck.js` habilita
quando `VITE_FIREBASE_APP_CHECK_SITE_KEY` está preenchida e o build é de produção, e
`src/services/appCheckService.js` faz o `initializeAppCheck` com import dinâmico. Falhas são
engolidas e reportadas ao Sentry — o App Check nunca bloqueia o boot do app.

`VITE_*` é embutida em **tempo de build**: alterar a variável na Vercel não tem efeito sem um
**redeploy**.

Para verificar em produção, no console do navegador:

```js
typeof window.grecaptcha            // "object"
!!document.querySelector('.grecaptcha-badge')  // true
```

Filtrar a aba de rede por `recaptcha` não serve — as chamadas são cross-origin e podem não aparecer.

Para testar localmente, use `VITE_FIREBASE_APP_CHECK_DEBUG=true` no `.env.local` (só funciona fora
de produção) e registre no Firebase Console o token de debug impresso no console.

**Pendente:** o enforcement ainda está desligado — o App Check apenas coleta métricas e não bloqueia
nada. Só ligue depois de alguns dias com as requisições verificadas perto de 100% no Firebase
Console → App Check → APIs, e **apenas no Cloud Firestore**. Deixe o Authentication de fora enquanto
estiver marcado como PRÉ-LANÇAMENTO: travar o login com um recurso em beta tranca você para fora do
próprio app.
