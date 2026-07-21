import { describe, expect, it } from "vitest";
import { buildUserStatsFromSessions, mergeUnlockedAchievements } from "../src/userStatsCalculator.js";

function session(date, exercises = []) {
    return {
        userId: "user-1",
        completedAt: new Date(date),
        elapsedSeconds: 1800,
        exercises
    };
}

function strengthExercise(name, sets) {
    return { name, sets };
}

describe("buildUserStatsFromSessions", () => {
    it("builds lifetime totals, tonnage and achievement stats from sessions", () => {
        const stats = buildUserStatsFromSessions([
            session("2026-07-01T10:00:00.000Z", [
                strengthExercise("Supino", [
                    { weight: "80", reps: "10", completed: true },
                    { weight: "70", reps: "8", completed: false }
                ])
            ]),
            session("2026-07-02T10:00:00.000Z", [
                strengthExercise("Supino", [
                    { weight: "82.5", reps: "8", completed: true }
                ]),
                strengthExercise("Remada", [
                    { weight: "60", reps: "10", completed: true }
                ])
            ])
        ], {
            userId: "user-1",
            weeklyGoal: 2,
            now: new Date("2026-07-03T12:00:00.000Z")
        });

        expect(stats.userId).toBe("user-1");
        expect(stats.totalWorkouts).toBe(2);
        expect(stats.totalSets).toBe(3);
        expect(stats.totalReps).toBe(28);
        expect(stats.totalTonnageKg).toBe(2060);
        expect(stats.distinctExercises).toBe(2);
        expect(stats.prsCount).toBe(3);
        expect(stats.currentDailyStreak).toBe(2);
        expect(stats.weeklyCompleted).toBe(2);
        expect(stats.currentWeeklyStreak).toBe(1);
        expect(stats.achievementStats.totalWorkouts).toBe(2);
        expect(stats.achievements.w_1).toBeTruthy();
        expect(stats.achievements.t_1).toBeTruthy();
    });

    it("counts cardio separately and keeps strength volume at zero", () => {
        const stats = buildUserStatsFromSessions([
            {
                userId: "user-1",
                isCardio: true,
                completedAt: new Date("2026-07-01T10:00:00.000Z"),
                durationMin: 30,
                activityType: "run"
            }
        ], {
            weeklyGoal: 4,
            now: new Date("2026-07-03T12:00:00.000Z")
        });

        expect(stats.totalWorkouts).toBe(1);
        expect(stats.cardioWorkouts).toBe(1);
        expect(stats.strengthWorkouts).toBe(0);
        expect(stats.totalDurationSeconds).toBe(1800);
        expect(stats.totalTonnageKg).toBe(0);
    });

    it("treats spelling variants of an exercise as the same movement", () => {
        const stats = buildUserStatsFromSessions([
            session("2026-07-01T10:00:00.000Z", [
                strengthExercise("Leg Press 45°", [
                    { weight: "200", reps: "10", completed: true }
                ])
            ]),
            session("2026-07-02T10:00:00.000Z", [
                strengthExercise("leg press 45", [
                    { weight: "180", reps: "10", completed: true }
                ])
            ])
        ], {
            weeklyGoal: 4,
            now: new Date("2026-07-03T12:00:00.000Z")
        });

        // Um exercício só, um PR só — a segunda grafia não é recorde novo.
        expect(stats.distinctExercises).toBe(1);
        expect(stats.prsCount).toBe(1);
        // Rótulo exibido: o mais completo, com o símbolo de grau.
        expect(stats.exerciseMaxes).toEqual({ "Leg Press 45°": 200 });
        expect(stats.achievementStats.exerciseMaxes).toEqual({ "Leg Press 45°": 200 });
    });
});

describe("mergeUnlockedAchievements", () => {
    it("keeps achievements that the new calculation no longer unlocks", () => {
        const merged = mergeUnlockedAchievements(
            { pr_50: { unlockedAt: "2026-05-01T00:00:00.000Z", value: 50 } },
            { w_1: { unlockedAt: "2026-06-01T00:00:00.000Z", value: 1 } }
        );

        expect(merged.pr_50.unlockedAt).toBe("2026-05-01T00:00:00.000Z");
        expect(merged.w_1).toBeTruthy();
    });

    it("keeps the earliest unlock date when both sides have the achievement", () => {
        const merged = mergeUnlockedAchievements(
            { w_1: { unlockedAt: "2026-01-01T00:00:00.000Z", value: 1 } },
            { w_1: { unlockedAt: "2026-06-01T00:00:00.000Z", value: 1 } }
        );

        expect(merged.w_1.unlockedAt).toBe("2026-01-01T00:00:00.000Z");
    });

    it("falls back to the computed entry when the stored date is unusable", () => {
        const merged = mergeUnlockedAchievements(
            { w_1: { unlockedAt: null } },
            { w_1: { unlockedAt: "2026-06-01T00:00:00.000Z", value: 1 } }
        );

        expect(merged.w_1.unlockedAt).toBe("2026-06-01T00:00:00.000Z");
    });
});
