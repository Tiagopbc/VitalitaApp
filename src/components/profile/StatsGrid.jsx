import { Activity, BicepsFlexed, Dumbbell, Trophy } from 'lucide-react';

/**
 * Grade de estatísticas: treinos (clicável → histórico), semanas na meta,
 * volume total e recordes.
 */
export function StatsGrid({ stats, onNavigateToHistory }) {
    return (
        <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
            {/* Treinos (Clickable) */}
            <button
                onClick={onNavigateToHistory}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left"
            >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Dumbbell size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-0.5">Treinos</p>
                    <p className="text-xl md:text-3xl font-bold text-white">{stats?.totalWorkouts || 0}</p>
                </div>
            </button>

            {/* Streak */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Activity size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-0.5">Semanas na Meta</p>
                    <p className="text-xl md:text-3xl font-bold text-white">{stats?.weeklyStreak || 0}</p>
                </div>
            </div>

            {/* Volume (Static) */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <BicepsFlexed size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-0.5">Volume</p>
                    <p className="text-xl md:text-3xl font-bold text-white">
                        {((stats?.totalTonnageKg || 0) / 1000).toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">ton</p>
                </div>
            </div>

            {/* Records */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Trophy size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-0.5">Recordes</p>
                    <p className="text-xl md:text-3xl font-bold text-white">{stats?.prsCount || 0}</p>
                </div>
            </div>
        </div>
    );
}
