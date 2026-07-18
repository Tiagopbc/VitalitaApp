/**
 * tokens.js
 * Espelho em JavaScript dos tokens de design definidos em src/index.css (fonte única).
 * Os valores referenciam CSS variables — use-os em `style` inline ou styled props.
 * Para obter o valor resolvido (ex.: para canvas/gráficos), use resolveToken().
 */
export const designTokens = {
    colors: {
        surface: 'var(--vit-surface)',
        panel: 'var(--vit-panel)',
        panelRaised: 'var(--vit-panel-raised)',
        border: 'var(--vit-border)',
        text: 'var(--vit-text)',
        textStrong: 'var(--vit-text-strong)',
        muted: 'var(--vit-muted)',
        primary: 'var(--vit-primary)',
        primaryStrong: 'var(--vit-primary-strong)',
        success: 'var(--vit-success)',
        warning: 'var(--vit-warning)',
        danger: 'var(--vit-danger)'
    },
    spacing: {
        xs: 'var(--spacing-1)',
        sm: 'var(--spacing-2)',
        md: 'var(--spacing-4)',
        lg: 'var(--spacing-6)',
        xl: 'var(--spacing-8)'
    },
    radius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: '999px'
    },
    shadow: {
        card: 'var(--vit-shadow-card)',
        glow: 'var(--vit-shadow-glow)'
    },
    zIndex: {
        sticky: 50,
        modal: 200,
        overlay: 300,
        toast: 400
    },
    motion: {
        fast: '150ms',
        normal: '220ms',
        slow: '360ms'
    }
};

/**
 * Resolve um token `var(--x)` para o valor computado atual.
 * Necessário em contextos que não entendem CSS variables (ex.: canvas).
 */
export function resolveToken(cssVarReference) {
    const match = /^var\((--[^),\s]+)\)$/.exec(cssVarReference);
    if (!match || typeof window === 'undefined') return cssVarReference;
    const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
    return value || cssVarReference;
}
