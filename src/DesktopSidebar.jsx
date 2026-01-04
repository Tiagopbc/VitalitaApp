/**
 * DesktopSidebar.jsx
 * Navegação lateral responsiva para visualização desktop.
 * Gerencia a troca de abas e efeitos de hover para itens de navegação.
 */
import React, { useState } from 'react';
import { Home, Dumbbell, Plus, History, User } from 'lucide-react';

export function DesktopSidebar({ activeTab, onTabChange, user }) {
    const [hoveredTab, setHoveredTab] = useState(null);

    const tabs = [
        {
            id: 'home',
            label: 'Início',
            icon: Home
        },
        {
            id: 'workouts',
            label: 'Treinos',
            icon: Dumbbell
        },
        {
            id: 'new',
            label: 'Novo', // Keeping it short as requested before, but in list
            icon: Plus,
            isSpecial: true
        },
        {
            id: 'history',
            label: 'Histórico',
            icon: History
        }
    ];

    return (
        <aside
            className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-50 py-6 px-4 gap-8 font-sans"
            style={{
                background: 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
                borderRight: '1px solid rgba(30, 41, 59, 0.5)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.4)'
            }}
        >
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] shadow-lg shadow-blue-500/20">
                    <div className="w-full h-full rounded-[11px] bg-black/20 flex items-center justify-center overflow-hidden">
                        <img
                            src="/apple-touch-icon.png"
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-white tracking-wide leading-none">
                        VITALITÀ
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wider mt-0.5">
                        Fitness Tracker Pro
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 w-full flex-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isHovered = hoveredTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            onMouseEnter={() => setHoveredTab(tab.id)}
                            onMouseLeave={() => setHoveredTab(null)}
                            className={`
                                relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 w-full text-left group
                                ${isActive
                                    ? 'bg-gradient-to-r from-blue-600/20 to-cyan-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                    : 'hover:bg-slate-800/50 transparent'
                                }
                                ${tab.isSpecial && !isActive ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/5 border border-cyan-500/10' : ''}
                            `}
                        >
                            {/* Active Indicator Line */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                            )}

                            <Icon
                                size={20}
                                className={`transition-colors duration-300 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'} ${tab.isSpecial ? 'text-cyan-400' : ''}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* User Profile Footer */}
            {user && (
                <div className="mt-auto px-2 pt-4 border-t border-slate-800/50">
                    <button
                        onClick={() => onTabChange('profile')}
                        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-800/50 transition-colors text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-black/50 group-hover:ring-slate-700 transition-all">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span>{user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                                {user.displayName || 'Usuário'}
                            </span>
                            <span className="text-xs text-slate-500 truncate">
                                Ver perfil
                            </span>
                        </div>
                    </button>
                </div>
            )}
        </aside>
    );
}
