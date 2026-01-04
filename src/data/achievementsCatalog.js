
export const achievementsCatalog = [
    // CONSISTÊNCIA E FREQUÊNCIA
    { id: "w_1", title: "Primeira Sessão", description: "Complete seu primeiro treino", category: "Consistência", type: "total_workouts", target: 1 },
    { id: "w_3_week", title: "Primeira Semana", description: "3 treinos em 7 dias", category: "Consistência", type: "workouts_last_7_days", target: 3 },
    { id: "w_5_week", title: "Semana Cheia", description: "5 treinos em 7 dias", category: "Consistência", type: "workouts_last_7_days", target: 5 },
    { id: "w_7_week", title: "Semana Perfeita", description: "7 treinos em 7 dias", category: "Consistência", type: "workouts_last_7_days", target: 7 },

    { id: "streak_3", title: "Streak 3", description: "3 dias seguidos", category: "Consistência", type: "streak_days", target: 3 },
    { id: "streak_7", title: "Streak de Fogo", description: "7 dias seguidos", category: "Consistência", type: "streak_days", target: 7 },
    { id: "streak_14", title: "Streak 14", description: "14 dias seguidos", category: "Consistência", type: "streak_days", target: 14 },
    { id: "streak_21", title: "Streak 21", description: "21 dias seguidos", category: "Consistência", type: "streak_days", target: 21 },
    { id: "streak_30", title: "Streak Supremo", description: "30 dias seguidos", category: "Consistência", type: "streak_days", target: 30 },
    { id: "streak_60", title: "Imparável", description: "60 dias seguidos", category: "Consistência", type: "streak_days", target: 60 },
    { id: "streak_90", title: "Disciplina Absoluta", description: "90 dias seguidos", category: "Consistência", type: "streak_days", target: 90 },

    { id: "w_50", title: "Maratonista", description: "50 treinos", category: "Consistência", type: "total_workouts", target: 50 },
    { id: "w_100", title: "Centurião", description: "100 treinos", category: "Consistência", type: "total_workouts", target: 100 },
    { id: "w_200", title: "Veterano", description: "200 treinos", category: "Consistência", type: "total_workouts", target: 200 },
    { id: "w_500", title: "Lenda", description: "500 treinos", category: "Consistência", type: "total_workouts", target: 500 },

    // VOLUME
    { id: "t_1", title: "Primeira Tonelada", description: "1 tonelada total", category: "Volume", type: "total_tonnage", target: 1000, format: "kg_to_tons" },
    { id: "t_10", title: "10 Toneladas", description: "10 toneladas totais", category: "Volume", type: "total_tonnage", target: 10000, format: "kg_to_tons" },
    { id: "t_50", title: "Peso Pesado", description: "50 toneladas totais", category: "Volume", type: "total_tonnage", target: 50000, format: "kg_to_tons" },
    { id: "t_100", title: "Força Bruta", description: "100 toneladas totais", category: "Volume", type: "total_tonnage", target: 100000, format: "kg_to_tons" },
    { id: "t_200", title: "Titã", description: "200 toneladas totais", category: "Volume", type: "total_tonnage", target: 200000, format: "kg_to_tons" },
    { id: "t_500", title: "Colosso", description: "500 toneladas totais", category: "Volume", type: "total_tonnage", target: 500000, format: "kg_to_tons" },

    // SÉRIES E REPETIÇÕES
    { id: "sets_1000", title: "Mestre das Séries", description: "1000 séries", category: "Volume", type: "total_sets", target: 1000 },
    { id: "sets_5000", title: "Incansável", description: "5000 séries", category: "Volume", type: "total_sets", target: 5000 },
    { id: "reps_10k", title: "10 Mil Reps", description: "10.000 repetições", category: "Volume", type: "total_reps", target: 10000 },
    { id: "reps_50k", title: "50 Mil Reps", description: "50.000 repetições", category: "Volume", type: "total_reps", target: 50000 },

    // FORÇA E PR
    { id: "pr_1", title: "Primeiro PR", description: "Primeiro recorde pessoal", category: "Força", type: "prs_count", target: 1 },
    { id: "pr_10", title: "Quebrador de Recordes", description: "10 PRs", category: "Força", type: "prs_count", target: 10 },
    { id: "pr_50", title: "Caçador de PR", description: "50 PRs", category: "Força", type: "prs_count", target: 50 },
    { id: "pr_100", title: "Máquina de Evolução", description: "100 PRs", category: "Força", type: "prs_count", target: 100 },

    // VARIEDADE
    { id: "ex_10", title: "Explorador", description: "10 exercícios diferentes", category: "Variedade", type: "distinct_exercises", target: 10 },
    { id: "ex_25", title: "Colecionador", description: "25 exercícios diferentes", category: "Variedade", type: "distinct_exercises", target: 25 },
    { id: "ex_50", title: "Repertório Completo", description: "50 exercícios diferentes", category: "Variedade", type: "distinct_exercises", target: 50 },
    { id: "ex_100", title: "Enciclopédia", description: "100 exercícios diferentes", category: "Variedade", type: "distinct_exercises", target: 100 },

    // FECHAMENTO SIMBÓLICO
    { id: "year_60", title: "Meio do Ano", description: "60 treinos no ano", category: "Marcos", type: "workouts_current_year", target: 60 },
    { id: "year_120", title: "Ano Completo", description: "120 treinos no ano", category: "Marcos", type: "workouts_current_year", target: 120 }
];
