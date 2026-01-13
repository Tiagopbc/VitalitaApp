import React, { useState } from 'react';
import { Home, Dumbbell, PlusCircle, History, TrendingUp, Users } from 'lucide-react';

export function DesktopSidebar({ activeTab, onTabChange, user, isTrainer }) {
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
            label: 'Novo',
            icon: PlusCircle,
            isSpecial: true
        },
        {
            id: 'history',
            label: 'Histórico',
            icon: History
        },
    ];

    if (isTrainer) {
        tabs.push({
            id: 'partners',
            label: 'Área do Personal',
            icon: Users
        });
    }

    return (
        <aside
            className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-50 py-6 px-4 gap-8 font-sans"
            style={{
                background: '#050B16', // Darker navy background
                borderRight: '1px solid rgba(30, 41, 59, 0.4)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.4)'
            }}
        >
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-4 mb-4 mt-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] shadow-lg shadow-blue-500/20">
                    <div className="w-full h-full rounded-[11px] bg-black/40 flex items-center justify-center overflow-hidden">
                        {/* Placeholder Icon if image missing */}
                        <Dumbbell size={20} className="text-white" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-white tracking-wide leading-none">
                        VITALITÀ
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium tracking-wider mt-0.5">
                        Fitness Tracker Pro
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2 w-full flex-1 px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                                relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 w-full text-left group
                                ${isActive
                                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 text-white'
                                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                                }
                            `}
                        >
                            <Icon
                                size={22}
                                className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            <span className={`text-[15px] font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                {tab.label}
                            </span>

                            {/* Glow Effect for Active */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl bg-cyan-400/5 blur-sm -z-10" />
                            )}
                            {/* Active Indicator Line (Left) */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom User Section - Minimal */}
            {user && (
                <div className="mt-auto px-4 pb-2">
                    <button
                        onClick={() => onTabChange('profile')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800 transition-colors text-left cursor-pointer group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white group-hover:scale-105 transition-transform">
                            {user.displayName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-slate-300 truncate group-hover:text-white transition-colors">{user.displayName}</span>
                            <span className="text-[10px] text-slate-500">Online</span>
                        </div>
                    </button>
                </div>

            )}
        </aside>
    );
}
