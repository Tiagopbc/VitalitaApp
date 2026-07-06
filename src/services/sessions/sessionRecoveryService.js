import { safeGetJSON, safeRemoveItem, safeSetJSON } from '../../utils/storage';

export const SESSION_SYNC_STATES = {
    idle: 'idle',
    loading: 'loading',
    active: 'active',
    offline: 'offline',
    syncing: 'syncing',
    saved: 'saved',
    syncFailed: 'sync_failed',
    finishing: 'finishing',
    finished: 'finished',
    discarding: 'discarding',
    discarded: 'discarded',
    conflict: 'conflict',
    error: 'error'
};

const CLOUD_SYNC_ELAPSED_BUCKET_SECONDS = 30;

export function createSessionBackupKey(userId, workoutId) {
    if (!userId || !workoutId) return null;
    return `workout_backup_${userId}_${workoutId}`;
}

export function readSessionBackup(backupKey) {
    if (!backupKey) return null;
    const parsed = safeGetJSON(backupKey);
    if (!parsed || !Array.isArray(parsed.exercises)) return null;
    return parsed;
}

export function writeSessionBackup(backupKey, payload) {
    if (!backupKey) return;
    safeSetJSON(backupKey, {
        ...payload,
        timestamp: Date.now()
    });
}

export function removeSessionBackup(backupKey) {
    if (!backupKey) return;
    safeRemoveItem(backupKey);
}

export function getTimestampMs(raw) {
    if (!raw) return 0;
    if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? 0 : raw.getTime();
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
    if (typeof raw === 'string') {
        const parsed = Date.parse(raw);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof raw.toMillis === 'function') return raw.toMillis();
    if (typeof raw.toDate === 'function') {
        const date = raw.toDate();
        return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
    }
    if (typeof raw.seconds === 'number') return raw.seconds * 1000;
    return 0;
}

export function getAdjustedElapsed(elapsed, savedTimestamp) {
    const baseElapsed = Number(elapsed) || 0;
    const timestampMs = getTimestampMs(savedTimestamp);
    if (!timestampMs) return baseElapsed;

    const diff = Math.floor((Date.now() - timestampMs) / 1000);
    if (diff > 0 && diff < 43200) {
        return baseElapsed + diff;
    }
    return baseElapsed;
}

function fingerprintDrops(drops) {
    if (!Array.isArray(drops)) return '';
    return drops
        .map(drop => [
            drop.id || '',
            drop.completed ? 1 : 0,
            drop.weight || '',
            drop.reps || '',
            drop.weightMode || 'total',
            drop.baseWeight || ''
        ].join(':'))
        .join(',');
}

function fingerprintExercises(exercises) {
    if (!Array.isArray(exercises)) return '';
    return exercises
        .map(exercise => {
            const sets = Array.isArray(exercise.sets)
                ? exercise.sets.map(set => [
                    set.id || '',
                    set.completed ? 1 : 0,
                    set.weight || '',
                    set.reps || '',
                    set.weightMode || 'total',
                    set.baseWeight || '',
                    fingerprintDrops(set.drops)
                ].join(':')).join(';')
                : '';

            return [
                exercise.id || '',
                exercise.name || '',
                exercise.notes || '',
                sets
            ].join('|');
        })
        .join('||');
}

export function createSessionFingerprint(exercises, elapsedSeconds = 0) {
    const elapsedBucket = Math.floor((Number(elapsedSeconds) || 0) / CLOUD_SYNC_ELAPSED_BUCKET_SECONDS);
    return `${elapsedBucket}::${fingerprintExercises(exercises)}`;
}

function countCompletedSets(exercises) {
    if (!Array.isArray(exercises)) return { completedSets: 0, totalSets: 0 };

    return exercises.reduce((acc, exercise) => {
        const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
        return {
            completedSets: acc.completedSets + sets.filter(set => set.completed).length,
            totalSets: acc.totalSets + sets.length
        };
    }, { completedSets: 0, totalSets: 0 });
}

function createRecoveryCandidate(source, exercises, elapsedSeconds, timestampMs) {
    const setCounts = countCompletedSets(exercises);
    return {
        source,
        exercises,
        elapsedSeconds,
        timestampMs,
        ...setCounts
    };
}

export function chooseSessionRecoverySource({ cloudData, localBackupData }) {
    const hasCloud = Boolean(cloudData?.exercises);
    const hasLocal = Boolean(localBackupData?.exercises);
    if (!hasCloud && !hasLocal) return null;

    const cloudTimestampMs = getTimestampMs(cloudData?.updatedAt);
    const localTimestampMs = getTimestampMs(localBackupData?.timestamp);
    const cloudElapsed = hasCloud ? getAdjustedElapsed(cloudData.elapsedSeconds || 0, cloudTimestampMs) : 0;
    const localElapsed = hasLocal ? getAdjustedElapsed(localBackupData.elapsedSeconds || 0, localTimestampMs) : 0;
    const cloudCandidate = hasCloud
        ? createRecoveryCandidate('cloud', cloudData.exercises, cloudElapsed, cloudTimestampMs)
        : null;
    const localCandidate = hasLocal
        ? createRecoveryCandidate('local', localBackupData.exercises, localElapsed, localTimestampMs)
        : null;

    if (hasCloud && hasLocal) {
        const localWinsByTime = localTimestampMs && cloudTimestampMs
            ? localTimestampMs > cloudTimestampMs
            : localElapsed > cloudElapsed;
        const source = localWinsByTime ? 'local' : 'cloud';
        const selectedCandidate = source === 'local' ? localCandidate : cloudCandidate;
        return {
            source,
            conflict: true,
            elapsedSeconds: selectedCandidate.elapsedSeconds,
            exercises: selectedCandidate.exercises,
            candidates: {
                cloud: cloudCandidate,
                local: localCandidate
            }
        };
    }

    if (hasLocal) {
        return {
            source: 'local',
            conflict: false,
            elapsedSeconds: localCandidate.elapsedSeconds,
            exercises: localCandidate.exercises,
            candidates: {
                local: localCandidate
            }
        };
    }

    return {
        source: 'cloud',
        conflict: false,
        elapsedSeconds: cloudCandidate.elapsedSeconds,
        exercises: cloudCandidate.exercises,
        candidates: {
            cloud: cloudCandidate
        }
    };
}
