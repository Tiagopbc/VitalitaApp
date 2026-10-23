import { Minus, Plus, X } from 'lucide-react';
import { Button } from '../design-system/Button';

/**
 * Modal de edição de perfil. Estado permanece na página; o modal apenas
 * reflete `profile` e emite mudanças via `onChange` / `onWeeklyGoalDelta`.
 */
export function EditProfileModal({ profile, saving, onClose, onChange, onSave, onWeeklyGoalDelta }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">Editar Perfil</h2>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="profile-name" className="block text-xs font-medium text-slate-400 mb-1.5">Nome Completo</label>
                        <input
                            id="profile-name"
                            type="text"
                            name="displayName"
                            value={profile.displayName}
                            onChange={onChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Seu nome"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="profile-email" className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                        <input
                            id="profile-email"
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={onChange}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Weight */}
                        <div>
                            <label htmlFor="profile-weight" className="block text-xs font-medium text-slate-400 mb-1.5">Peso (kg)</label>
                            <input
                                id="profile-weight"
                                type="number"
                                name="weight"
                                value={profile.weight}
                                onChange={onChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="0.0"
                            />
                        </div>
                        {/* Height */}
                        <div>
                            <label htmlFor="profile-height" className="block text-xs font-medium text-slate-400 mb-1.5">Altura (cm)</label>
                            <input
                                id="profile-height"
                                type="number"
                                name="height"
                                value={profile.height}
                                onChange={onChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Age */}
                        <div>
                            <label htmlFor="profile-age" className="block text-xs font-medium text-slate-400 mb-1.5">Idade</label>
                            <input
                                id="profile-age"
                                type="number"
                                name="age"
                                value={profile.age}
                                onChange={onChange}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="0"
                            />
                        </div>
                        {/* Weekly Goal */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Meta Semanal</label>
                            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2">
                                <button
                                    onClick={() => onWeeklyGoalDelta(-1)}
                                    aria-label="Diminuir meta semanal"
                                    className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="flex-1 text-center font-bold text-white">{profile.weeklyGoal}</span>
                                <button
                                    onClick={() => onWeeklyGoalDelta(1)}
                                    aria-label="Aumentar meta semanal"
                                    className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <Button
                        onClick={onSave}
                        loading={saving}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
                    >
                        Salvar Alterações
                    </Button>
                </div>
            </div>
        </div>
    );
}
