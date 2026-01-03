/**
 * DesktopSidebar.jsx
 * Responsive sidebar navigation component for desktop view.
 * Handles tab switching and hovering effects for navigation items.
 */
import React, { useState } from 'react';
import { Home, Dumbbell, Plus, History, User } from 'lucide-react';

export function DesktopSidebar({ activeTab, onTabChange }) {
    const [hoveredTab, setHoveredTab] = useState(null);

    const tabs = [
        {
            id: 'home',
            label: 'Home',
            icon: Home
        },
        {
            id: 'workouts',
            label: 'Treinos',
            icon: Dumbbell,
            badge: 0
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

    return (
        <aside
            className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-24 z-50 items-center py-8 gap-8"
            style={{
                background: 'linear-gradient(180deg, #020617 0%, #000 100%)',
                borderRight: '1px solid rgba(59,130,246,0.15)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.6)'
            }}
        >
            {/* Logo Icon */}
            <div className="mb-4">
                <img
                    src="/apple-touch-icon.png"
                    alt="Logo"
                    className="w-12 h-12 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform duration-300"
                />
            </div>

            <nav className="flex flex-col gap-6 w-full px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isHovered = hoveredTab === tab.id;

                    // ========== BOTÃO DE AÇÃO (FAB Desktop) ==========
                    if (tab.isSpecial) {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                onMouseEnter={() => setHoveredTab(tab.id)}
                                onMouseLeave={() => setHoveredTab(null)}
                                className="relative flex flex-col items-center justify-center mx-auto group cursor-pointer gap-1.5"
                                aria-label={tab.label}
                            >
                                <div
                                    className="flex items-center justify-center transition-all duration-300"
                                    style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        background: `radial-gradient(circle at 30% 30%, #06b6d4 0%, #3b82f6 50%, #1e40af 100%)`,
                                        boxShadow: isHovered
                                            ? '0 8px 24px rgba(6,182,212,0.5)'
                                            : '0 4px 12px rgba(6,182,212,0.3)',
                                        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                    }}
                                >
                                    <Icon size={28} strokeWidth={2.5} className="text-white" />
                                </div>

                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider group-hover:text-white transition-colors">
                                    Novo
                                </span>

                                {/* Tooltip (Optional, keeping simpler 'Novo' label instead) */}
                            </button>
                        );
                    }

                    // ========== ITENS NORMAIS ==========
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            onMouseEnter={() => setHoveredTab(tab.id)}
                            onMouseLeave={() => setHoveredTab(null)}
                            className="flex flex-col items-center justify-center gap-1 relative p-3 rounded-2xl transition-all duration-200 cursor-pointer group"
                            aria-label={tab.label}
                        >
                            <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-cyan-500/10' : 'group-hover:bg-white/5'}`}>
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-all duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                                    style={{
                                        filter: isActive ? 'drop-shadow(0 0 8px rgba(6,182,212,0.4))' : 'none'
                                    }}
                                />

                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 w-1 h-8 rounded-r-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                                )}
                            </div>

                            <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}
