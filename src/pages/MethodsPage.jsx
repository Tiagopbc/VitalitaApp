/**
 * MethodsPage.jsx
 * Página educacional listando vários métodos de treinamento (ex: Drop-set, Bi-set).
 * Fornece descrições, guias de execução e dicas de uso para cada método.
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { trainingMethods } from '../data/trainingMethods';
import { TrendingDown, TrendingUp, Grid, Link2, Focus, AlertTriangle, Repeat } from 'lucide-react';

const iconMap = {
    'TrendingDown': TrendingDown,
    'TrendingUp': TrendingUp,
    'Grid': Grid,
    'Link2': Link2,
    'Focus': Focus,
    'AlertTriangle': AlertTriangle,
    'Repeat': Repeat
};

export default function MethodsPage({ onBack }) {
    return (
        <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-32">
            {/* Cabeçalho */}
            <div className="mb-8">
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onBack}
                    className="uppercase font-bold tracking-wider"
                    leftIcon={<ChevronLeft size={16} />}
                >
                    VOLTAR
                </Button>

                <h1 className="text-3xl font-bold text-white mb-2">Métodos de Treino</h1>
                <p className="text-slate-400 max-w-2xl">
                    Conheça os principais métodos e técnicas para maximizar seus resultados na musculação.
                </p>
            </div>

            {/* Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainingMethods.map((method) => {
                    const Icon = iconMap[method.icon] || Repeat;

                    return (
                        <div key={method.id} className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 flex flex-col h-full hover:border-slate-700 transition-colors">
                            {/* Cabeçalho do Cartão */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                                    <Icon size={24} className="text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-white leading-tight">{method.name}</h3>
                            </div>

                            {/* Descrição Curta */}
                            <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                {method.description}
                            </p>

                            <div className="space-y-6 flex-1">
                                {/* Como Executar */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">Como Executar</h4>
                                    <ul className="space-y-2">
                                        {method.howTo.map((step, i) => (
                                            <li key={i} className="text-xs text-slate-400 flex gap-2 leading-relaxed">
                                                <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Quando Usar */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">Quando Usar</h4>
                                    <ul className="space-y-2">
                                        {method.whenToUse.map((step, i) => (
                                            <li key={i} className="text-xs text-slate-400 flex gap-2 leading-relaxed">
                                                <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Cuidados - Empurrado para baixo se a altura permitir, mas em fluxo flex */}
                            <div className="mt-8 bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2 text-red-400">
                                    <AlertTriangle size={12} />
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest">Cuidados</h4>
                                </div>
                                <ul className="space-y-2">
                                    {method.caution.map((step, i) => (
                                        <li key={i} className="text-xs text-red-200/60 flex gap-2 leading-relaxed">
                                            <span className="w-1 h-1 rounded-full bg-red-500/20 mt-1.5 shrink-0" />
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}