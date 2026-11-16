import { getFirestoreDeps } from '../firebaseDb';

// Modo em que a execução do treino abre: o último que o aluno escolheu.
const EXECUTION_MODES = ['normal', 'foco'];

function isExecutionMode(value) {
    return EXECUTION_MODES.includes(value);
}

function pickWorkoutPreferences(profile) {
    if (!profile) return {};

    return {
        defaultRestTime: profile.defaultRestTime,
        autoStartTimer: profile.autoStartTimer,
        executionMode: isExecutionMode(profile.executionMode) ? profile.executionMode : undefined
    };
}

export const userPreferencesService = {
    async getWorkoutPreferences(userId) {
        if (!userId) return {};

        const { db, doc, getDoc } = await getFirestoreDeps();
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        return userSnap.exists() ? pickWorkoutPreferences(userSnap.data()) : {};
    },

    async updateWorkoutPreferences(userId, preferences) {
        if (!userId) return;

        const allowedUpdates = {};
        if (Object.prototype.hasOwnProperty.call(preferences, 'defaultRestTime')) {
            allowedUpdates.defaultRestTime = preferences.defaultRestTime;
        }
        if (Object.prototype.hasOwnProperty.call(preferences, 'autoStartTimer')) {
            allowedUpdates.autoStartTimer = preferences.autoStartTimer;
        }
        if (isExecutionMode(preferences.executionMode)) {
            allowedUpdates.executionMode = preferences.executionMode;
        }

        if (Object.keys(allowedUpdates).length === 0) return;

        const { db, doc, setDoc } = await getFirestoreDeps();
        await setDoc(doc(db, 'users', userId), allowedUpdates, { merge: true });
    }
};
