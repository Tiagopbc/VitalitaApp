/**
 * useGlobalSessions.js
 * Cache das sessões usadas pela busca global da aba Evolução, com "carregar
 * mais" e a lista de exercícios do usuário derivada dele.
 *
 * O cache guarda o uid de quem o preencheu: se o usuário atual é outro, o
 * cache vale como vazio. Isso substitui o efeito que zerava o cache quando o
 * uid mudava (um dos warnings set-state-in-effect do D16).
 */
import { useCallback, useMemo, useState } from 'react';
import { SESSION_LIMITS, workoutService } from '../../services/workoutService';
import { extractExerciseNamesFromSessions } from './historyRows';

const VAZIO = { docs: null, lastDoc: null, hasMore: false };

export function useGlobalSessions(user) {
    const uid = user?.uid;
    const [cache, setCache] = useState({ uid, ...VAZIO });
    const atual = cache.uid === uid ? cache : { uid, ...VAZIO };
    const [loadingMore, setLoadingMore] = useState(false);

    const allUserExercises = useMemo(
        () => (atual.docs ? extractExerciseNamesFromSessions(atual.docs) : []),
        [atual.docs]
    );

    /** Primeira página, vinda da busca da aba Evolução. */
    const primeCache = useCallback((result) => {
        setCache({ uid, docs: result.data, lastDoc: result.lastDoc, hasMore: result.hasMore });
    }, [uid]);

    const loadMore = useCallback(async () => {
        if (!user || loadingMore || !atual.hasMore) return;

        setLoadingMore(true);
        try {
            const result = await workoutService.getHistory(
                user.uid,
                null,
                atual.lastDoc,
                SESSION_LIMITS.analyticsGlobalPage
            );
            setCache((prev) => {
                const base = prev.uid === uid ? prev : { uid, ...VAZIO };
                return {
                    uid,
                    docs: [...(base.docs || []), ...result.data],
                    lastDoc: result.lastDoc,
                    hasMore: result.hasMore
                };
            });
        } catch (err) {
            console.error("Error loading more global history:", err);
        } finally {
            setLoadingMore(false);
        }
    }, [user, uid, loadingMore, atual.hasMore, atual.lastDoc]);

    return {
        globalSessions: atual.docs,
        hasMoreGlobalSessions: atual.hasMore,
        loadingMoreGlobalSessions: loadingMore,
        allUserExercises,
        loadMoreGlobalSessions: loadMore,
        primeGlobalSessions: primeCache
    };
}
