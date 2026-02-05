/**
 * workoutStats.js
 * Utilitário para calcular estatísticas semanais de treino, streak e dados do calendário
 * compartilhado entre HomeDashboard e ProfilePage.
 */

export function calculateWeeklyStats(sessions, currentWeeklyGoal = 4) {
    const now = new Date();
    const startOfCurrentWeek = getStartOfWeek(now);
    const getSessionDate = (session) => {
        const raw = session?.date || session?.completedAt || session?.timestamp;
        if (!raw) return null;
        if (typeof raw.toDate === 'function') return raw.toDate();
        if (raw instanceof Date) return raw;
        if (typeof raw === 'string' || typeof raw === 'number') return new Date(raw);
        if (raw.seconds) return new Date(raw.seconds * 1000);
        return null;
    };

    const thisWeekSessions = sessions.filter(s => {
        const d = getSessionDate(s);
        return d && d >= startOfCurrentWeek;
    });

    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // --- Dados dos Dias da Semana ---
    // Início da semana é Segunda (de getStartOfWeek)
    const weekDaysData = Array(7).fill(null).map((_, idx) => {
        const dayDate = new Date(startOfCurrentWeek);
        dayDate.setDate(startOfCurrentWeek.getDate() + idx);

        const daySessions = thisWeekSessions.filter(s => {
            const sessionDate = getSessionDate(s);
            return sessionDate && isSameDay(sessionDate, dayDate);
        });
        const trained = daySessions.length > 0;
        const lastSession = trained ? daySessions[0] : null;

        const dayOfWeek = dayDate.getDay();

        return {
            day: daysMap[dayOfWeek],
            label: daysMap[dayOfWeek],
            dateNumber: dayDate.getDate(),
            fullDate: dayDate,
            trained: trained,
            workout: lastSession ? (lastSession.workoutName || 'Treino Realizado') : null,
            time: lastSession ? formatTime(new Date(lastSession.date || lastSession.completedAt || lastSession.timestamp)) : null,
            isRest: !trained && dayDate < now && dayDate.getDay() !== 0,
        };
    });

    // --- Cálculo de Estatísticas do Mês ---
    // Atualizado para começar na Segunda
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // Ajustar dia de início: padrão getDay() é 0=Dom. 
    // Queremos 0=Seg ... 6=Dom.
    let startDayOfWeek = startOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const monthDaysData = [];

    // Preencher início (dias do mês anterior)
    for (let i = startDayOfWeek; i > 0; i--) {
        const d = new Date(startOfMonth);
        d.setDate(d.getDate() - i);

        const daySessions = sessions.filter(s => {
            const sd = getSessionDate(s);
            return sd && isSameDay(sd, d);
        });
        const trained = daySessions.length > 0;

        monthDaysData.push({
            day: daysMap[d.getDay()],
            label: daysMap[d.getDay()],
            dateNumber: d.getDate(),
            fullDate: d,
            trained: trained,
            isOutsideMonth: true,
            status: trained ? 'trained' : 'prev_month_rest'
        });
    }

    // Preencher mês atual
    const todayForStatus = new Date();
    todayForStatus.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDayDate = new Date(now.getFullYear(), now.getMonth(), i);
        const currentDayStripped = new Date(currentDayDate);
        currentDayStripped.setHours(0, 0, 0, 0);

        const dayOfWeek = currentDayDate.getDay();

        // Sincronizar com sessões
        const daySessions = sessions.filter(s => {
            const sd = getSessionDate(s);
            return sd && isSameDay(sd, currentDayDate);
        });
        const trained = daySessions.length > 0;
        const lastSession = trained ? daySessions[0] : null;

        // Determinar Status
        let status = 'rest';
        if (trained) {
            status = 'trained';
        } else if (currentDayStripped > todayForStatus) {
            status = 'future';
        } else if (currentDayStripped.getTime() === todayForStatus.getTime()) {
            status = 'rest';
        }

        monthDaysData.push({
            day: daysMap[dayOfWeek],
            label: daysMap[dayOfWeek],
            dateNumber: i,
            fullDate: currentDayDate,
            trained: trained,
            workout: lastSession ? (lastSession.workoutName || 'Treino') : null,
            isRest: !trained && currentDayDate < now && currentDayDate.getDay() !== 0,
            status: status,
            isOutsideMonth: false
        });
    }

    // Preencher final (dias do próximo mês)
    // Queremos total de células múltiplo de 7 para preencher a linha
    const totalCells = monthDaysData.length;
    const remainingCells = 7 - (totalCells % 7);

    if (remainingCells < 7) {
        for (let i = 1; i <= remainingCells; i++) {
            const d = new Date(endOfMonth);
            d.setDate(d.getDate() + i);
            monthDaysData.push({
                day: daysMap[d.getDay()],
                label: daysMap[d.getDay()],
                dateNumber: d.getDate(),
                fullDate: d,
                trained: false,
                isOutsideMonth: true,
                status: 'future'
            });
        }
    }

    // --- Cálculo de Streak por meta semanal ---
    const weekCounts = new Map();
    const weekStarts = new Map();
    sessions.forEach(s => {
        const d = getSessionDate(s);
        if (!d || isNaN(d.getTime())) return;
        const weekStart = getStartOfWeek(d);
        const weekStr = getWeekString(weekStart);
        weekStarts.set(weekStr, weekStart);
        weekCounts.set(weekStr, (weekCounts.get(weekStr) || 0) + 1);
    });

    const weeksMeetingGoal = new Set(
        Array.from(weekCounts.entries())
            .filter(([, count]) => count >= currentWeeklyGoal)
            .map(([weekStr]) => weekStr)
    );

    let currentStreak = 0;
    let checkDate = getStartOfWeek(new Date());
    while (weeksMeetingGoal.has(getWeekString(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 7);
    }

    const sortedWeekStarts = Array.from(weeksMeetingGoal)
        .map(weekStr => weekStarts.get(weekStr))
        .filter(Boolean)
        .sort((a, b) => a - b);

    let bestStreak = 0;
    let run = 0;
    for (let i = 0; i < sortedWeekStarts.length; i++) {
        if (i === 0) {
            run = 1;
        } else {
            const diffDays = (sortedWeekStarts[i] - sortedWeekStarts[i - 1]) / (1000 * 60 * 60 * 24);
            run = diffDays === 7 ? run + 1 : 1;
        }
        if (run > bestStreak) bestStreak = run;
    }

    return {
        currentStreak,
        bestStreak,
        completedThisWeek: thisWeekSessions.length,
        weeklyGoal: currentWeeklyGoal,
        weekDays: weekDaysData,
        monthDays: monthDaysData
    };
}

// Auxiliares
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar quando dia é Domingo
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(d1, d2) {
    return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
}

function formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getWeekString(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
}
