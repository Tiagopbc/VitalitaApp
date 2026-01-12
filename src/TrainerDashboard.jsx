import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Copy, Check, ChevronLeft, PlusCircle, Trash2 } from 'lucide-react';
import { db } from './firebaseConfig';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { Button } from './components/design-system/Button';
import { PremiumCard } from './components/design-system/PremiumCard';

import HistoryPage from './HistoryPage';
import WorkoutsPage from './WorkoutsPage';
import { userService } from './services/userService';

export function TrainerDashboard({ user, onBack, onNavigateToCreateWorkout }) {
    const [students, setStudents] = useState([]);
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI States
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Selection State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('workouts'); // 'workouts' or 'history'

    useEffect(() => {
        if (!user) return;
        fetchStudents();
        fetchInviteCode();
    }, [user]);

    async function fetchStudents() {
        try {
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
    }

    async function fetchInviteCode() {
        if (user) setInviteCode(user.uid);
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUnlink = async (student) => {
        if (!window.confirm(`Tem certeza que deseja desvincular ${student.displayName}?`)) return;
        try {
            await userService.unlinkTrainer(student.id, user.uid);
            await fetchStudents();
            setSelectedStudent(null);
        } catch (error) {
            console.error(error);
            alert("Erro ao desvincular aluno.");
        }
    };

    const handleNavigateToCreate = (workoutToEdit, contextOverride = {}) => {
        onNavigateToCreateWorkout(workoutToEdit, {
            targetUserId: selectedStudent.uid,
            targetUserName: selectedStudent.displayName,
            ...contextOverride
        });
    };

    // Filtered Students
    const filteredStudents = students.filter(s =>
        s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- RENDER STUDENT DETAIL VIEW ---
    if (selectedStudent) {
        return (
            <div className="min-h-screen bg-[#020617] relative">
                <div className="sticky top-0 z-30 bg-[#020617]/95 backdrop-blur-sm border-b border-slate-800 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between max-w-7xl mx-auto gap-4">
                        <div className="flex items-center gap-3 w-full">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)} leftIcon={<ChevronLeft size={20} />} className="shrink-0">
                                Voltar
                            </Button>
                            <div className="flex items-center gap-3 pl-2 border-l border-slate-700 overflow-hidden">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-cyan-500/20 shrink-0">
                                    {selectedStudent.displayName?.charAt(0)}
                                </div>
                                <span className="font-bold text-white text-lg truncate block max-w-[150px] sm:max-w-none">
                                    {selectedStudent.displayName}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end w-full md:w-auto gap-2">
                            {/* Mobile Unlink (Icon Only) */}
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleUnlink(selectedStudent)}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 sm:hidden"
                            >
                                <Trash2 size={18} />
                            </Button>
                            {/* Desktop Unlink (Full Button) */}
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleUnlink(selectedStudent)}
                                leftIcon={<Trash2 size={16} />}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 hidden sm:flex"
                            >
                                Desvincular
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="max-w-7xl mx-auto mt-6 flex gap-6">
                        <button
                            onClick={() => setActiveTab('workouts')}
                            className={`pb-3 border-b-2 text-sm font-bold transition-all px-1 ${activeTab === 'workouts'
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Fichas de Treino
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 border-b-2 text-sm font-bold transition-all px-1 ${activeTab === 'history'
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            Histórico & Evolução
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 max-w-7xl mx-auto space-y-6">
                    {activeTab === 'workouts' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Treinos Atribuídos</h2>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleNavigateToCreate(null)}
                                    leftIcon={<PlusCircle size={18} />}
                                    className="bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 font-bold"
                                >
                                    Prescrever Treino
                                </Button>
                            </div>
                            <WorkoutsPage
                                user={selectedStudent}
                                isTrainerMode={true}
                                onNavigateToCreate={handleNavigateToCreate}
                                onNavigateToWorkout={() => alert("Modo visualização de Personal: Execução desabilitada.")}
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <HistoryPage
                                user={selectedStudent}
                                onBack={() => { }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="min-h-screen bg-[#020617] pb-24 lg:pt-0 pt-4 px-4 lg:px-8 max-w-7xl mx-auto">

            {/* 1. Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    {/* Show Back Button mainly on Mobile */}
                    <div className="lg:hidden mb-2">
                        <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ChevronLeft size={20} />} className="pl-0 hover:bg-transparent text-slate-400 hover:text-white">
                            Voltar
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Área do Personal</h1>
                    <p className="text-slate-400">Gerencie o progresso dos seus alunos</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowInviteModal(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 border-0 h-11 px-6 rounded-xl"
                    >
                        <UserPlus size={18} className="mr-2" />
                        Convidar Aluno
                    </Button>
                </div>
            </div>

            {/* 2. Stats Grid (Optional but nice for UX) */}
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
                {/* Add more stats if real data available */}
            </div>

            {/* 3. Search & Toolbar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar aluno por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
            </div>

            {/* 4. Students Grid */}
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
                    <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                            <Users size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Nenhum aluno encontrado</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-6">
                            {searchTerm
                                ? `Não encontramos ninguém com "${searchTerm}".`
                                : "Você ainda não tem alunos vinculados."
                            }
                        </p>
                        {!searchTerm && (
                            <Button onClick={() => setShowInviteModal(true)} variant="secondary" size="sm">
                                Convidar o primeiro
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* --- INVITE MODAL --- */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowInviteModal(false)}>
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <ChevronLeft size={20} className="rotate-90" /> {/* Should be X but reusing icons for ease or import X if available, wait, let's just use text or existing icons */}
                            <span className="text-xl font-bold">&times;</span>
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
                                <UserPlus size={32} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Convidar Aluno</h2>
                            <p className="text-slate-400 text-sm">
                                Compartilhe este código com seu aluno.<br />Ele deve inseri-lo em <strong>Perfil &gt; Vincular Personal</strong>.
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-1 mb-6 flex items-center">
                            <div className="flex-1 text-center font-mono text-xl font-bold text-cyan-400 tracking-wider py-3">
                                {inviteCode}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className={`p-3 rounded-lg font-bold transition-all ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                        </div>

                        <Button
                            onClick={() => setShowInviteModal(false)}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
