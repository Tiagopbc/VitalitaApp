/**
 * useTrainerInvite.js
 * Código de convite do personal: busca (ou cria) o convite ativo ao abrir a
 * área, gera um novo sob demanda, copia para a área de transferência e
 * controla o modal. Lógica movida de TrainerDashboard sem mudança.
 */
import { useCallback, useEffect, useState } from 'react';
import { notify } from '../../utils/notifyStore';

export function useTrainerInvite(user) {
    const [invite, setInvite] = useState(null);
    const [inviteCode, setInviteCode] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchInviteCode = useCallback(async () => {
        if (!user) return;
        setInviteLoading(true);
        try {
            const { userService } = await import('../../services/userService');
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
        // A busca começa ligando um estado de carregamento; disparada numa
        // microtarefa, isso não acontece no corpo síncrono do efeito (sem render
        // em cascata). O atraso é de uma microtarefa, invisível na tela.
        Promise.resolve().then(() => fetchInviteCode());
    }, [user, fetchInviteCode]);

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
            const { userService } = await import('../../services/userService');
            const newInvite = await userService.createTrainerInvite(user.uid);
            setInvite(newInvite);
            setInviteCode(newInvite?.code || '');
        } catch (error) {
            console.error("Error creating trainer invite:", error);
            notify.error("Erro ao gerar convite.");
        } finally {
            setInviteLoading(false);
        }
    };

    return {
        invite,
        inviteCode,
        inviteLoading,
        copied,
        showInviteModal,
        setShowInviteModal,
        copyToClipboard,
        handleGenerateInvite
    };
}
