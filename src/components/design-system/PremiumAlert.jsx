/**
 * PremiumAlert.jsx
 * Componente modal de alerta personalizado substituindo alertas nativos.
 * Suporta diferentes tipos (danger, warning, info) com estilos variados.
 */
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function PremiumAlert({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Continuar',
    cancelText = 'Cancelar',
    type = 'danger' // 'danger' | 'info' | 'warning'
}) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            icon: 'text-red-500',
            bgIcon: 'bg-red-500/10',
            button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
            border: 'border-red-500/30'
        },
        warning: {
            icon: 'text-amber-500',
            bgIcon: 'bg-amber-500/10',
            button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
            border: 'border-amber-500/30'
        },
        info: {
            icon: 'text-cyan-500',
            bgIcon: 'bg-cyan-500/10',
            button: 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/20',
            border: 'border-cyan-500/30'
        }
    }[type];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Fundo (Backdrop) */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-sm bg-[#0f172a] border ${colors.border} rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${colors.bgIcon} flex items-center justify-center ${colors.icon} mb-2`}>
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-xl font-bold text-white">
                        {title}
                    </h3>

                    <p className="text-slate-400 text-sm leading-relaxed">
                        {description}
                    </p>

                    <div className="flex gap-3 w-full mt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800 transition-all text-sm uppercase tracking-wider"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onConfirm) onConfirm();
                                onClose();
                            }}
                            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all text-sm uppercase tracking-wider shadow-lg ${colors.button}`}
                            style={{ cursor: 'pointer' }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
