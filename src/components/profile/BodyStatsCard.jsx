import { Activity } from 'lucide-react';
import { ProfileSection } from './ProfileSection';

/**
 * Dados corporais: peso, altura, idade e IMC.
 * `bmi` já vem calculado da página (null quando faltam peso/altura).
 */
export function BodyStatsCard({ profile, bmi }) {
    return (
        <ProfileSection icon={<Activity size={18} />} title="Dados Corporais">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-2">
                {/* Weight */}
                <div className="flex items-center gap-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">Peso</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">{profile.weight || '--'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">kg</span>
                    </div>
                </div>

                {/* Height */}
                <div className="flex items-center gap-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">Altura</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">{profile.height || '--'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">cm</span>
                    </div>
                </div>

                {/* Age */}
                <div className="flex items-center gap-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">Idade</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-white">{profile.age || '--'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">anos</span>
                    </div>
                </div>

                {/* BMI */}
                <div className="flex items-center gap-6">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[60px]">IMC</p>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-bold ${bmi ? 'text-white' : 'text-slate-600'}`}>
                            {bmi || '--'}
                        </span>
                    </div>
                </div>
            </div>
        </ProfileSection>
    );
}
