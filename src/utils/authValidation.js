/**
 * authValidation.js
 * Funções puras de validação e apoio para os fluxos de login/cadastro (LoginPage).
 * Extraídas do componente para permitir teste isolado e reduzir o tamanho da página.
 */

export function getFirstName(fullName) {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    return parts[0] || '';
}

export function daysInMonth(year, month) {
    if (!Number.isFinite(year) || !Number.isFinite(month)) return 31;
    return new Date(year, month, 0).getDate();
}

export function getAuthErrorMessage(err, fallback) {
    if (err?.code === 'auth/invalid-api-key') {
        return 'Configuração local do Firebase ausente ou inválida. Confira o arquivo .env.local.';
    }
    if (err?.code === 'auth/network-request-failed') {
        return 'Erro de conexão/rede. Verifique sua internet.';
    }
    return fallback;
}

export function evaluatePasswordRules(password) {
    const pwd = password || '';

    return {
        minLen: pwd.length >= 6,
        hasUpper: /[A-Z]/.test(pwd),
        hasLower: /[a-z]/.test(pwd),
        hasNumber: /[0-9]/.test(pwd),
        hasSpecial: /[^A-Za-z0-9]/.test(pwd)
    };
}

export function validateBirthDate(birthDay, birthMonth, birthYear) {
    const nowYear = new Date().getFullYear();

    const y = Number(birthYear);
    const m = Number(birthMonth);
    const d = Number(birthDay);

    const hasY = birthYear !== '';
    const hasM = birthMonth !== '';
    const hasD = birthDay !== '';

    let yearError = '';
    let monthError = '';
    let dayError = '';
    let dateError = '';

    if (hasY) {
        if (!Number.isFinite(y)) yearError = 'Ano inválido.';
        else if (y < 1950) yearError = 'Ano inválido. Use 1950 ou maior.';
        else if (y > nowYear) yearError = `Ano inválido. Use ${nowYear} ou menor.`;
    }

    if (hasM) {
        if (!Number.isFinite(m)) monthError = 'Mês inválido.';
        else if (m < 1 || m > 12) monthError = 'Mês inválido. Use 1 a 12.';
    }

    if (hasD) {
        if (!Number.isFinite(d)) dayError = 'Dia inválido.';
        else {
            const effectiveYear = Number.isFinite(y) ? y : 2000;
            const effectiveMonth = Number.isFinite(m) ? m : 1;
            const maxDay = daysInMonth(effectiveYear, effectiveMonth);

            if (d < 1) dayError = 'Dia inválido. Use 1 ou maior.';
            else if (Number.isFinite(m) && Number.isFinite(y) && d > maxDay) {
                dayError = `Dia inválido para este mês. Máximo: ${maxDay}.`;
            } else if (!Number.isFinite(m) && d > 31) {
                dayError = 'Dia inválido. Use 1 a 31.';
            } else if (Number.isFinite(m) && !Number.isFinite(y) && d > 31) {
                dayError = 'Dia inválido. Use 1 a 31.';
            }
        }
    }

    const canCheckFull =
        Number.isFinite(y) &&
        Number.isFinite(m) &&
        Number.isFinite(d) &&
        !yearError &&
        !monthError &&
        !dayError;

    const validDate = (() => {
        if (!canCheckFull) return false;
        const dt = new Date(y, m - 1, d);
        return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    })();

    if (birthDay || birthMonth || birthYear) {
        if (!validDate && canCheckFull) {
            dateError = 'Data inválida.';
        }
    }

    return {
        y,
        m,
        d,
        yearError,
        monthError,
        dayError,
        dateError,
        validDate,
        nowYear
    };
}

export function canCreateAccount({ gender, birthValidDate, heightCm, weightKg, acceptedLegal, loading }) {
    const h = Number(heightCm);
    const w = Number(weightKg);

    const okHeight = Number.isFinite(h) && h > 0;
    const okWeight = Number.isFinite(w) && w > 0;

    return (
        gender.length > 0 &&
        birthValidDate &&
        okHeight &&
        okWeight &&
        acceptedLegal &&
        !loading
    );
}
