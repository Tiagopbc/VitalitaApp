# Vitalità

<div align="center">

![Vitalità Banner](https://img.shields.io/badge/Vitalità-Fitness_Tracking-blue?style=for-the-badge&logo=activity)

<br />

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.0-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Tested-729B1B?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

**O seu diário inteligente de treinos, evolução e performance.**

</div>

---

## 💡 A Motivação

O **Vitalità** nasceu de uma frustração pessoal e genuína. Ao procurar aplicativos de treino, o que se encontra no mercado geralmente se divide em dois extremos: ou são "blocos de notas" simples demais que não geram dados úteis, ou são plataformas inchadas, cheias de anúncios, redes sociais forçadas e funções irrelevantes que quebram o foco do treino.

Eu queria algo diferente. Queria uma ferramenta que respeitasse o **"Deep Work"** do atleta na academia.

*   Sem distrações.
*   Foco total na execução (carga, repetições, descanso).
*   Dados que realmente importam para progredir (Volume acumulado, carga máxima, consistência).

O Vitalità é a resposta para essa busca: um ecossistema sério, estético e funcional para quem trata o treino como disciplina, e não apenas como passatempo.

---

## 🏗️ Bastidores & Arquitetura (V3)

Este projeto não é apenas uma interface bonita. Ele é um software vivo que amadureceu tecnicamente ao longo de várias iterações. Recentemente, passou por uma auditoria técnica rigorosa e refatoração arquitetural para garantir escalabilidade e segurança:

*   **Test-Driven Reliability**: Implementação de infraestrutura de testes com **Vitest** e **React Testing Library**, cobrindo lógica de negócios e componentes críticos.
*   **Gestão de Sessão Segura**: Lógica de treino extraída para uma **Context API** dedicada (`WorkoutContext`), com sincronização em tempo real (Firebase) e proteção contra "ghost sessions" (divergência de estado entre dispositivos).
*   **Performance First**: Code splitting, Lazy Loading de rotas pesadas e remoção de dependências ociosas (adeus, Axios!).
*   **Design System Modular**: Componentes de UI desacoplados e reutilizáveis, seguindo princípios de Atomic Design.

---

## 📖 Sobre o Projeto

O **Vitalità** é uma aplicação web progressiva (PWA) de alta performance, desenvolvida para entusiastas e profissionais de musculação. Mais do que um simples registro, é um sistema que une o atleta ao seu progresso.

Com um design **"Dark Premium"** focado na usabilidade em ambientes de academia (modo noturno nativo, alto contraste e elementos glassmorphism), o app oferece uma experiência fluida e engajadora.

### ✨ Diferenciais
- **Foco Absoluto na Execução**: Interface "Bubble" para contagem de séries e timer automático.
- **Ecossistema Aluno-Treinador**: Funcionalidades para Personal Trainers gerenciarem alunos e prescreverem treinos.
- **Gamificação Real**: Sistema de Streaks e níveis (Bronze a Diamante) para combater a evasão.
- **PWA First**: Instale como aplicativo nativo no iOS e Android.

---

## 🚀 Funcionalidades

### 👤 Para Alunos (Atletas)

#### 🏋️‍♂️ Execução e Registro
- **Smart Tracking**: Registro de séries com ajuste rápido de carga e repetições.
- **Timer Automático**: Cronômetro de descanso inteligente.
- **Biblioteca de Métodos**: Guias para técnicas avançadas (Drop-set, Rest-pause, GVT).
- **Histórico Detalhado**: Evolução de carga e volume por exercício.

#### 📊 Dashboard Pessoal
- **Progressão Visual**: Gráficos de volume de carga.
- **Streak Weekly Goal**: Widget híbrido para monitorar a frequência semanal.
- **Sugestão Inteligente**: Rotação automática de treinos.

---

### 🎓 Para Personal Trainers

#### 👥 Gestão de Alunos
- **Painel do Treinador**: Visão geral de todos os alunos vinculados.
- **Prescrição Remota**: Crie e edite fichas de treino para alunos.
- **Monitoramento**: Acompanhe a frequência e desempenho em tempo real.

---

## 🛠️ Tecnologias Utilizadas

Este projeto está na vanguarda do desenvolvimento web moderno:

- **Core**: [React 19](https://react.dev/)
- **Build & Tooling**: [Vite 7](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Firestore V3, Auth)
- **Testes**: [Vitest](https://vitest.dev/) & [React Testing Library](https://testing-library.com/)
- **Animações**: [Motion](https://motion.dev/)
- **Visualização de Dados**: [Recharts](https://recharts.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Instalação e Configuração

Para rodar o Vitalità localmente:

### Pré-requisitos
- Node.js (v18+)
- Gerenciador de pacotes (npm, yarn ou pnpm)

### Passo a passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Tiagopbc/Vitalita_ver3.git
   cd Vitalita_ver3
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um `.env` na raiz com suas credenciais do Firebase.

4. **Execute os Testes** (Opcional, mas recomendado)
   ```bash
   npm test
   ```

5. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   Acesse em `http://localhost:5173`.

---

## 📄 Licença

Este projeto é desenvolvido e mantido por **Tiago Cavalcanti**.
Código aberto para fins de estudo e portfólio.

---

<div align="center">

Desenvolvido com 💪, 🧠 e muito ☕

</div>
