/**
 * FinishingSessionOverlay.jsx
 * Tela de "Finalizando" enquanto a sessão é salva ao concluir o treino.
 * JSX movido de WorkoutExecutionPage.
 */
import React from 'react';

export function FinishingSessionOverlay() {
    return (
        <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-300 text-white">
            <div className="h-16 w-16 mb-6 rounded-full border-[3px] border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <h3 className="text-xl font-bold tracking-widest text-cyan-400 mb-2 uppercase">Finalizando</h3>
            <p className="text-slate-400 text-sm font-medium animate-pulse">Salvando o seu esforço de hoje...</p>
        </div>
    );
}
