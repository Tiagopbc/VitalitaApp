/**
 * BottomNavEnhanced.jsx
 * Barra de navegação inferior aprimorada para mobile com FAB (Botão de Ação Flutuante) animado.
 * Gerencia o estado da aba ativa e fornece feedback visual para interações de toque.
 */
import React, { useState } from 'react';
import { Home, Dumbbell, Plus, History, User, Users } from 'lucide-react';

export function BottomNavEnhanced({ activeTab, onTabChange }) {
    const [pressedTab, setPressedTab] = useState(null);

    const tabs = [
        {
            id: 'home',
            label: 'Home',
            icon: Home
        },
        {
            id: 'workouts',
            label: 'Treinos',
            icon: Dumbbell
        },
        {
            id: 'new',
            label: 'Novo',
            icon: Plus,
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



    const handlePress = (tabId) => {
        setPressedTab(tabId);
        setTimeout(() => setPressedTab(null), 150);
        onTabChange(tabId);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden"
            style={{
                background: 'linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(0,0,0,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(59,130,246,0.15)',
                boxShadow: `
          0 -4px 24px rgba(0,0,0,0.6),
          0 -1px 0 rgba(59,130,246,0.1),
          inset 0 1px 0 rgba(255,255,255,0.03)
        `,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <div className="flex items-center justify-around max-w-[600px] mx-auto px-4 py-2 relative">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isPressed = pressedTab === tab.id;

                    // ========== BOTÃO CENTRAL FAB ==========
                    if (tab.isSpecial) {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handlePress(tab.id)}
                                onTouchStart={() => setPressedTab(tab.id)}
                                onTouchEnd={() => setPressedTab(null)}
                                className="relative flex items-center justify-center"
                                style={{
                                    WebkitTapHighlightColor: 'transparent',
                                    outline: 'none'
                                }}
                                aria-label={tab.label}
                            >
                                {/* FAB Button */}
                                <div
                                    className="relative flex items-center justify-center transition-all duration-300"
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: `
                      radial-gradient(circle at 30% 30%, #06b6d4 0%, #3b82f6 50%, #1e40af 100%)
                    `,
                                        border: '3px solid rgba(2,6,23,0.95)',
                                        boxShadow: isPressed
                                            ? '0 4px 16px rgba(6,182,212,0.6), 0 0 0 0 rgba(6,182,212,0)'
                                            : '0 8px 32px rgba(6,182,212,0.6), 0 0 16px rgba(6,182,212,0.3)',
                                        transform: isPressed
                                            ? 'translateY(-8px) scale(0.92)'
                                            : 'translateY(-16px) scale(1)',
                                        animation: !isPressed ? 'fab-pulse 2.5s infinite' : 'none'
                                    }}
                                >
                                    <Icon
                                        size={28}
                                        strokeWidth={2.5}
                                        className="text-white"
                                    />

                                    {/* Ring animado */}
                                    <div
                                        className="absolute inset-0 rounded-full border-2 border-cyan-400"
                                        style={{
                                            animation: 'fab-ring 2.5s infinite',
                                            opacity: 0
                                        }}
                                    />
                                </div>

                                {/* Label abaixo do FAB */}
                                <span
                                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-200"
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#06b6d4',
                                        letterSpacing: '0.02em',
                                        textShadow: '0 0 8px rgba(6,182,212,0.5)'
                                    }}
                                >
                                    {tab.label}
                                </span>
                            </button>
                        );
                    }

                    // ========== ITENS NORMAIS ==========
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handlePress(tab.id)}
                            onTouchStart={() => setPressedTab(tab.id)}
                            onTouchEnd={() => setPressedTab(null)}
                            className="flex flex-col items-center justify-center gap-1 relative transition-all duration-200 px-3 py-2"
                            style={{
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                                transform: isPressed ? 'scale(0.9)' : 'scale(1)'
                            }}
                            aria-label={tab.label}
                        >
                            {/* Wrapper do ícone */}
                            <div
                                className="relative flex items-center justify-center transition-all duration-300"
                                style={{
                                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)'
                                }}
                            >
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={{
                                        color: isActive ? '#06b6d4' : '#64748b',
                                        filter: isActive ? 'drop-shadow(0 0 8px rgba(6,182,212,0.6))' : 'none',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                />

                                {/* Badge de notificação */}
                                {tab.badge && tab.badge > 0 && (
                                    <div
                                        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white"
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                            border: '2px solid rgba(2,6,23,0.95)',
                                            boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                                            animation: 'badge-bounce 2s infinite'
                                        }}
                                    >
                                        {tab.badge > 9 ? '9+' : tab.badge}
                                    </div>
                                )}

                                {/* Indicador de ativo (bolinha) */}
                                {isActive && (
                                    <div
                                        className="absolute -bottom-2"
                                        style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: '#06b6d4',
                                            boxShadow: '0 0 10px rgba(6,182,212,0.8)',
                                            animation: 'indicator-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Label - SEMPRE VISÍVEL (melhor UX) */}
                            <span
                                className="transition-all duration-200"
                                style={{
                                    fontSize: '11px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? '#06b6d4' : '#64748b',
                                    letterSpacing: '0.01em',
                                    textShadow: isActive ? '0 0 8px rgba(6,182,212,0.4)' : 'none'
                                }}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Animações em CSS-in-JS */}
            <style>{`
        @keyframes fab-pulse {
          0%, 100% {
            box-shadow: 
              0 8px 32px rgba(6,182,212,0.6),
              0 0 16px rgba(6,182,212,0.3);
          }
          50% {
            box-shadow: 
              0 12px 40px rgba(6,182,212,0.8),
              0 0 24px rgba(6,182,212,0.5);
          }
        }

        @keyframes fab-ring {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }

        @keyframes indicator-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.5);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes badge-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        /* Safe area para iPhone */
        @supports (padding: max(0px)) {
          nav {
            padding-bottom: max(8px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
        </nav>
    );
}
