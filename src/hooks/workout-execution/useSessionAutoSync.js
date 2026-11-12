/**
 * useSessionAutoSync.js
 * Mantém a sessão salva enquanto o treino está aberto: ajusta o cronômetro ao
 * tempo já decorrido quando a sessão carrega e sincroniza a cada mudança de
 * séries ou de tempo, até o treino terminar. Efeitos movidos de
 * WorkoutExecutionPage sem mudança.
 */
import { useEffect } from 'react';

export function useSessionAutoSync({ loading, exercises, isFinished, initialElapsed, elapsedSeconds, setElapsedSeconds, syncSession }) {
    // Sincronizar tempo decorrido do hook quando carregado
    useEffect(() => {
        if (initialElapsed > 0 && elapsedSeconds === 0) {
            setElapsedSeconds(initialElapsed);
        }
    }, [initialElapsed, elapsedSeconds, setElapsedSeconds]);

    // Efeito de Sincronização Contínua
    useEffect(() => {
        if (!loading && exercises.length > 0 && !isFinished) {
            syncSession(exercises, elapsedSeconds);
        }
    }, [exercises, elapsedSeconds, loading, isFinished, syncSession]);
}
