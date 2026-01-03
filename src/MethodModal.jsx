import React from 'react';
import { X, TrendingDown, TrendingUp, Grid, Link2, Focus, AlertTriangle, Repeat, Heart } from 'lucide-react';
import { trainingMethods } from './data/trainingMethods';

const iconMap = {
    'TrendingDown': TrendingDown,
    'TrendingUp': TrendingUp,
    'Grid': Grid,
    'Link2': Link2,
    'Focus': Focus,
    'AlertTriangle': AlertTriangle,
    'Repeat': Repeat,
    'Heart': Heart
};

export default function MethodModal({ methodName, onClose }) {
    if (!methodName) return null;

    // Normalize comparison to find the method
    const methodData = trainingMethods.find(m =>
        m.name.toLowerCase() === methodName.toLowerCase() ||
        (m.aliases && m.aliases.some(alias => alias.toLowerCase() === methodName.toLowerCase()))
    );

    if (!methodData) return null;

    const Icon = iconMap[methodData.icon] || Repeat;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Card */}
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{methodData.name}</h3>
                </div>

                {/* Content */}
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">

                    {/* Description */}
                    <p className="text-slate-300 text-sm leading-relaxed">
                        {methodData.description}
                    </p>

                    {/* How to Execute */}
                    <div>
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Como Executar</h4>
                        <ul className="space-y-2">
                            {methodData.howTo.map((step, i) => (
                                <li key={i} className="text-sm text-slate-300 flex gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* When to use */}
                    <div>
                        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Quando Usar</h4>
                        <ul className="space-y-2">
                            {methodData.whenToUse.map((step, i) => (
                                <li key={i} className="text-sm text-slate-300 flex gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Caution Box */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-red-400">
                            <AlertTriangle size={14} />
                            <h4 className="text-xs font-bold uppercase tracking-widest">Cuidados</h4>
                        </div>
                        <ul className="space-y-2">
                            {methodData.caution.map((step, i) => (
                                <li key={i} className="text-sm text-red-200/80 flex gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/40 mt-1.5 shrink-0" />
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
