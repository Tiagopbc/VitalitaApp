/**
 * useSignupForm.js
 * Cadastro em dois passos: conta (nome, e-mail, senha e confirmação) e dados
 * pessoais (gênero, nascimento, altura, peso e aceite dos termos), com as
 * validações e a criação da conta. Lógica movida de LoginPage sem mudança.
 */
import { useMemo, useState } from 'react';
import {
    canCreateAccount as evaluateCanCreateAccount,
    evaluatePasswordRules,
    getAuthErrorMessage,
    getFirstName,
    validateBirthDate
} from '../../utils/authValidation';

export function useSignupForm({ loading, setLoading, setError }) {
    const [step, setStep] = useState(1); // 1 | 2

    // Cadastro
    const [fullName, setFullName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [gender, setGender] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [acceptedLegal, setAcceptedLegal] = useState(false);

    const passwordRules = useMemo(() => evaluatePasswordRules(signupPassword), [signupPassword]);

    const passwordOk = useMemo(() => Object.values(passwordRules).every(Boolean), [passwordRules]);

    const canGoStep1 = useMemo(() => {
        const okName = fullName.trim().length >= 2;
        const okEmail = signupEmail.trim().length > 0 && signupEmail.includes('@');
        const okConfirm = confirmPassword.length > 0 && confirmPassword === signupPassword;
        return okName && okEmail && passwordOk && okConfirm && !loading;
    }, [fullName, signupEmail, signupPassword, confirmPassword, passwordOk, loading]);

    const birthValidation = useMemo(
        () => validateBirthDate(birthDay, birthMonth, birthYear),
        [birthDay, birthMonth, birthYear]
    );

    const canCreateAccount = useMemo(
        () => evaluateCanCreateAccount({
            gender,
            birthValidDate: birthValidation.validDate,
            heightCm,
            weightKg,
            acceptedLegal,
            loading
        }),
        [gender, birthValidation.validDate, heightCm, weightKg, acceptedLegal, loading]
    );

    const birthHasAnyError = Boolean(
        birthValidation.yearError ||
        birthValidation.monthError ||
        birthValidation.dayError ||
        birthValidation.dateError
    );

    function resetSignup() {
        setStep(1);
        setFullName('');
        setSignupEmail('');
        setSignupPassword('');
        setConfirmPassword('');
        setGender('');
        setBirthDay('');
        setBirthMonth('');
        setBirthYear('');
        setHeightCm('');
        setWeightKg('');
        setAcceptedLegal(false);
    }

    function backToStep1() {
        if (loading) return;
        setError('');
        setStep(1);
    }

    function nextStep(e) {
        e.preventDefault();

        if (!canGoStep1) {
            setError('Revise os dados e os requisitos da senha antes de continuar.');
            return;
        }

        setError('');
        setStep(2);
    }

    async function createAccount(e) {
        e.preventDefault();

        if (!canCreateAccount) {
            setError('Revise gênero, data de nascimento, altura, peso e aceite dos termos para concluir.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const email = signupEmail.trim();
            const name = fullName.trim();

            const additionalData = {
                gender,
                birthDate: {
                    day: Number(birthDay),
                    month: Number(birthMonth),
                    year: Number(birthYear),
                },
                heightCm: Number(heightCm),
                weightKg: Number(weightKg),
            };

            const { authService } = await import('../../services/authService');
            await authService.register(email, signupPassword, name, additionalData);

            // Sinaliza para o App exibir o pop up de boas-vindas após o cadastro
            const firstName = getFirstName(name);
            localStorage.setItem('welcomeFirstName', firstName);
            localStorage.setItem('welcomePending', '1');

        } catch (err) {
            console.error(err);
            setError(getAuthErrorMessage(err, 'Não foi possível criar sua conta. Verifique os dados e tente novamente.'));
            // Em caso de erro, remove o sinal para não abrir pop up indevidamente
            localStorage.removeItem('welcomePending');
            localStorage.removeItem('welcomeFirstName');
        } finally {
            setLoading(false);
        }
    }

    return {
        step,
        canGoStep1,
        canCreateAccount,
        resetSignup,
        backToStep1,
        nextStep,
        createAccount,
        stepAccountProps: {
            fullName,
            setFullName,
            signupEmail,
            setSignupEmail,
            signupPassword,
            setSignupPassword,
            showSignupPassword,
            setShowSignupPassword,
            confirmPassword,
            setConfirmPassword,
            showConfirmPassword,
            setShowConfirmPassword,
            passwordRules,
            loading
        },
        stepPersonalProps: {
            gender,
            setGender,
            birthDay,
            setBirthDay,
            birthMonth,
            setBirthMonth,
            birthYear,
            setBirthYear,
            heightCm,
            setHeightCm,
            weightKg,
            setWeightKg,
            acceptedLegal,
            setAcceptedLegal,
            birthValidation,
            birthHasAnyError,
            loading
        }
    };
}
