/**
 * workoutStats.js
 * Utility to calculate weekly workout statistics, streak, and calendar data
 * shared between HomeDashboard and ProfilePage.
 */

export function calculateWeeklyStats(sessions, currentWeeklyGoal = 4) {
    const now = new Date();
    const startOfCurrentWeek = getStartOfWeek(now);

    const thisWeekSessions = sessions.filter(s => {
        const d = new Date(s.date || s.completedAt || s.timestamp); // Handle various date formats
        return d >= startOfCurrentWeek;
    });

    const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // --- Week Days Data ---
    // Start of week is Monday (from getStartOfWeek)
    const weekDaysData = Array(7).fill(null).map((_, idx) => {
        const dayDate = new Date(startOfCurrentWeek);
        dayDate.setDate(startOfCurrentWeek.getDate() + idx);

        const daySessions = thisWeekSessions.filter(s => {
            const sessionDate = new Date(s.date || s.completedAt || s.timestamp);
            return isSameDay(sessionDate, dayDate);
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

    // --- Month Stats Calculation ---
    // Updated to start on Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();

    // Adjust start day: standard getDay() is 0=Sun. 
    // We want 0=Mon ... 6=Sun.
    let startDayOfWeek = startOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const monthDaysData = [];

    // Pad start (previous month days)
    for (let i = startDayOfWeek; i > 0; i--) {
        const d = new Date(startOfMonth);
        d.setDate(d.getDate() - i);

        const daySessions = sessions.filter(s => {
            const sd = new Date(s.date || s.completedAt || s.timestamp);
            return isSameDay(sd, d);
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

    // Fill current month
    const todayForStatus = new Date();
    todayForStatus.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
        const currentDayDate = new Date(now.getFullYear(), now.getMonth(), i);
        const currentDayStripped = new Date(currentDayDate);
        currentDayStripped.setHours(0, 0, 0, 0);

        const dayOfWeek = currentDayDate.getDay();

        // Sync with sessions
        const daySessions = sessions.filter(s => {
            const sd = new Date(s.date || s.completedAt || s.timestamp);
            return isSameDay(sd, currentDayDate);
        });
        const trained = daySessions.length > 0;
        const lastSession = trained ? daySessions[0] : null;

        // Determine Status
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

    // Pad end (next month days)
    // We want total cells to be multiple of 7 to fill the row
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

    // --- Streak Calculation ---
    const weeksWithTraining = new Set();
    sessions.forEach(s => {
        const d = new Date(s.date || s.completedAt || s.timestamp);
        const weekStr = getWeekString(d);
        weeksWithTraining.add(weekStr);
    });

    let currentStreak = 0;
    let checkDate = new Date();
    // Check if current week has training
    if (weeksWithTraining.has(getWeekString(checkDate))) {
        currentStreak++;
    }

    // Check previous weeks
    for (let i = 0; i < 52; i++) {
        checkDate.setDate(checkDate.getDate() - 7);
        if (weeksWithTraining.has(getWeekString(checkDate))) {
            currentStreak++;
        } else {
            break;
        }
    }

    const bestStreak = Math.max(currentStreak, 3); // Mock best streak logic used in HomeDashboard

    return {
        currentStreak,
        bestStreak,
        completedThisWeek: thisWeekSessions.length,
        weeklyGoal: currentWeeklyGoal,
        weekDays: weekDaysData,
        monthDays: monthDaysData
    };
}

// Helpers
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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
