import { describe, expect, it, vi } from "vitest";
import { backfillUserStats, parseBackfillOptions } from "../scripts/backfillUserStats.js";

describe("parseBackfillOptions", () => {
    it("defaults to dry-run and parses explicit options", () => {
        const options = parseBackfillOptions([
            "--project", "vitalita-prod",
            "--user", "user-1",
            "--limit-users", "10",
            "--batch-size", "5",
            "--max-sessions", "100",
            "--write"
        ]);

        expect(options).toEqual(expect.objectContaining({
            projectId: "vitalita-prod",
            userId: "user-1",
            limitUsers: 10,
            batchSize: 5,
            maxSessions: 100,
            write: true
        }));
    });

    it("rejects unknown arguments", () => {
        expect(() => parseBackfillOptions(["--wat"])).toThrow("Argumento desconhecido");
    });
});

describe("backfillUserStats", () => {
    it("runs in dry-run without writing user_stats", async () => {
        const set = vi.fn();
        const db = createFakeDb({ set });
        const log = createFakeLog();

        const summary = await backfillUserStats(db, {
            userId: "user-1",
            batchSize: 50,
            maxSessions: 2000,
            write: false
        }, log);

        expect(summary).toEqual(expect.objectContaining({
            processedUsers: 1,
            writtenUsers: 0,
            failedUsers: 0,
            dryRun: true
        }));
        expect(set).not.toHaveBeenCalled();
    });

    it("compares against the stored doc so the dry-run shows what will change", async () => {
        const set = vi.fn();
        const log = createFakeLog();
        const db = createFakeDb({
            set,
            existingStats: { prsCount: 3, distinctExercises: 2 }
        });

        await backfillUserStats(db, {
            userId: "user-1",
            batchSize: 50,
            maxSessions: 2000,
            write: false
        }, log);

        const [message] = log.info.mock.calls[0];
        expect(message).toContain("PRs 1 (era 3)");
        expect(message).toContain("exercicios 1 (era 2)");
        expect(set).not.toHaveBeenCalled();
    });

    it("writes aggregate when --write is enabled", async () => {
        const set = vi.fn();
        const db = createFakeDb({ set });
        const log = createFakeLog();

        const summary = await backfillUserStats(db, {
            userId: "user-1",
            batchSize: 50,
            maxSessions: 2000,
            write: true
        }, log);

        expect(summary.writtenUsers).toBe(1);
        expect(set).toHaveBeenCalledWith(expect.objectContaining({
            userId: "user-1",
            source: "backfill_script",
            totalWorkouts: 1,
            totalTonnageKg: 1000
        }), { merge: false });
    });

    it("preserves achievements already unlocked in the stored doc", async () => {
        const set = vi.fn();
        const db = createFakeDb({
            set,
            existingStats: {
                achievements: {
                    pr_50: { unlockedAt: "2026-05-01T00:00:00.000Z", value: 50 }
                }
            }
        });

        await backfillUserStats(db, {
            userId: "user-1",
            batchSize: 50,
            maxSessions: 2000,
            write: true
        }, createFakeLog());

        const written = set.mock.calls[0][0];
        expect(written.achievements.pr_50).toEqual({
            unlockedAt: "2026-05-01T00:00:00.000Z",
            value: 50
        });
        expect(written.achievements.w_1).toBeTruthy();
    });
});

function createFakeDb({ set, existingStats = null }) {
    const userDoc = {
        data: () => ({
            weeklyGoal: 4
        })
    };

    const sessionDoc = {
        id: "session-1",
        data: () => ({
            userId: "user-1",
            completedAt: new Date("2026-07-01T10:00:00.000Z"),
            exercises: [
                {
                    name: "Supino",
                    sets: [{ weight: "100", reps: "10", completed: true }]
                }
            ]
        })
    };

    return {
        doc(path) {
            if (path === "users/user-1") {
                return {
                    get: async () => userDoc
                };
            }

            if (path === "user_stats/user-1") {
                return {
                    set,
                    get: async () => ({ data: () => existingStats })
                };
            }

            throw new Error(`unexpected doc path ${path}`);
        },
        collection(name) {
            if (name !== "workout_sessions") throw new Error(`unexpected collection ${name}`);
            return {
                where() { return this; },
                orderBy() { return this; },
                limit() { return this; },
                get: async () => ({
                    size: 1,
                    docs: [sessionDoc]
                })
            };
        }
    };
}

function createFakeLog() {
    return {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    };
}
