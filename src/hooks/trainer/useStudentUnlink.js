/**
 * useStudentUnlink.js
 * Desvincular um aluno: o aluno à espera de confirmação, o andamento e a
 * confirmação, que recarrega a lista e fecha o detalhe (onUnlinked).
 * Lógica movida de TrainerDashboard sem mudança.
 */
import { useState } from 'react';
import { notify } from '../../utils/notifyStore';

export function useStudentUnlink({ user, fetchStudents, onUnlinked }) {
    const [studentPendingUnlink, setStudentPendingUnlink] = useState(null);
    const [unlinking, setUnlinking] = useState(false);

    const confirmUnlink = async () => {
        if (!studentPendingUnlink) return;
        setUnlinking(true);
        try {
            const { userService } = await import('../../services/userService');
            await userService.unlinkTrainer(studentPendingUnlink.id, user.uid);
            await fetchStudents();
            notify.success("Aluno desvinculado.");
            onUnlinked();
            setStudentPendingUnlink(null);
        } catch (error) {
            console.error(error);
            notify.error("Erro ao desvincular aluno.");
        } finally {
            setUnlinking(false);
        }
    };

    return { studentPendingUnlink, setStudentPendingUnlink, unlinking, confirmUnlink };
}
