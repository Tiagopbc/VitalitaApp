import { Button } from '../design-system/Button';

/**
 * Modal de confirmação para finalizar o treino. Mantido como componente
 * local (o ConfirmDialog do design system não reproduz 1:1 este layout,
 * variante de sucesso e animação) — a troca fica para PR separado.
 */
export function ConfirmFinishModal({ onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xs bg-[#0f172a] border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-white mb-2">Finalizar Treino?</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Tem certeza que deseja encerrar o treino agora? Certifique-se de que registrou todas as séries.
                </p>
                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="flex-1 h-10 text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                        Voltar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant="success"
                        className="flex-1 h-10 bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 shadow-none hover:shadow-none"
                    >
                        Confirmar
                    </Button>
                </div>
            </div>
        </div>
    );
}
