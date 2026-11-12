/**
 * useLoginForm.js
 * Entrar com e-mail e senha ou com Google. O carregando e o erro são
 * compartilhados com o resto da tela de login e vêm de fora.
 * Lógica movida de LoginPage sem mudança.
 */
import { useMemo, useState } from 'react';
import { getAuthErrorMessage } from '../../utils/authValidation';

export function useLoginForm({ loading, setLoading, setError }) {
    // Entrar
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const canLogin = useMemo(() => {
        return loginEmail.trim().length > 0 && loginPassword.length >= 6 && !loading;
    }, [loginEmail, loginPassword, loading]);

    /** Ao voltar para o login, os campos recomeçam vazios. */
    function clearLogin() {
        setLoginEmail('');
        setLoginPassword('');
    }

    async function handleLoginSubmit(e) {
        e.preventDefault();
        if (!canLogin) return;

        setError('');
        setLoading(true);

        try {
            const { authService } = await import('../../services/authService');
            await authService.login(loginEmail.trim(), loginPassword);
        } catch (err) {
            console.error(err);
            let msg = getAuthErrorMessage(err, 'Não foi possível autenticar. Verifique os dados e tente novamente.');

            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = 'E-mail ou senha incorretos.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'O formato do e-mail é inválido.';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Muitas tentativas falhas. Tente novamente mais tarde.';
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        if (loading) return;

        setError('');
        setLoading(true);

        try {
            const { authService } = await import('../../services/authService');
            await authService.loginWithGoogle();
        } catch (err) {
            console.error(err);
            setError(getAuthErrorMessage(err, 'Erro ao entrar com Google. Tente novamente.'));
        } finally {
            setLoading(false);
        }
    }

    return {
        loginEmail,
        setLoginEmail,
        loginPassword,
        setLoginPassword,
        showLoginPassword,
        setShowLoginPassword,
        canLogin,
        clearLogin,
        handleLoginSubmit,
        handleGoogleSignIn
    };
}
