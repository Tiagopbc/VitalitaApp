/**
 * useJournal.js
 * Aba Diário do histórico: sessões paginadas pelo Firestore, janela de
 * renderização progressiva (performanceTuning), agrupamento por mês, sentinela
 * de scroll e métrica de render. Lógica movida de HistoryPage (D16).
 *
 * O carregamento inicial não mora mais num efeito: a página chama
 * `loadJournal(true)` ao abrir a aba. Antes, o efeito dependia da identidade
 * de `loadJournal`, que muda a cada troca de `loadingSessions`, e com o diário
 * vazio isso refazia a busca em laço.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { workoutService } from '../../services/workoutService';
import { getJournalWindowConfig, recordJournalRenderMetric } from '../../utils/performanceTuning';

export function useJournal({ user, active }) {
    const journalWindowConfig = useMemo(() => getJournalWindowConfig(), []);
    const [sessions, setSessions] = useState([]);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const lastDocJournalRef = useRef(null);
    const [hasMoreJournal, setHasMoreJournal] = useState(false);
    const [visibleJournalCount, setVisibleJournalCount] = useState(journalWindowConfig.initial);
    const journalRenderSentinelRef = useRef(null);

    const loadJournal = useCallback(async (reset = false) => {
        if (!user) return;
        if (loadingSessions) return; // Prevent double load
        if (reset) setLoadingSessions(true);
        else setFetchingMore(true);
        try {
            const startDoc = reset ? null : lastDocJournalRef.current;
            const result = await workoutService.getHistory(user.uid, null, startDoc, 20);

            const loadedSessions = result.data.map(data => ({
                id: data.id,
                ...data,
                completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : (data.completedAt ? new Date(data.completedAt) : null),
                duration: data.duration || '0min',
                exercisesCount: data.exercises ? data.exercises.length : 0
            }));

            if (reset) {
                setSessions(loadedSessions);
                setVisibleJournalCount(Math.min(journalWindowConfig.initial, loadedSessions.length));
            } else {
                setSessions(prev => [...prev, ...loadedSessions]);
            }

            lastDocJournalRef.current = result.lastDoc;
            setHasMoreJournal(result.hasMore);

        } catch (err) {
            console.error("Error fetching sessions:", err);
        } finally {
            setLoadingSessions(false);
            setFetchingMore(false);
        }
    }, [journalWindowConfig.initial, user, loadingSessions]);

    const visibleSessions = useMemo(
        () => sessions.slice(0, visibleJournalCount),
        [sessions, visibleJournalCount]
    );

    const groupedSessions = useMemo(() => {
        if (!visibleSessions.length) return {};
        const groups = {};
        visibleSessions.forEach(session => {
            if (!session.completedAt) return;
            const date = session.completedAt;
            const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const formatted = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

            if (!groups[formatted]) groups[formatted] = [];
            groups[formatted].push(session);
        });
        return groups;
    }, [visibleSessions]);

    const hasLocallyHiddenSessions = sessions.length > visibleJournalCount;

    const revealMoreRenderedSessions = useCallback(() => {
        setVisibleJournalCount((prev) => Math.min(prev + journalWindowConfig.step, sessions.length));
    }, [journalWindowConfig.step, sessions.length]);

    useEffect(() => {
        if (!active) return;
        if (visibleSessions.length === 0) return;
        if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
        if (typeof performance === 'undefined' || typeof performance.now !== 'function') return;

        const start = performance.now();
        let raf2 = null;
        const raf1 = window.requestAnimationFrame(() => {
            raf2 = window.requestAnimationFrame(() => {
                const elapsed = performance.now() - start;
                recordJournalRenderMetric(elapsed);
            });
        });

        return () => {
            window.cancelAnimationFrame(raf1);
            if (raf2 !== null) {
                window.cancelAnimationFrame(raf2);
            }
        };
    }, [active, visibleSessions.length]);

    useEffect(() => {
        if (!active || !hasLocallyHiddenSessions) return;
        if (typeof IntersectionObserver === 'undefined') return;

        const sentinel = journalRenderSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver((entries) => {
            const shouldReveal = entries.some((entry) => entry.isIntersecting);
            if (shouldReveal) {
                revealMoreRenderedSessions();
            }
        }, {
            root: null,
            rootMargin: '240px 0px',
            threshold: 0.01
        });

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [active, hasLocallyHiddenSessions, revealMoreRenderedSessions]);

    return {
        sessions,
        groupedSessions,
        loadingSessions,
        fetchingMore,
        hasMoreJournal,
        hasLocallyHiddenSessions,
        loadJournal,
        revealMoreRenderedSessions,
        journalRenderSentinelRef
    };
}
