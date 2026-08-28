import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

import pluginCypress from 'eslint-plugin-cypress/flat'
import pluginReact from 'eslint-plugin-react'

export default defineConfig([
  // '.claude/**' porque padrões de flat config são ancorados na raiz: 'dist' e
  // 'dev-dist' não alcançam as cópias dentro de .claude/worktrees/<branch>/.
  globalIgnores(['dist', 'dev-dist', 'coverage', '.claude/**']),
  pluginCypress.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/react-in-jsx-scope': 'off', // Not needed in React 18+ / Vite
      'react/prop-types': 'off', // We are forgiving on prop types for now to avoid noise

      // Aviso, não erro — decidido em 28/08/2026 ao adotar o
      // eslint-plugin-react-hooks 7.1.1, que passou a reprovar 12 ocorrências
      // já existentes. As 12 foram lidas uma a uma: são busca de dados no
      // mount (AppAuthed, TrainerDashboard, WorkoutsPage, HistoryPage) e
      // reset de estado quando a identidade muda (NumericKeypad, HistoryPage,
      // RestTimer) — o padrão canônico do React sem uma biblioteca de dados,
      // sem alternativa mais simples. A única que era de fato estado derivado
      // virou `useMemo` em `useAchievements.js`; o resto custa um render a
      // mais, não um defeito.
      //
      // Fica em 'warn' de propósito, em vez de 'off' ou de 11 supressões
      // espalhadas: nada some do relatório de lint, ocorrência nova aparece
      // junto, e o CI não quebra por dívida herdada. Se um dia o app adotar o
      // React Compiler, isto vira 'error' e as 11 viram trabalho de verdade.
      'react-hooks/set-state-in-effect': 'warn'
    },
  },
  {
    files: ['functions/**/*.js', 'api/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['public/push-sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
])
