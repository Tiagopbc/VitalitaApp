/**
 * usePresence.js
 * Mantém um elemento montado durante a animação de saída e só então o
 * desmonta. Substitui o AnimatePresence do framer-motion nas animações que
 * viraram CSS (R06): enquanto `leaving`, o componente aplica a classe de saída.
 *
 * Abrir é imediato (ajuste feito comparando com o estado anterior durante o
 * render); fechar espera `exitMs`, o tempo da animação de saída no CSS.
 */
import { useEffect, useState } from 'react';

export function usePresence(isOpen, exitMs) {
    const [mounted, setMounted] = useState(isOpen);
    if (isOpen && !mounted) setMounted(true);

    useEffect(() => {
        if (isOpen || !mounted) return undefined;
        const timer = setTimeout(() => setMounted(false), exitMs);
        return () => clearTimeout(timer);
    }, [isOpen, mounted, exitMs]);

    return { mounted: mounted || isOpen, leaving: mounted && !isOpen };
}
