/**
 * TrainerDashboard.jsx
 * Área do personal: lista de alunos com busca, convite por código e o detalhe
 * de cada aluno (fichas e histórico, com prescrição e desvínculo).
 *
 * Orquestrador fino: estado e ações em src/hooks/trainer/, cada parte da tela
 * em src/components/trainer/. Aqui ficam o aluno selecionado, a aba do detalhe
 * e a composição.
 */
import React, { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '../components/design-system/Button';
import { PageHeader } from '../components/design-system/PageHeader';
import { StudentDetail } from '../components/trainer/StudentDetail';
import { TrainerStudentList } from '../components/trainer/TrainerStudentList';
import { InviteModal } from '../components/trainer/InviteModal';
import { useTrainerStudents } from '../hooks/trainer/useTrainerStudents';
import { useTrainerInvite } from '../hooks/trainer/useTrainerInvite';
import { useStudentUnlink } from '../hooks/trainer/useStudentUnlink';

export function TrainerDashboard({ user, onBack, onNavigateToCreateWorkout }) {
    // Estado de Seleção
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('workouts'); // 'workouts' ou 'history'

    const studentsState = useTrainerStudents(user);
    const inviteState = useTrainerInvite(user);
    const unlink = useStudentUnlink({
        user,
        fetchStudents: studentsState.fetchStudents,
        onUnlinked: () => setSelectedStudent(null)
    });

    const handleNavigateToCreate = (workoutToEdit, contextOverride = {}) => {
        onNavigateToCreateWorkout(workoutToEdit, {
            targetUserId: selectedStudent.uid,
            targetUserName: selectedStudent.displayName,
            ...contextOverride
        });
    };

    // --- VISÃO DETALHADA DO ALUNO ---
    if (selectedStudent) {
        return (
            <StudentDetail
                student={selectedStudent}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onBack={() => setSelectedStudent(null)}
                onNavigateToCreate={handleNavigateToCreate}
                onRequestUnlink={() => unlink.setStudentPendingUnlink(selectedStudent)}
                pendingUnlink={unlink.studentPendingUnlink}
                unlinking={unlink.unlinking}
                onConfirmUnlink={unlink.confirmUnlink}
                onCancelUnlink={() => unlink.setStudentPendingUnlink(null)}
            />
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
                        onClick={() => inviteState.setShowInviteModal(true)}
                        size="sm"
                        className="w-full rounded-xl sm:w-auto"
                        leftIcon={<UserPlus size={18} />}
                    >
                        Convidar Aluno
                    </Button>
                )}
            />

            <TrainerStudentList
                totalStudents={studentsState.students.length}
                loading={studentsState.loading}
                filteredStudents={studentsState.filteredStudents}
                searchTerm={studentsState.searchTerm}
                onSearchChange={studentsState.setSearchTerm}
                onSelectStudent={setSelectedStudent}
                onInvite={() => inviteState.setShowInviteModal(true)}
            />

            {inviteState.showInviteModal && (
                <InviteModal
                    invite={inviteState.invite}
                    inviteCode={inviteState.inviteCode}
                    inviteLoading={inviteState.inviteLoading}
                    copied={inviteState.copied}
                    onCopy={inviteState.copyToClipboard}
                    onGenerate={inviteState.handleGenerateInvite}
                    onClose={() => inviteState.setShowInviteModal(false)}
                />
            )}
        </div>
    );
}
