/**
 * useCardMenu.js
 * Qual card está com o menu de opções aberto, e o fechamento ao clicar fora
 * do botão e do menu. Movido de WorkoutsPage (D19) sem mudança.
 */
import { useEffect, useState } from 'react';

export function useCardMenu() {
    const [activeCardMenu, setActiveCardMenu] = useState(null);

    // --- CLICK OUTSIDE HANDLERS ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (!activeCardMenu) return;
            const target = event.target;
            if (target && target.closest && (target.closest('.card-menu-btn') || target.closest('.card-menu-dropdown'))) return;
            setActiveCardMenu(null);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCardMenu]);

    return { activeCardMenu, setActiveCardMenu };
}
