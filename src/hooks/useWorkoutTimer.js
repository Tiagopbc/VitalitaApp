import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage workout timer
 * @param {boolean} running - Whether the timer should be running
 * @param {number} initialSeconds - Initial elapsed seconds (default 0)
 */
export function useWorkoutTimer(running = true, initialSeconds = 0) {
    const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
    const intervalRef = useRef(null);

    // Sync with initialSeconds if it changes essentially (e.g. loaded from persistence)
    // But be careful not to overwrite running timer. 
    // Usually initialSeconds is only relevant on mount or reset.
    // For this use case, we trust the component to call setElapsedSeconds if needed externally.

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running]);

    // Manual controls if needed
    const pause = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return {
        elapsedSeconds,
        setElapsedSeconds,
        formatTime,
        pause
    };
}
