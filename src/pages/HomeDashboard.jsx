/**
 * HomeDashboard.jsx
 * Tela inicial: saudação, progresso da semana, pensamento do dia, próximo
 * treino sugerido e próxima conquista.
 *
 * Orquestrador fino (D17): dados e cache em src/hooks/home/, cada seção em
 * src/components/home/. Aqui ficam só a saudação, o progresso, a composição e
 * o modal de cardio.
 */
import React, { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { StreakWeeklyGoalHybrid } from '../components/StreakWeeklyGoalHybrid';
import { SectionHeader } from '../components/design-system/SectionHeader';
import { AddCardioModal } from '../components/AddCardioModal';
import { DailyQuoteCard } from '../components/home/DailyQuoteCard';
import { SuggestedWorkoutCard } from '../components/home/SuggestedWorkoutCard';
import { NextAchievementCard } from '../components/home/NextAchievementCard';
import { getDailyQuote } from '../data/motivationalQuotes';
import { useHomeDashboardData } from '../hooks/home/useHomeDashboardData';
import { useShareQuote } from '../hooks/home/useShareQuote';

export function HomeDashboard({
    onNavigateToCreateWorkout,
    onNavigateToWorkout,
    onNavigateToHistory,
    onNavigateToAchievements,
    user
}) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = user?.displayName?.split(' ')[0] || 'Atleta';

    // Frase do dia, fixa enquanto a tela está montada.
    const dailyQuote = useMemo(() => getDailyQuote(), []);
    const { shareQuoteRef, sharingQuote, shareQuote } = useShareQuote(dailyQuote);

    const {
        stats,
        nextAchievement,
        loadingTemplates,
        loadingStats,
        suggestedWorkout
    } = useHomeDashboardData(user);

    const [isAddCardioOpen, setIsAddCardioOpen] = useState(false);

    return (
        <div className="pb-4 lg:pb-8 max-w-3xl mx-auto w-full">
            <div className="w-full px-4 lg:px-8 flex flex-col">

                {/* 1. SAUDAÇÃO */}
                <div className="pt-2 pb-5 lg:pt-6 lg:pb-6">
                    <h1 className="text-2xl lg:text-3xl mb-1 text-white font-heading font-bold">
                        {greeting}, <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{firstName}</span>
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Pronto para o próximo treino?
                    </p>
                </div>

                {/* 2. PROGRESSO */}
                <div className="mb-8">
                    <SectionHeader
                        icon={<Flame size={18} className="text-orange-400" />}
                        title="Seu Progresso"
                    />

                    <div
                        onClick={onNavigateToHistory}
                        className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
                    >
                        {loadingStats ? (
                            <div className="w-full h-64 bg-slate-900/50 rounded-3xl animate-pulse border border-slate-800" />
                        ) : (
                            <StreakWeeklyGoalHybrid
                                currentStreak={stats.currentStreak}
                                bestStreak={stats.bestStreak}
                                weeklyGoal={stats.weeklyGoal}
                                completedThisWeek={stats.completedThisWeek}
                                weekDays={stats.weekDays}
                                monthDays={stats.monthDays}
                                showRings={false}
                            />
                        )}
                    </div>
                </div>

                <DailyQuoteCard
                    quote={dailyQuote}
                    userName={user?.displayName || 'Atleta'}
                    sharing={sharingQuote}
                    onShare={shareQuote}
                    shareRef={shareQuoteRef}
                />

                <SuggestedWorkoutCard
                    loading={loadingTemplates}
                    workout={suggestedWorkout}
                    onStart={onNavigateToWorkout}
                    onCreate={onNavigateToCreateWorkout}
                    onAddCardio={() => setIsAddCardioOpen(true)}
                />

                <NextAchievementCard
                    loading={loadingStats}
                    achievement={nextAchievement}
                    onOpen={onNavigateToAchievements}
                />
            </div>

            <AddCardioModal
                isOpen={isAddCardioOpen}
                onClose={() => setIsAddCardioOpen(false)}
                user={user}
            />
        </div>
    );
}
