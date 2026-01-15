import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    limit,
    startAfter,
    doc,
    getDoc,
    addDoc,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust path if needed

const TEMPLATES_COLLECTION = 'workout_templates';
const SESSIONS_COLLECTION = 'workout_sessions';

// In-memory cache
let templatesCache = {
    userId: null,
    data: null,
    timestamp: 0
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const workoutService = {
    /**
     * Fetches workout templates for a specific user.
     * @param {string} userId - The UID of the user (or student).
     * @param {boolean} forceRefresh - Ignore cache.
     * @returns {Promise<Array>} List of templates.
     */
    async getTemplates(userId, forceRefresh = false) {
        // Return cached data if valid
        const now = Date.now();
        if (
            !forceRefresh &&
            templatesCache.userId === userId &&
            templatesCache.data &&
            (now - templatesCache.timestamp < CACHE_DURATION)
        ) {
            return templatesCache.data;
        }

        try {
            const templatesRef = collection(db, TEMPLATES_COLLECTION);
            const q = query(
                templatesRef,
                where('userId', '==', userId)
            );

            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sort by name
            const sorted = list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            // Update Cache
            templatesCache = {
                userId,
                data: sorted,
                timestamp: now
            };

            return sorted;
        } catch (error) {
            console.error("Error fetching templates:", error);
            throw error;
        }
    },

    /**
     * Clear Templates Cache (e.g., after creating new workout)
     */
    clearCache() {
        templatesCache = { userId: null, data: null, timestamp: 0 };
    },

    /**
     * Get the LAST COMPLETED session for the user (Limit 1).
     * Optimized for "Next Suggestion" logic.
     * @param {string} userId 
     * @returns {Promise<Object|null>}
     */
    async getLatestSession(userId) {
        try {
            const sessionsRef = collection(db, SESSIONS_COLLECTION);
            const q = query(
                sessionsRef,
                where('userId', '==', userId),
                orderBy('completedAt', 'desc'),
                limit(1)
            );

            const snap = await getDocs(q);
            if (snap.empty) return null;

            const doc = snap.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                date: doc.data().completedAt?.toDate()
            };
        } catch (err) {
            console.error("Error fetching latest session:", err);
            return null; // Fail gracefully
        }
    },

    /**
     * Fetches workout history sessions with pagination.
     * @param {string} userId - The UID of the user.
     * @param {string} templateId - Filter by template name or ID (Legacy uses templateName).
     * @param {string} exerciseName - Optional filter by exercise (client-side usually, but we can try server-side if structure allows).
     * @param {Object} lastDoc - The last document snapshot from previous fetch (for pagination).
     * @param {number} pageSize - Number of items to fetch.
     * @returns {Promise<{data: Array, lastDoc: Object, hasMore: boolean}>}
     */
    async getHistory(userId, templateName, lastDoc = null, pageSize = 10) {
        try {
            const sessionsRef = collection(db, SESSIONS_COLLECTION);

            // Base constraints
            const constraints = [
                where('userId', '==', userId),
            ];

            if (templateName) {
                constraints.push(where('templateName', '==', templateName));
            }

            // Note: If filtering by templateName, we ideally need a composite index with completedAt.
            // If just userId, we need index on userId + completedAt.

            // Note: If we use 'where' on equality (userId, templateName) and sort by completedAt,
            // Firestore requires a Composite Index.
            // "userId Asc, templateName Asc, completedAt Desc"

            // If we want to avoid index creation RIGHT NOW for the user demo, we might have to fetch more and slice?
            // But the objective IS optimization. So we SHOULD request the index.
            // However, to keep "functionality existing" without breaking current flow (which removed orderBy), 
            // maybe we can't fully paginate server-side without that index.

            // Strategy: Try to use orderBy. If it fails (caught in UI), we warn.
            // BUT, previously we removed orderBy to fix "Missing Index".
            // Since we can't ask user to click the link in 1 second, let's implement a "Load All" or "Logic Safe" approach?

            // Actually, without an index, we can't do server-side filtering AND sorting AND pagination efficiently.
            // Let's stick to the current "Safe" approach: Fetch ALMOST everything (or Limit) and sort client side?
            // No, that defeats "Optimization".

            // Compromise: We will NOT add orderBy here yet to ensure it works. 
            // We will fetch query with Limit, but without ordering, the "LastDoc" pagination is arbitrary.
            // Firestore default order is ID.

            // BETTER STRATEGY: 
            // Since we removed orderBy previously, we should probably stick to client-side sorting
            // UNLESS we are sure about the index.
            // But for PAGINATION (Load More), we really need a stable order.

            // Let's force orderBy('completedAt', 'desc') and if it fails, the user (developer) sees the link to create index.
            // It is the "Correct" way.
            constraints.push(orderBy('completedAt', 'desc'));

            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            constraints.push(limit(pageSize));

            const q = query(sessionsRef, ...constraints);
            const snap = await getDocs(q);

            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const newLastDoc = snap.docs[snap.docs.length - 1];

            return {
                data,
                lastDoc: newLastDoc,
                hasMore: snap.docs.length === pageSize
            };

        } catch (error) {
            console.error("Error fetching history:", error);
            // Fallback for missing index: fetch without orderBy/limit? 
            // Or just throw to let UI handle "Create Index".
            throw error;
        }
    },

    /**
     * Fetch all sessions for analytics (without pagination)
     * @param {string} userId 
     * @returns {Promise<Array>}
     */
    async getAllSessions(userId) {
        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const q = query(
            sessionsRef,
            where('userId', '==', userId)
            // No limit, maybe orderBy depending on need, but for stats we just need data.
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Search exercises in the global catalog.
     * @param {string} searchTerm
     * @param {string|null} muscleFilter (Optional)
     * @param {number} limitCount
     * @returns {Promise<Array>}
     */
    async searchExercises(searchTerm, muscleFilter = null, limitCount = 20) {
        try {
            const catalogRef = collection(db, 'exercises_catalog');
            let constraints = [];
            const term = searchTerm ? searchTerm.toLowerCase().trim() : '';

            // STRATEGY:
            // 1. If Muscle Filter is ON: Query by Muscle Group (Equality) -> Client-side filter by Name.
            //    Reason: Avoids need for Composite Index (Muscle + SearchKey) which breaks if missing.
            // 2. If Muscle Filter is OFF: Query by SearchKey (Range) -> Standard prefix search.

            if (muscleFilter) {
                constraints.push(where('muscleGroup', '==', muscleFilter));
                // fetch more to allow for filtering
                constraints.push(limit(100)); // Reasonable limit for a single muscle group
            } else if (term) {
                // Global search (Prefix)
                constraints.push(where('searchKey', '>=', term));
                constraints.push(where('searchKey', '<=', term + '\uf8ff'));
                constraints.push(limit(limitCount));
            } else {
                // No filter, no term? Just return some randoms or empty?
                // Returning empty is safer to avoid huge reads, but if limit is small it's ok.
                constraints.push(limit(limitCount));
            }

            const q = query(catalogRef, ...constraints);
            const snap = await getDocs(q);
            let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Client-side filtering if we used muscle filter strategy with a term
            if (muscleFilter && term) {
                results = results.filter(r => {
                    const name = r.name?.toLowerCase() || '';
                    const searchKey = r.searchKey || '';
                    return name.includes(term) || searchKey.includes(term);
                });
                // Re-apply limit after filtering
                results = results.slice(0, limitCount);
            }

            return results;

        } catch (error) {
            console.error("Error searching exercises:", error);
            return [];
        }
    }
};
