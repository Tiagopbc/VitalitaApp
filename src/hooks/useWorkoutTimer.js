import { useState, useEffect, useRef } from 'react';

/**
 * Hook para gerenciar cronômetro de treino
 * @param {boolean} running - Se o cronômetro deve estar rodando
 * @param {number} initialSeconds - Segundos iniciais decorridos (padrão 0)
 */
export function useWorkoutTimer(running = true, initialSeconds = 0) {
    const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
    const intervalRef = useRef(null);

    // Sincronizar com initialSeconds se mudar essencialmente (e.g. carregado de persistência)
    // Mas cuidado para não sobrescrever timer rodando. 
    // Geralmente initialSeconds é relevante apenas na montagem ou reset.
    // Para este caso de uso, confiamos que o componente chame setElapsedSeconds se necessário externamente.

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

    // Controles manuais se necessário
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
