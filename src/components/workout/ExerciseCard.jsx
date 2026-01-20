import { motion } from 'framer-motion';
import { TrendingUp, MoreVertical, ChevronRight } from 'lucide-react';

export function ExerciseCard({
    name,
    muscleGroup,
    lastWeight,
    lastReps,
    sets,
    personalRecord,
    onPress
}) {
    const hasProgress = lastWeight && personalRecord && lastWeight >= personalRecord;

    return (
        <motion.div
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPress}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-4">
                {/* Info do Exercício */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate uppercase">{name}</h3>
                        {hasProgress && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded-full border border-yellow-500/30"
                            >
                                <TrendingUp size={12} className="text-yellow-400" />
                                <span className="text-xs font-bold text-yellow-400">PR!</span>
                            </motion.div>
                        )}
                    </div>

                    <p className="text-sm text-slate-400">{muscleGroup}</p>

                    {/* Última Performance */}
                    {lastWeight && lastReps && (
                        <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-mono font-bold text-cyan-400">{lastWeight}</span>
                                <span className="text-xs text-slate-500">kg</span>
                            </div>
                            <span className="text-slate-600">×</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-mono font-bold text-slate-300">{lastReps}</span>
                                <span className="text-xs text-slate-500">reps</span>
                            </div>
                            <span className="text-slate-600">×</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-base font-mono font-bold text-slate-300">{sets}</span>
                                <span className="text-base text-slate-500">sets</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            // Lidar com mais opções
                        }}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreVertical size={18} className="text-slate-400" />
                    </motion.button>

                    <ChevronRight
                        size={20}
                        className="text-slate-600 group-hover:text-cyan-400 transition-colors"
                    />
                </div>
            </div>
        </motion.div>
    );
}
