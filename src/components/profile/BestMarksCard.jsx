import { Trophy } from 'lucide-react';
import { ProfileSection } from './ProfileSection';
import { aggregateExerciseMaxes } from '../../utils/exerciseName';

const TOP_MARKS = 4;

/** "LEG PRESS 45°" -> "Leg Press 45°" */
function formatExerciseName(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Melhores marcas (TOP 4 dos máximos por exercício), preenchendo com
 * placeholders quando há menos de 4 registros.
 *
 * Os máximos são agregados por nome normalizado: como `exerciseMaxes` é
 * indexado pelo nome cru, grafias diferentes do mesmo exercício ("Leg Press
 * 45°" e "leg press 45") ocupavam duas vagas do top 4 com a mesma marca.
 */
export function BestMarksCard({ stats }) {
    const topMarks = aggregateExerciseMaxes(stats?.exerciseMaxes)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, TOP_MARKS);

    const slots = [
        ...topMarks,
        ...Array(Math.max(0, TOP_MARKS - topMarks.length)).fill(null)
    ];

    return (
        <ProfileSection icon={<Trophy size={18} className="text-amber-500" />} title="Melhores Marcas">
            <div className="grid grid-cols-2 gap-3">
                {slots.map((item, index) => {
                    if (!item) {
                        return (
                            <div key={`placeholder-${index}`}>
                                <p className="text-sm text-slate-500 mb-1">--</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-slate-700">--</span>
                                </div>
                            </div>
                        );
                    }

                    const displayName = formatExerciseName(item.name);

                    return (
                        <div key={item.name}>
                            <p className="text-sm text-slate-500 mb-1 truncate" title={displayName}>{displayName}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-white">{item.weight}</span>
                                <span className="text-xs text-slate-500">kg</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ProfileSection>
    );
}
