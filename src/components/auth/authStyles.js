/**
 * authStyles.js
 * Classes Tailwind repetidas nos formulários de autenticação (LoginPage e views de auth).
 * Centralizadas para evitar divergência entre os campos.
 */

// Inputs das telas de login e redefinição de senha.
export const authInputClass =
    'w-full box-border rounded-[10px] border border-blue-800/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-blue-500/95 focus:shadow-glow-input-focus placeholder:text-slate-200/40';

// Inputs do wizard de cadastro (variação de borda/foco).
export const signupInputClass =
    'w-full box-border rounded-[10px] border border-blue-900/60 bg-slate-900/95 text-text-primary px-2.5 py-2 text-[0.9rem] outline-none transition-all shadow-md focus:border-accent-strong/95 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.7)] placeholder:text-slate-200/40';

export const authFieldLabelClass =
    'block text-left self-start text-[0.85rem] text-text-secondary font-medium';
