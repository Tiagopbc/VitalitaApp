import { Button } from '../design-system/Button';

/**
 * Modal de vinculação de personal trainer. O código é normalizado para
 * maiúsculas antes de subir via `onInviteCodeChange`.
 */
export function LinkTrainerModal({ inviteCode, linking, onInviteCodeChange, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <h2 className="text-lg font-bold text-white mb-4">Vincular Personal</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-300 font-bold uppercase">Código de convite</label>
                        <input
                            type="text"
                            className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 text-white mt-1 focus:border-cyan-500 outline-none font-mono text-sm placeholder:text-slate-500"
                            placeholder="Cole o código recebido..."
                            value={inviteCode}
                            onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase())}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Peça um convite ativo para seu treinador.</p>
                    </div>
                    <Button
                        onClick={onConfirm}
                        loading={linking}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 rounded-xl"
                    >
                        Confirmar Vínculo
                    </Button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm text-slate-400 hover:text-white font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
