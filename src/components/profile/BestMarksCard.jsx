import { Trophy } from 'lucide-react';
import { SectionHeader } from '../design-system/SectionHeader';

/**
 * Melhores marcas (TOP 4 dos máximos por exercício), preenchendo com
 * placeholders quando há menos de 4 registros.
 */
export function BestMarksCard({ stats }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mt-6">
            <SectionHeader icon={<Trophy size={18} className="text-amber-500" />} title="Melhores Marcas" />

            <div className="grid grid-cols-2 gap-3">
                {(() => {
                    // 1. Obter todos os máximos
                    const allMaxes = stats?.exerciseMaxes ? Object.entries(stats.exerciseMaxes) : [];
                    // 2. Ordenar por peso desc
                    const sortedMaxes = allMaxes.sort(([, weightA], [, weightB]) => weightB - weightA);
                    // 3. Pegar top 4
                    const top4 = sortedMaxes.slice(0, 4);

                    // 4. Preencher com placeholders se menos que 4
                    const displayItems = [...top4];
                    while (displayItems.length < 4) {
                        displayItems.push(null);
                    }

                    return displayItems.map((item, index) => {
                        if (!item) {
                            // Placeholder
                            return (
                                <div key={`placeholder-${index}`}>
                                    <p className="text-sm text-slate-500 mb-1">--</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-slate-700">--</span>
                                    </div>
                                </div>
                            );
                        }

                        const [name, weight] = item;
                        const displayName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

                        return (
                            <div key={name}>
                                <p className="text-sm text-slate-500 mb-1 truncate" title={displayName}>{displayName}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-white">{weight}</span>
                                    <span className="text-xs text-slate-500">kg</span>
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}
