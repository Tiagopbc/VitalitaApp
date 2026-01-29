import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Delete, Check, X } from 'lucide-react';

export function NumericKeypad({ isOpen, onClose, onConfirm, initialValue = '', title = '' }) {
    const [value, setValue] = useState(initialValue);
    const [animateShow, setAnimateShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const newVal = initialValue ? String(initialValue) : '';
            if (value !== newVal) setValue(newVal); // eslint-disable-line react-hooks/set-state-in-effect
            // Pequeno atraso para gatilho da animação
            requestAnimationFrame(() => setAnimateShow(true));
        } else {
            setAnimateShow(false);
        }
    }, [isOpen, initialValue]);

    const handlePress = (key) => {
        if (key === 'backspace') {
            setValue(prev => prev.slice(0, -1));
        } else if (key === '.') {
            if (!value.includes('.')) {
                setValue(prev => prev + '.');
            }
        } else {
            // Prevenir comprimento absurdo
            if (value.length < 6) {
                setValue(prev => prev + key);
            }
        }
    };

    const handleConfirm = () => {
        onConfirm(value || ''); // Enviar string vazia se limpo
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end pointer-events-auto">
            {/* Fundo (Backdrop) */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animateShow ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Container do Teclado */}
            <div
                className={`w-full max-w-2xl mx-auto bg-[#0f172a] rounded-t-[32px] md:rounded-3xl md:mb-6 p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-slate-800 relative z-10 transition-transform duration-300 ease-out ${animateShow ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Cabeçalho / Display */}
                <div className="flex justify-between items-center mb-6 px-2">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</span>
                    <button onClick={onClose} className="p-2 bg-slate-800/50 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Exibição do Valor */}
                <div className="flex justify-center mb-8">
                    <span className={`text-6xl font-bold tracking-tight ${!value || value === '0.0' ? 'text-slate-400' : 'text-white'}`}>
                        {value || '0'}
                    </span>
                </div>

                {/* Grade */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handlePress(String(num))}
                            className="h-[72px] rounded-2xl bg-slate-800 border border-slate-700/50 hover:bg-slate-700 active:bg-slate-700 active:scale-95 transition-all text-3xl font-semibold text-white shadow-lg shadow-black/20"
                        >
                            {num}
                        </button>
                    ))}

                    {/* Linha Inferior */}
                    <button
                        onClick={() => handlePress('.')}
                        className="h-[72px] rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 transition-all text-3xl font-bold text-slate-400 pb-4"
                    >
                        .
                    </button>

                    <button
                        onClick={() => handlePress('0')}
                        className="h-[72px] rounded-2xl bg-slate-800 border border-slate-700/50 hover:bg-slate-700 active:bg-slate-700 active:scale-95 transition-all text-3xl font-semibold text-white shadow-lg shadow-black/20"
                    >
                        0
                    </button>

                    <button
                        onClick={() => handlePress('backspace')}
                        className="h-[72px] rounded-2xl bg-slate-900 border border-slate-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 active:scale-95 transition-all flex items-center justify-center text-slate-400"
                    >
                        <Delete size={28} />
                    </button>
                </div>

                {/* Botão de Confirmar */}
                <button
                    onClick={handleConfirm}
                    className="w-full h-16 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl text-white font-bold text-xl tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                    <Check size={24} strokeWidth={3} />
                    CONFIRMAR
                </button>
            </div>
        </div>,
        document.body
    );
}
