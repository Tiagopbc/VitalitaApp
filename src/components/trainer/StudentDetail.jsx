/**
 * StudentDetail.jsx
 * Detalhe de um aluno na área do personal: voltar, desvincular (com
 * confirmação), perfil e as abas Fichas de Treino e Histórico & Evolução, que
 * reaproveitam WorkoutsPage e HistoryPage em modo personal.
 * JSX movido de TrainerDashboard; o estado vem dos hooks em src/hooks/trainer/.
 */
import React from 'react';
import { ChevronLeft, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '../design-system/Button';
import { ConfirmDialog } from '../design-system/ConfirmDialog';
import { SectionHeader } from '../design-system/SectionHeader';
import { notify } from '../../utils/notifyStore';
import HistoryPage from '../../pages/HistoryPage';
import WorkoutsPage from '../../pages/WorkoutsPage';

export function StudentDetail({
    student,
    activeTab,
    onTabChange,
    onBack,
    onNavigateToCreate,
    onRequestUnlink,
    pendingUnlink,
    unlinking,
    onConfirmUnlink,
    onCancelUnlink
}) {
    return (
        <div className="min-h-screen bg-[#020617] relative">
            <div className="sticky top-0 z-30 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 transition-all">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={onBack}
                        className="shrink-0 uppercase font-bold tracking-wider"
                        leftIcon={<ChevronLeft size={16} />}
                    >
                        VOLTAR
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={onRequestUnlink}
                            leftIcon={<Trash2 size={16} />}
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                        >
                            Desvincular
                        </Button>
                    </div>
                </div>
            </div>

            {/* SEÇÃO HERO: Perfil + Abas */}
            <div className="pt-8 pb-2 bg-gradient-to-b from-[#020617] to-[#0f172a]/50">
                {/* Informações de Perfil Centralizadas */}
                <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-2 duration-700 mb-6">
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-cyan-500/20 ring-4 ring-black/50">
                            {student.displayName?.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-[3px] border-[#020617] shadow-sm"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-1">
                        {student.displayName}
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                            Aluno Ativo
                        </span>
                    </div>
                </div>

                {/* Abas em Pílula Modernas - Perto do Nome */}
                <div className="max-w-5xl mx-auto px-4 flex justify-center mb-4">
                    <div className="bg-slate-900/80 backdrop-blur-md p-1 rounded-full inline-flex border border-white/10 shadow-2xl shadow-black/50">
                        <button
                            onClick={() => onTabChange('workouts')}
                            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'workouts'
                                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Fichas de Treino
                        </button>
                        <button
                            onClick={() => onTabChange('history')}
                            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'history'
                                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Histórico & Evolução
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTEÚDO */}
            <div className="p-4 max-w-5xl mx-auto space-y-6">
                {activeTab === 'workouts' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionHeader
                            title="Treinos Atribuídos"
                            icon={<PlusCircle size={18} />}
                            action={(
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => onNavigateToCreate(null)}
                                    leftIcon={<PlusCircle size={18} />}
                                    className="rounded-xl"
                                >
                                    Prescrever Treino
                                </Button>
                            )}
                        />
                        <WorkoutsPage
                            user={student}
                            isTrainerMode={true}
                            onNavigateToCreate={onNavigateToCreate}
                            onNavigateToWorkout={() => notify.info("Modo visualização de Personal: execução desabilitada.")}
                        />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <HistoryPage
                            user={student}
                            onBack={() => { }}
                            isEmbedded={true}
                        />
                    </div>
                )}
            </div>
            <ConfirmDialog
                isOpen={Boolean(pendingUnlink)}
                title="Desvincular aluno?"
                description={`Você vai remover o vínculo com ${pendingUnlink?.displayName || 'este aluno'}. O histórico do aluno será preservado.`}
                confirmLabel="Desvincular"
                loading={unlinking}
                onConfirm={onConfirmUnlink}
                onCancel={onCancelUnlink}
            />
        </div>
    );
}
