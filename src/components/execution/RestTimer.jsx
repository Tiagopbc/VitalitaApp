/**
 * RestTimer.jsx
 * Modal de cronômetro de descanso interativo com indicador de progresso circular.
 * Suporta play/pause, ajuste de tempo e conclusão em segundo plano (via diferença de timestamp).
 */
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Minus, Plus, Timer } from 'lucide-react';
import { createPortal } from 'react-dom';

export function RestTimer({ initialTime = 90, onComplete, isOpen, onClose, onDurationChange }) {
    const [status, setStatus] = useState('idle'); // ocioso, rodando, pausado, completo
    const [timeLeft, setTimeLeft] = useState(initialTime);

    // Refs para temporização precisa
    const endTimeRef = useRef(null);
    const intervalRef = useRef(null);

    // Aumentei o raio de 52 para 80
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    // Helper de vibração
    const vibrate = (pattern) => {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    // Helper para formatar tempo M:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Inicializar e Início Automático
    useEffect(() => {
        if (isOpen) {
            // Only start if explicitly idle (prevents restart on re-renders)
            if (status === 'idle') {
                setTimeout(() => {
                    setStatus('running');
                    vibrate(50);
                }, 0);
            }
        } else {
            // Reset state when closing, so it's ready for next time
            setTimeout(() => {
                setStatus('idle');
                setTimeLeft(initialTime);
                if (intervalRef.current) clearInterval(intervalRef.current);
            }, 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // Removed initialTime dependency to prevent reset on adjust

    // Lógica do Cronômetro com Correção de Drift
    useEffect(() => {
        if (status === 'running') {
            if (!endTimeRef.current) {
                endTimeRef.current = Date.now() + (timeLeft * 1000);
            } else {
                // If timeLeft changed significantly (manual adjust), we might need to re-sync
                // BUT our adjustTime logic handles endTimeRef update.
            }

            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const remainingRaw = Math.ceil((endTimeRef.current - now) / 1000);
                const remaining = Math.max(0, remainingRaw);

                setTimeLeft(remaining);

                if (remaining <= 0) {
                    setStatus('complete');
                    vibrate([200, 100, 200, 100, 200]);
                    clearInterval(intervalRef.current);
                    endTimeRef.current = null;
                    if (onComplete) onComplete();
                }
            }, 100);
        } else {
            clearInterval(intervalRef.current);
            endTimeRef.current = null;
        }

        return () => clearInterval(intervalRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]); // Removed timeLeft from dependency to avoid loop, though Logic is fine

    const handlePlayPause = () => {
        if (status === 'running') {
            vibrate(10);
            setStatus('paused');
        } else {
            vibrate(30);
            setStatus('running');
        }
    };

    const handleReset = () => {
        vibrate(50);
        setStatus('running'); // Auto-start
        setTimeLeft(initialTime);
        endTimeRef.current = null; // Will be recalculated in useEffect
    };

    const adjustTime = (amount) => {
        // Update Padrao (Global) if handler provided
        if (onDurationChange) {
            const newStandard = Math.max(10, initialTime + amount); // Min 10s default
            onDurationChange(newStandard);
        }

        // Update Current Local Time
        setTimeLeft(prev => {
            const newVal = Math.max(0, prev + amount);
            // Se rodando, precisamos ajustar o endTimeRef
            if (status === 'running') {
                endTimeRef.current = Date.now() + (newVal * 1000);
            }
            return newVal;
        });

        if (status === 'complete' && timeLeft + amount > 0) {
            setStatus('idle');
        }
    };

    const progressOffset = circumference - (timeLeft / initialTime) * circumference;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            {/* Cartão Principal */}
            <div className="w-full max-w-[340px] bg-[#020617] rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col items-center"
                onClick={e => e.stopPropagation()}>

                {/* Cabeçalho */}
                <div className="pt-8 pb-4">
                    <div className="flex items-center gap-2 text-white/90">
                        <Timer size={16} className="text-cyan-400" />
                        <span className="text-sm font-medium tracking-wide">Tempo de Descanso</span>
                    </div>
                </div>

                {/* Display Circular do Cronômetro */}
                <div className="relative my-6">
                    {/* Círculo SVG */}
                    <svg className="w-64 h-64 transform -rotate-90 drop-shadow-2xl">
                        {/* Trilho de Fundo */}
                        <circle
                            cx="128"
                            cy="128"
                            r={radius}
                            stroke="#1e293b"
                            strokeWidth="6"
                            fill="transparent"
                        />
                        {/* Progresso */}
                        <circle
                            cx="128"
                            cy="128"
                            r={radius}
                            stroke={status === 'complete' ? '#22c55e' : '#06b6d4'}
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={progressOffset}
                            strokeLinecap="round"
                            className="transition-all duration-300 ease-linear"
                            style={{ filter: status === 'running' ? 'drop-shadow(0 0 8px rgba(6,182,212,0.5))' : 'none' }}
                        />
                    </svg>

                    {/* Texto de Tempo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-5xl font-bold tracking-tighter ${status === 'complete' ? 'text-emerald-400' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>

                {/* Área de Controles */}
                <div className="w-full px-6 pb-8 flex flex-col items-center gap-6">
                    {/* Play/Reset */}
                    <div className="flex items-center gap-5">
                        <button
                            onClick={handlePlayPause}
                            className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg hover:scale-105 active:scale-95
                                ${status === 'running'
                                    ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                    : status === 'complete'
                                        ? 'bg-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                        : 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]'}`}
                        >
                            {status === 'running' ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            onClick={handleReset}
                            className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                        >
                            <RotateCcw size={22} />
                        </button>
                    </div>

                    {/* Ajustar Tempo */}
                    <div className="flex items-center gap-3 bg-[#0f172a] p-1.5 rounded-2xl border border-slate-800/60 shadow-inner">
                        <button
                            onClick={() => adjustTime(-10)}
                            className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                        >
                            <Minus size={18} />
                        </button>
                        <span className="text-xs font-semibold text-slate-400 px-2 min-w-[80px] text-center">
                            Padrão: {formatTime(initialTime)}
                        </span>
                        <button
                            onClick={() => adjustTime(10)}
                            className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-95"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Botão Fechar */}
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-[#1e293b] text-slate-300 font-bold tracking-wide hover:bg-slate-700 hover:text-white transition-all active:scale-98 text-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return createPortal(modalContent, document.body);
}
