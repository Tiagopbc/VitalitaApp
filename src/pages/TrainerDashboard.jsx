import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Copy, Check, ChevronLeft, PlusCircle, Trash2, X, RotateCw } from 'lucide-react';
import { getFirestoreDeps } from '../firebaseDb';
import { Button } from '../components/design-system/Button';
import { ConfirmDialog } from '../components/design-system/ConfirmDialog';
import { EmptyState } from '../components/design-system/EmptyState';
import { PageHeader } from '../components/design-system/PageHeader';
import { PremiumCard } from '../components/design-system/PremiumCard';
import { SectionHeader } from '../components/design-system/SectionHeader';
import { toast } from 'sonner';

import HistoryPage from './HistoryPage';
import WorkoutsPage from './WorkoutsPage';

export function TrainerDashboard({ user, onBack, onNavigateToCreateWorkout }) {
    const [students, setStudents] = useState([]);
    const [invite, setInvite] = useState(null);
    const [inviteCode, setInviteCode] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Estados de UI
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [studentPendingUnlink, setStudentPendingUnlink] = useState(null);
    const [unlinking, setUnlinking] = useState(false);

    // Estado de Seleção
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('workouts'); // 'workouts' ou 'history'

    const fetchStudents = React.useCallback(async () => {
        if (!user) return;
        try {
            const { db, collection, query, where, getDocs, getDoc, doc } = await getFirestoreDeps();
            const q = query(
                collection(db, 'trainer_students'),
                where('trainerId', '==', user.uid)
            );
            const snap = await getDocs(q);
            const loadedStudents = [];

            for (const d of snap.docs) {
                const data = d.data();
                const userDoc = await getDoc(doc(db, 'users', data.studentId));
                if (userDoc.exists()) {
                    loadedStudents.push({
                        id: userDoc.id,
                        ...userDoc.data(),
                        uid: userDoc.id,
                        linkedAt: data.linkedAt?.toDate()
                    });
                }
            }
            setStudents(loadedStudents);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchInviteCode = React.useCallback(async () => {
        if (!user) return;
        setInviteLoading(true);
        try {
            const { userService } = await import('../services/userService');
            const activeInvite = await userService.ensureActiveTrainerInvite(user.uid);
            setInvite(activeInvite);
            setInviteCode(activeInvite?.code || '');
        } catch (error) {
            console.error("Error fetching trainer invite:", error);
            setInvite(null);
            setInviteCode('');
        } finally {
            setInviteLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchStudents();
        fetchInviteCode();
    }, [user, fetchStudents, fetchInviteCode]);



    const copyToClipboard = () => {
        if (!inviteCode) return;
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGenerateInvite = async () => {
        if (!user) return;
        setInviteLoading(true);
        setCopied(false);
        try {
            const { userService } = await import('../services/userService');
            const newInvite = await userService.createTrainerInvite(user.uid);
            setInvite(newInvite);
            setInviteCode(newInvite?.code || '');
        } catch (error) {
            console.error("Error creating trainer invite:", error);
            toast.error("Erro ao gerar convite.");
        } finally {
            setInviteLoading(false);
        }
    };

    const confirmUnlink = async () => {
        if (!studentPendingUnlink) return;
        setUnlinking(true);
        try {
            const { userService } = await import('../services/userService');
            await userService.unlinkTrainer(studentPendingUnlink.id, user.uid);
            await fetchStudents();
            toast.success("Aluno desvinculado.");
            setSelectedStudent(null);
            setStudentPendingUnlink(null);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao desvincular aluno.");
        } finally {
            setUnlinking(false);
        }
    };

    const handleNavigateToCreate = (workoutToEdit, contextOverride = {}) => {
        onNavigateToCreateWorkout(workoutToEdit, {
            targetUserId: selectedStudent.uid,
            targetUserName: selectedStudent.displayName,
            ...contextOverride
        });
    };

    // Alunos Filtrados
    const filteredStudents = students.filter(s =>
        s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- RENDERIZAR VISÃO DETALHADA DO ALUNO ---
    if (selectedStudent) {
        return (
            <div className="min-h-screen bg-[#020617] relative">
                <div className="sticky top-0 z-30 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 transition-all">
                    <div className="flex items-center justify-between max-w-5xl mx-auto">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setSelectedStudent(null)}
                            className="shrink-0 uppercase font-bold tracking-wider"
                            leftIcon={<ChevronLeft size={16} />}
                        >
                            VOLTAR
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setStudentPendingUnlink(selectedStudent)}
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
                                {selectedStudent.displayName?.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-[3px] border-[#020617] shadow-sm"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-white text-center mb-1">
                            {selectedStudent.displayName}
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
                                onClick={() => setActiveTab('workouts')}
                                className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'workouts'
                                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Fichas de Treino
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
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
                                        onClick={() => handleNavigateToCreate(null)}
                                        leftIcon={<PlusCircle size={18} />}
                                        className="rounded-xl"
                                    >
                                        Prescrever Treino
                                    </Button>
                                )}
                            />
                            <WorkoutsPage
                                user={selectedStudent}
                                isTrainerMode={true}
                                onNavigateToCreate={handleNavigateToCreate}
                                onNavigateToWorkout={() => toast.info("Modo visualização de Personal: execução desabilitada.")}
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <HistoryPage
                                user={selectedStudent}
                                onBack={() => { }}
                                isEmbedded={true}
                            />
                        </div>
                    )}
                </div>
                <ConfirmDialog
                    isOpen={Boolean(studentPendingUnlink)}
                    title="Desvincular aluno?"
                    description={`Você vai remover o vínculo com ${studentPendingUnlink?.displayName || 'este aluno'}. O histórico do aluno será preservado.`}
                    confirmLabel="Desvincular"
                    loading={unlinking}
                    onConfirm={confirmUnlink}
                    onCancel={() => setStudentPendingUnlink(null)}
                />
            </div>
        );
    }

    // --- VISÃO PRINCIPAL DO DASHBOARD ---
    return (
        <div className="min-h-screen bg-[#020617] pb-8 pt-2 px-4 lg:px-8 max-w-5xl mx-auto lg:pb-12 lg:pt-0">

            <PageHeader
                title="Área do Personal"
                description="Gerencie vínculos, prescrições e evolução dos seus alunos."
                icon={<Users size={22} />}
                onBack={onBack}
                action={(
                    <Button
                        onClick={() => setShowInviteModal(true)}
                        size="sm"
                        className="w-full rounded-xl sm:w-auto"
                        leftIcon={<UserPlus size={18} />}
                    >
                        Convidar Aluno
                    </Button>
                )}
            />

            {/* 2. Grade de Estatísticas (Opcional, mas bom para UX) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <PremiumCard className="p-4 flex items-center gap-4 bg-slate-900/50">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{students.length}</p>
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                            onClick={() => setSelectedStudent(student)}
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
                                onClick={() => setShowInviteModal(true)}
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

            {/* --- MODAL DE CONVITE --- */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowInviteModal(false)}>
                    <div className="bg-[#0f172a] border border-slate-700/50 rounded-3xl w-full max-w-sm p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                        {/* Header com gradiente sutil */}
                        <div className="p-6 pb-2 relative flex flex-col items-center text-center">
                            <button
                                onClick={() => setShowInviteModal(false)}
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
                                    onClick={copyToClipboard}
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
                                onClick={handleGenerateInvite}
                                disabled={inviteLoading}
                                variant="secondary"
                                className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 tracking-wide uppercase text-xs"
                                leftIcon={<RotateCw size={16} />}
                            >
                                {inviteLoading ? 'Gerando...' : 'Gerar novo código'}
                            </Button>
                            <Button
                                onClick={() => setShowInviteModal(false)}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 tracking-wide uppercase text-xs"
                            >
                                Entendi, Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
