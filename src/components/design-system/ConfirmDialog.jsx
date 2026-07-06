import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
    loading = false,
    onConfirm,
    onCancel
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div className="w-full max-w-sm rounded-3xl border border-slate-700/70 bg-slate-950 p-5 shadow-2xl">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-300 ring-1 ring-red-500/25">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h2 id="confirm-dialog-title" className="text-base font-bold text-white">
                                {title}
                            </h2>
                            {description && (
                                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                        aria-label={cancelLabel}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-xl"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        loading={loading}
                        className="rounded-xl"
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
