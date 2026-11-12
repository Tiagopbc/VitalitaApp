/**
 * BottomNavEnhanced.jsx
 * Barra de navegação inferior com efeito glassmorphism e feedback tátil.
 *
 * As animações são CSS desde o R06 (antes, framer-motion, que entrava no bundle
 * do boot só por esta barra e mais dois componentes). O indicador da aba ativa
 * é um elemento só, que desliza até o botão ativo: a posição é lida do botão e
 * aplicada direto no estilo, num layout effect, sem estado React no meio.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Home, Dumbbell, Plus, History, User } from 'lucide-react';

// Curva com leve passada do ponto, no lugar das molas do framer-motion.
const SPRING = 'cubic-bezier(0.34, 1.4, 0.64, 1)';


export function BottomNavEnhanced({ activeTab, onTabChange }) {
    const [pressedTab, setPressedTab] = useState(null);
    const indicatorRef = useRef(null);
    const tabRefs = useRef({});

    const tabs = [
        {
            id: 'new',
            label: 'Novo',
            icon: Plus
        },
        {
            id: 'workouts',
            label: 'Treinos',
            icon: Dumbbell
        },
        {
            id: 'home',
            label: 'Home',
            icon: Home,
            isSpecial: true
        },
        {
            id: 'history',
            label: 'Histórico',
            icon: History
        },
        {
            id: 'profile',
            label: 'Perfil',
            icon: User
        }
    ];

    // A Home é o botão central, com destaque próprio: lá o indicador some.
    const indicatorTab = tabs.some(tab => tab.id === activeTab && !tab.isSpecial) ? activeTab : null;

    useLayoutEffect(() => {
        const indicator = indicatorRef.current;
        if (!indicator) return undefined;

        const place = (animate) => {
            const button = indicatorTab ? tabRefs.current[indicatorTab] : null;
            if (!button) {
                indicator.style.opacity = '0';
                indicator.dataset.placed = '';
                return;
            }
            // Desliza só se já estava visível; vindo da Home, aparece no lugar.
            const slide = animate && indicator.dataset.placed === '1';
            indicator.style.transition = slide ? `transform 380ms ${SPRING}, width 380ms ${SPRING}` : 'none';
            indicator.style.width = `${button.offsetWidth}px`;
            indicator.style.height = `${button.offsetHeight}px`;
            indicator.style.transform = `translate(${button.offsetLeft}px, ${button.offsetTop}px)`;
            indicator.style.opacity = '1';
            indicator.dataset.placed = '1';
        };

        place(true);
        // A largura dos botões depende do rótulo: medido antes de a fonte
        // carregar, o indicador sairia 1 px maior. Reposiciona quando ela chega.
        let ativo = true;
        document.fonts?.ready.then(() => { if (ativo) place(false); });
        const onResize = () => place(false);
        window.addEventListener('resize', onResize);
        return () => {
            ativo = false;
            window.removeEventListener('resize', onResize);
        };
    }, [indicatorTab]);

    const handlePress = (tabId) => {
        setPressedTab(tabId);
        setTimeout(() => setPressedTab(null), 150);
        onTabChange(tabId);

        // Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    };

    return (
        <nav
            className="pointer-events-auto mx-3"
            style={{
                position: 'relative',
                zIndex: 100,
            }}
        >
            <div
                className="flex items-center gap-1 p-1.5 rounded-[28px] border border-white/10 relative overflow-hidden backdrop-blur-3xl"
                style={{
                    background: 'var(--vit-nav-glass)',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)'
                }}
            >
                {/* Indicador da aba ativa (desliza entre as abas) */}
                <div
                    ref={indicatorRef}
                    data-testid="active-tab-indicator"
                    data-tab={indicatorTab ?? ''}
                    data-visible={indicatorTab ? 'true' : 'false'}
                    aria-hidden="true"
                    className="absolute left-0 top-0 rounded-[18px] z-0 opacity-0 pointer-events-none"
                    style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                />

                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isPressed = pressedTab === tab.id;

                    // ========== BOTÃO CENTRAL FAB (HOME) ==========
                    // Mantém renderização separada para garantir o destaque visual e de layout
                    if (tab.isSpecial) {
                        const fabScale = isPressed ? 0.92 : 1;
                        const fabShadow = isPressed
                            ? '0 0 15px rgba(6,182,212,0.3)'
                            : '0 0 30px rgba(6,182,212,0.4), inset 0 0 20px rgba(6,182,212,0.1)';
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handlePress(tab.id)}
                                onTouchStart={() => setPressedTab(tab.id)}
                                onTouchEnd={() => setPressedTab(null)}
                                className="relative group mx-1 flex shrink-0 items-center justify-center p-0 border-0 bg-transparent appearance-none"
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    transform: 'translateY(-2px)',
                                    WebkitTapHighlightColor: 'transparent',
                                    outline: 'none'
                                }}
                                aria-label={tab.label}
                            >
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <span className="pulse-ring" />
                                    <span className="pulse-ring pulse-ring--delay" />
                                </div>
                                <div
                                    className="flex items-center justify-center relative z-20"
                                    style={{
                                        transform: `scale(${fabScale})`,
                                        boxShadow: fabShadow,
                                        transition: `transform 220ms ${SPRING}, box-shadow 220ms ease-out`,
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '22px',
                                        background: 'rgba(6, 182, 212, 0.15)', // Glassy cyan tint
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                    }}
                                >
                                    <Icon size={24} className="text-cyan-400" strokeWidth={1.5} />
                                </div>
                            </button>
                        );
                    }

                    // ========== ITENS NORMAIS (ABAS) ==========
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            ref={(el) => { tabRefs.current[tab.id] = el; }}
                            onClick={() => handlePress(tab.id)}
                            onTouchStart={() => setPressedTab(tab.id)}
                            onTouchEnd={() => setPressedTab(null)}
                            className="relative flex flex-col items-center justify-center px-3 py-1.5"
                            style={{
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                                minWidth: '56px'
                            }}
                        >
                            <div className="relative z-10 flex flex-col items-center gap-0.5">
                                <div
                                    style={{
                                        transform: isActive ? 'translateY(-2px) scale(1.1)' : 'none',
                                        transition: `transform 260ms ${SPRING}`
                                    }}
                                >
                                    <Icon
                                        size={21}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}
                                    />
                                </div>

                                <span className={`text-[9px] font-medium transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                                    {tab.label}
                                </span>
                            </div>

                            {/* Notification Badge */}
                            {tab.badge > 0 && (
                                <div className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
