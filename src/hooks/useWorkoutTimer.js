import { useState, useEffect, useRef } from 'react';

/**
 * Hook para gerenciar cronômetro de treino
 * @param {boolean} running - Se o cronômetro deve estar rodando
 * @param {number} initialSeconds - Segundos iniciais decorridos (padrão 0)
 */
export function useWorkoutTimer(running = true, initialSeconds = 0) {
    const [elapsedSeconds, setElapsedSeconds] = useState(initialSeconds);
    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);

    // Sincronizar com initialSeconds se mudar essencialmente (e.g. carregado de persistência)
    // Mas cuidado para não sobrescrever timer rodando. 
    // Geralmente initialSeconds é relevante apenas na montagem ou reset.
    // Para este caso de uso, confiamos que o componente chame setElapsedSeconds se necessário externamente.

    useEffect(() => {
        if (running) {
            // Em vez de piscar +1 cegamente, calculamos a diferença real de tempo passado.
            // Isso previne que o timer congele caso o Safari/Chrome no celular suspenda a aba.
            // setElapsedSeconds "atual (prev)" já pode ter um valor (se pausou e voltou, ou se o DB carregou x tempo).
            setElapsedSeconds(prev => {
                startTimeRef.current = Date.now() - (prev * 1000);
                return prev;
            });

            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const totalElapsed = Math.floor((now - startTimeRef.current) / 1000);
                setElapsedSeconds(totalElapsed);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [running]);

    // Setter customizado: se o código de fora forçar o tempo (ex: puxar backup da nuvem ou inicial), a base Date muda também
    const handleSetElapsedSeconds = (newVal) => {
        if (typeof newVal === 'function') {
            setElapsedSeconds(prev => {
                const next = newVal(prev);
                startTimeRef.current = Date.now() - (next * 1000);
                return next;
            });
        } else {
            startTimeRef.current = Date.now() - (newVal * 1000);
            setElapsedSeconds(newVal);
        }
    };

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
        setElapsedSeconds: handleSetElapsedSeconds,
        formatTime,
        pause
    };
}
