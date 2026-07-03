import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { buildUserStatsFromSessions } from "./userStatsCalculator.js";

initializeApp();

const db = getFirestore();
const MAX_REBUILD_SESSIONS = 2000;

export const rebuildUserStatsOnSessionCreated = onDocumentCreated(
    "workout_sessions/{sessionId}",
    async (event) => {
        const session = event.data?.data();
        const userId = session?.userId;

        if (!userId) {
            logger.warn("Skipping user_stats rebuild without userId", {
                sessionId: event.params.sessionId
            });
            return;
        }

        await rebuildUserStats(userId, event.params.sessionId);
    }
);

async function rebuildUserStats(userId, sourceSessionId) {
    const [userSnap, sessionsSnap] = await Promise.all([
        db.doc(`users/${userId}`).get(),
        db.collection("workout_sessions")
            .where("userId", "==", userId)
            .orderBy("completedAt", "desc")
            .limit(MAX_REBUILD_SESSIONS)
            .get()
    ]);

    const weeklyGoal = Number(userSnap.data()?.weeklyGoal) || 4;
    const sessions = sessionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    const stats = buildUserStatsFromSessions(sessions, {
        userId,
        weeklyGoal,
        now: new Date()
    });

    await db.doc(`user_stats/${userId}`).set({
        ...stats,
        rebuildLimit: MAX_REBUILD_SESSIONS,
        rebuildTruncated: sessionsSnap.size >= MAX_REBUILD_SESSIONS,
        sourceSessionId,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: false });

    logger.info("Rebuilt user_stats", {
        userId,
        totalWorkouts: stats.totalWorkouts,
        sourceSessionId,
        rebuildTruncated: sessionsSnap.size >= MAX_REBUILD_SESSIONS
    });
}
