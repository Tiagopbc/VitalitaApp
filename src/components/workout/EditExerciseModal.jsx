import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { PremiumCard } from '../design-system/PremiumCard';
import { RippleButton } from '../design-system/RippleButton';

export function EditExerciseModal({ exercise, onClose, onSave }) {
    if (!exercise) return null;

    return (
        <>
            {/* Fundo (Backdrop) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg px-4 z-50"
            >
                <PremiumCard className="p-6 bg-slate-900 border-slate-800">
                    {/* Cabeçalho */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Editar Exercício</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Atualize os dados do exercício
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <Plus size={24} className="text-slate-400 rotate-45" />
                        </motion.button>
                    </div>

                    {/* Formulário */}
                    <div className="space-y-5">
                        {/* Nome do Exercício */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Nome do Exercício
                            </label>
                            <input
                                type="text"
                                defaultValue={exercise.data.name}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                                placeholder="Ex: Supino Reto"
                            />
                        </div>

                        {/* Grupo Muscular */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Grupo Muscular
                            </label>
                            <input
                                type="text"
                                defaultValue={exercise.data.muscleGroup}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                                placeholder="Ex: Peito"
                            />
                        </div>

                        {/* Grade: Peso, Reps, Sets */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Peso */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Peso (kg)
                                </label>
                                <input
                                    type="number"
                                    defaultValue={exercise.data.lastWeight}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                                    placeholder="80"
                                />
                            </div>

                            {/* Reps */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Reps
                                </label>
                                <input
                                    type="number"
                                    defaultValue={exercise.data.lastReps}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                                    placeholder="10"
                                />
                            </div>

                            {/* Sets */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Sets
                                </label>
                                <input
                                    type="number"
                                    defaultValue={exercise.data.sets}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                                    placeholder="4"
                                />
                            </div>
                        </div>

                        {/* Recorde Pessoal (opcional) */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Recorde Pessoal (kg)
                                <span className="text-slate-500 ml-1">(opcional)</span>
                            </label>
                            <input
                                type="number"
                                defaultValue={exercise.data.personalRecord}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                                placeholder="85"
                            />
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-3 mt-8">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors cursor-pointer"
                        >
                            Cancelar
                        </motion.button>

                        <RippleButton
                            onClick={() => {

                                // Por enquanto apenas fechar, no app real salvaria
                                onSave && onSave(exercise);
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-bold text-center"
                        >
                            Salvar Alterações
                        </RippleButton>
                    </div>
                </PremiumCard>
            </motion.div>
        </>
    );
}
