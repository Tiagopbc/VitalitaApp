
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
    O servidor iniciará (geralmente em `http://localhost:5173`).

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
