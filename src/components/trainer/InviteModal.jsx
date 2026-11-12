/**
 * InviteModal.jsx
 * Modal com o código de convite do personal: copiar, ver a validade e gerar um
 * código novo. JSX movido de TrainerDashboard; o estado vem de useTrainerInvite.
 */
import React from 'react';
import { Check, Copy, RotateCw, UserPlus, X } from 'lucide-react';
import { Button } from '../design-system/Button';

export function InviteModal({ invite, inviteCode, inviteLoading, copied, onCopy, onGenerate, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#0f172a] border border-slate-700/50 rounded-3xl w-full max-w-sm p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                {/* Header com gradiente sutil */}
                <div className="p-6 pb-2 relative flex flex-col items-center text-center">
                    <button
                        aria-label="Fechar"
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <UserPlus size={30} className="text-white ml-0.5" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Convidar Aluno</h2>
                    <p className="text-slate-400 text-[13px] leading-relaxed max-w-[260px] mx-auto">
                        Envie este código para seu aluno vincular a conta em <span className="text-slate-300 font-semibold">Perfil &gt; Vincular Personal</span>.
                    </p>
                </div>

                {/* Corpo com o Código */}
                <div className="px-6 py-2">
                    <div className="bg-[#020617] border border-slate-800 rounded-xl p-1.5 flex items-center relative group">
                        <div className="flex-1 text-center font-mono text-base font-bold text-cyan-400 tracking-widest px-2 py-3 break-all">
                            {inviteLoading ? 'GERANDO...' : inviteCode || 'SEM CODIGO'}
                        </div>
                        <button
                            onClick={onCopy}
                            disabled={!inviteCode || inviteLoading}
                            className={`shrink-0 p-3 rounded-lg font-bold transition-all duration-300 border border-transparent ${copied
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                }`}
                            title="Copiar código"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                    {copied && (
                        <p className="text-center text-xs text-green-400 mt-2 font-medium animate-in fade-in">
                            Código copiado!
                        </p>
                    )}
                    {invite?.expiresAt && (
                        <p className="text-center text-[11px] text-slate-500 mt-2">
                            Expira em {invite.expiresAt.toLocaleDateString('pt-BR')} às {invite.expiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>

                {/* Footer (Botão Fechar) - Usando estilo de botão sólido e largo */}
                <div className="p-6 mt-2 space-y-3">
                    <Button
                        onClick={onGenerate}
                        disabled={inviteLoading}
                        variant="secondary"
                        className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 tracking-wide uppercase text-xs"
                        leftIcon={<RotateCw size={16} />}
                    >
                        {inviteLoading ? 'Gerando...' : 'Gerar novo código'}
                    </Button>
                    <Button
                        onClick={onClose}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 tracking-wide uppercase text-xs"
                    >
                        Entendi, Fechar
                    </Button>
                </div>
            </div>
        </div>
    );
}
