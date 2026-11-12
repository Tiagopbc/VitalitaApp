/**
 * PdfImportPanel.jsx
 * Botão de importar a ficha de um PDF (só na criação, com a flag ligada) e a
 * faixa "Treino N de M" enquanto a fila de revisão tem mais de um treino.
 * JSX movido de CreateWorkoutPage (D18); o estado vem de usePdfImportQueue.
 */
import React from 'react';
import { FileUp } from 'lucide-react';
import { Button } from '../design-system/Button';

export function PdfImportPanel({ canImport, importQueue, importing, inputRef, onFileSelected }) {
    return (
        <>
            {/* Importar ficha de um PDF (IA lê e preenche; o usuário revisa aqui mesmo) */}
            {canImport && !importQueue && (
                <div className="mb-6">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={onFileSelected}
                    />
                    <Button
                        variant="secondary"
                        fullWidth
                        loading={importing}
                        disabled={importing}
                        onClick={() => inputRef.current?.click()}
                        leftIcon={<FileUp size={18} />}
                        className="border-dashed border-slate-600/50 bg-slate-900/30 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 h-14"
                    >
                        {importing ? 'Lendo o PDF...' : 'Importar treino de um PDF'}
                    </Button>
                    <p className="mt-2 text-center text-xs text-slate-500">
                        A ficha do personal é lida automaticamente. Você confere tudo antes de salvar.
                    </p>
                </div>
            )}

            {/* Progresso da revisão em fila, quando o PDF trouxe mais de um treino */}
            {importQueue && importQueue.workouts.length > 1 && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                    <FileUp size={18} className="shrink-0 text-cyan-400" />
                    <div className="min-w-0 text-sm">
                        <span className="font-semibold text-cyan-300">
                            Treino {importQueue.index + 1} de {importQueue.workouts.length}
                        </span>
                        <span className="text-slate-400"> — revise e salve; o próximo aparece em seguida.</span>
                    </div>
                </div>
            )}
        </>
    );
}
