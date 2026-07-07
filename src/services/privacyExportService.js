import { getFirestoreDeps } from '../firebaseDb';
import { PRIVACY_POLICY_VERSION, TERMS_OF_USE_VERSION } from '../constants/legal';

const EXPORT_SCHEMA_VERSION = 1;

function toSerializable(value) {
    if (value == null) return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(toSerializable);
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, toSerializable(nestedValue)])
        );
    }
    return value;
}

function mapDoc(docSnap) {
    return toSerializable({
        id: docSnap.id,
        ...docSnap.data()
    });
}

async function getDocData(deps, collectionName, docId) {
    const { db, doc, getDoc } = deps;
    const snap = await getDoc(doc(db, collectionName, docId));
    return snap.exists() ? mapDoc(snap) : null;
}

async function getCollectionByField(deps, collectionName, fieldName, value) {
    const { db, collection, query, where, getDocs } = deps;
    const q = query(collection(db, collectionName), where(fieldName, '==', value));
    const snap = await getDocs(q);
    return snap.docs.map(mapDoc);
}

function sortByTimestampDesc(items, fieldName) {
    return [...items].sort((a, b) => {
        const aTime = a?.[fieldName] ? new Date(a[fieldName]).getTime() : 0;
        const bTime = b?.[fieldName] ? new Date(b[fieldName]).getTime() : 0;
        return bTime - aTime;
    });
}

export const privacyExportService = {
    async buildUserDataExport(user) {
        if (!user?.uid) {
            throw new Error('EXPORT_REQUIRES_USER');
        }

        const deps = await getFirestoreDeps();
        const userId = user.uid;

        const [
            profile,
            workoutTemplates,
            workoutSessions,
            activeWorkout,
            studentLinks,
            trainerLinks,
            trainerInvites,
            userStats
        ] = await Promise.all([
            getDocData(deps, 'users', userId),
            getCollectionByField(deps, 'workout_templates', 'userId', userId),
            getCollectionByField(deps, 'workout_sessions', 'userId', userId),
            getDocData(deps, 'active_workouts', userId),
            getCollectionByField(deps, 'trainer_students', 'studentId', userId),
            getCollectionByField(deps, 'trainer_students', 'trainerId', userId),
            getCollectionByField(deps, 'trainer_invites', 'trainerId', userId),
            getDocData(deps, 'user_stats', userId)
        ]);

        return {
            schemaVersion: EXPORT_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            legalVersions: {
                privacyPolicy: PRIVACY_POLICY_VERSION,
                termsOfUse: TERMS_OF_USE_VERSION
            },
            user: {
                uid: user.uid,
                email: user.email || profile?.email || null,
                displayName: user.displayName || profile?.displayName || profile?.fullName || null
            },
            data: {
                profile,
                workoutTemplates: sortByTimestampDesc(workoutTemplates, 'updatedAt'),
                workoutSessions: sortByTimestampDesc(workoutSessions, 'completedAt'),
                activeWorkout,
                trainerStudentLinks: {
                    asStudent: sortByTimestampDesc(studentLinks, 'linkedAt'),
                    asTrainer: sortByTimestampDesc(trainerLinks, 'linkedAt')
                },
                trainerInvites: sortByTimestampDesc(trainerInvites, 'createdAt'),
                userStats
            }
        };
    },

    downloadJson(exportPayload) {
        const safeDate = new Date().toISOString().slice(0, 10);
        const fileName = `vitalita-dados-${safeDate}.json`;
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
            type: 'application/json;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return fileName;
    }
};
