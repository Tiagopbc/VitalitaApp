/**
 * usePasswordReset.js
 * Recuperação de senha: e-mail do formulário, envio do link e mensagem de
 * sucesso. Lógica movida de LoginPage sem mudança.
 */
import { useState } from 'react';
import { getAuthErrorMessage } from '../../utils/authValidation';

export function usePasswordReset({ loading, setLoading, setError }) {
    // Esqueci a Senha
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');

    /** Abre a recuperação já com o e-mail que estava no login. */
    function openReset(prefillEmail) {
        setResetSuccess('');
        setResetEmail(prefillEmail); // Preencher se digitado
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        if (loading || !resetEmail.trim()) return;

        setError('');
        setResetSuccess('');
        setLoading(true);

        try {
            const { authService } = await import('../../services/authService');
            await authService.resetPassword(resetEmail.trim());
            setResetSuccess('E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.');
            setResetEmail('');
        } catch (err) {
            console.error(err);
            let msg = getAuthErrorMessage(err, 'Não foi possível enviar o e-mail. Tente novamente.');
            if (err.code === 'auth/user-not-found') {
                msg = 'E-mail não cadastrado.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'E-mail inválido.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return { resetEmail, setResetEmail, resetSuccess, openReset, handleResetPassword };
}
