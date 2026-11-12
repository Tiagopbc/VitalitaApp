/**
 * TrainerStudentList.jsx
 * Corpo da área do personal: números (total de alunos), busca e a grade de
 * alunos, com carregando e estado vazio. JSX movido de TrainerDashboard.
 */
import React from 'react';
import { Check, ChevronLeft, UserPlus, Users } from 'lucide-react';
import { Button } from '../design-system/Button';
import { EmptyState } from '../design-system/EmptyState';
import { PremiumCard } from '../design-system/PremiumCard';

export function TrainerStudentList({
    totalStudents,
    loading,
    filteredStudents,
    searchTerm,
    onSearchChange,
    onSelectStudent,
    onInvite
}) {
    return (
        <>
            {/* 2. Grade de Estatísticas (Opcional, mas bom para UX) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <PremiumCard className="p-4 flex items-center gap-4 bg-slate-900/50">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{totalStudents}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase">Total Alunos</p>
                    </div>
                </PremiumCard>
                <PremiumCard className="p-4 flex items-center gap-4 bg-slate-900/50">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <Check size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-slate-500 font-bold uppercase">Treinos Hoje</p>
                    </div>
                </PremiumCard>
                {/* Adicionar mais estatísticas se houver dados reais */}
            </div>

            {/* 3. Busca & Barra de Ferramentas (Ilha Flutuante Moderna) */}
            <div className="mb-6">
                <div className="relative group max-w-md">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <input
                        type="text"
                        placeholder="Buscar aluno por nome..."
                        aria-label="Buscar aluno"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="relative w-full bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500/50 shadow-xl transition-all placeholder:text-slate-600 font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <Users size={18} />
                    </div>
                </div>
            </div>

            {/* 4. Grade de Alunos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center opacity-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
                        <p className="text-slate-500">Carregando alunos...</p>
                    </div>
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                        <PremiumCard
                            key={student.id}
                            onClick={() => onSelectStudent(student)}
                            className="p-5 group hover:border-cyan-500/50 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden bg-slate-900/40"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                                    {student.displayName ? student.displayName.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase">
                                    Ativo
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                {student.displayName || 'Aluno sem nome'}
                            </h3>
                            <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                                <Users size={12} />
                                Desde {student.linkedAt?.toLocaleDateString('pt-BR')}
                            </p>

                            <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ver Perfil</span>
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                                    <ChevronLeft size={16} className="rotate-180" />
                                </div>
                            </div>
                        </PremiumCard>
                    ))
                ) : (
                    <EmptyState
                        className="col-span-full"
                        icon={<Users size={30} />}
                        title="Nenhum aluno encontrado"
                        description={searchTerm
                            ? `Não encontramos ninguém com "${searchTerm}".`
                            : 'Você ainda não tem alunos vinculados.'
                        }
                        action={!searchTerm ? (
                            <Button
                                onClick={onInvite}
                                variant="secondary"
                                size="sm"
                                leftIcon={<UserPlus size={16} />}
                            >
                                Convidar o primeiro
                            </Button>
                        ) : null}
                    />
                )}
            </div>
        </>
    );
}
