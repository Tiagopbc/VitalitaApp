/**
 * BottomNavEnhanced.jsx
 * Barra de navegação inferior premium com animações fluidas (Framer Motion),
 * efeito glassmorphism e feedback tátil.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Actually used in lines 94, 134, 148. Wait, lint said unused?
import { Home, Dumbbell, Plus, History, User } from 'lucide-react';


export function BottomNavEnhanced({ activeTab, onTabChange }) {
    const [pressedTab, setPressedTab] = useState(null);

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
            className="pointer-events-auto mb-6 mx-4"
            style={{
                position: 'relative',
                zIndex: 100,
            }}
        >
            <div
                className="flex items-center gap-1 p-1.5 rounded-[32px] border border-white/10 relative overflow-hidden backdrop-blur-3xl"
                style={{
                    background: 'rgba(12, 12, 14, 0.45)', // Base dark glass
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)'
                }}
            >
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isPressed = pressedTab === tab.id;

                    // ========== BOTÃO CENTRAL FAB (HOME) ==========
                    // Mantém renderização separada para garantir o destaque visual e de layout
                    if (tab.isSpecial) {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handlePress(tab.id)}
                                onTouchStart={() => setPressedTab(tab.id)}
                                onTouchEnd={() => setPressedTab(null)}
                                className="relative group mx-1"
                                style={{
                                    WebkitTapHighlightColor: 'transparent',
                                    outline: 'none'
                                }}
                                aria-label={tab.label}
                            >
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <span className="pulse-ring" />
                                    <span className="pulse-ring pulse-ring--delay" />
                                </div>
                                <motion.div
                                    className="flex items-center justify-center relative z-20"
                                    animate={{
                                        scale: isPressed ? 0.92 : 1,
                                        boxShadow: isPressed
                                            ? '0 0 15px rgba(6,182,212,0.3)'
                                            : '0 0 30px rgba(6,182,212,0.4), inset 0 0 20px rgba(6,182,212,0.1)'
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '24px',
                                        background: 'rgba(6, 182, 212, 0.15)', // Glassy cyan tint
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                    }}
                                >
                                    <Icon size={24} className="text-cyan-400" strokeWidth={1.5} />
                                </motion.div>
                            </button>
                        );
                    }

                    // ========== ITENS NORMAIS (ABAS) ==========
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handlePress(tab.id)}
                            onTouchStart={() => setPressedTab(tab.id)}
                            onTouchEnd={() => setPressedTab(null)}
                            className="relative flex flex-col items-center justify-center px-4 py-2"
                            style={{
                                WebkitTapHighlightColor: 'transparent',
                                outline: 'none',
                                minWidth: '64px'
                            }}
                        >
                            {/* Sliding Active Indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 rounded-[20px] z-0"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{
                                        background: 'rgba(6, 182, 212, 0.1)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                />
                            )}

                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        y: isActive ? -2 : 0
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                >
                                    <Icon
                                        size={22}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={`transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}
                                    />
                                </motion.div>

                                <span className={`text-[10px] font-medium transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
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
