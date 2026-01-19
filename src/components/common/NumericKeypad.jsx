import React, { useState, useEffect } from 'react';
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

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto">
            {/* Fundo (Backdrop) */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animateShow ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Container do Teclado */}
            <div
                className={`w-full bg-[#1e293b] rounded-t-[32px] p-6 pb-12 shadow-2xl border-t border-slate-700/50 relative z-10 transition-transform duration-300 ease-out ${animateShow ? 'translate-y-0' : 'translate-y-full'}`}
            >
                {/* Cabeçalho / Display */}
                <div className="flex justify-between items-center mb-6 px-2">
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</span>
                    <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Exibição do Valor */}
                <div className="flex justify-center mb-8">
                    <span className={`text-5xl font-bold tracking-tight ${!value ? 'text-slate-600' : 'text-white'}`}>
                        {value || '0'}
                    </span>
                </div>

                {/* Grade */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handlePress(String(num))}
                            className="h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/80 active:scale-95 transition-all text-2xl font-medium text-slate-200 shadow-sm border border-slate-700/30"
                        >
                            {num}
                        </button>
                    ))}

                    {/* Linha Inferior */}
                    <button
                        onClick={() => handlePress('.')}
                        className="h-16 rounded-2xl bg-slate-800/30 hover:bg-slate-700/50 active:scale-95 transition-all text-2xl font-medium text-slate-200"
                    >
                        .
                    </button>

                    <button
                        onClick={() => handlePress('0')}
                        className="h-16 rounded-2xl bg-slate-800/50 hover:bg-slate-700/80 active:scale-95 transition-all text-2xl font-medium text-slate-200 shadow-sm border border-slate-700/30"
                    >
                        0
                    </button>

                    <button
                        onClick={() => handlePress('backspace')}
                        className="h-16 rounded-2xl bg-slate-800/30 hover:bg-slate-700/50 active:scale-95 transition-all flex items-center justify-center text-slate-400"
                    >
                        <Delete size={24} />
                    </button>
                </div>

                {/* Botão de Confirmar */}
                <button
                    onClick={handleConfirm}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-bold text-lg tracking-wide shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                    <Check size={20} strokeWidth={3} />
                    CONFIRMAR
                </button>
            </div>
        </div>
    );
}
