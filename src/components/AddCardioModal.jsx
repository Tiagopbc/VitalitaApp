import React, { useState } from 'react';
import { Activity, Clock, Navigation, Flame, X, Check } from 'lucide-react';
import { Button } from './design-system/Button';
import { workoutService } from '../services/workoutService';
import { toast } from 'sonner';

export function AddCardioModal({ isOpen, onClose, user }) {
    const [activityType, setActivityType] = useState('Corrida');
    const [durationMin, setDurationMin] = useState('');
    const [distanceKm, setDistanceKm] = useState('');
    const [intensity, setIntensity] = useState('Moderado');
    const [calories, setCalories] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const activityOptions = ['Caminhada', 'Corrida', 'Bicicleta', 'Elíptico'];
    const intensityOptions = [
        { label: 'Leve', color: 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]' },
        { label: 'Moderado', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]' },
        { label: 'Intenso', color: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' }
    ];

    const handleSave = async () => {
        if (!durationMin || durationMin <= 0) {
            toast.error('Informe a duração do exercício.');
            return;
        }

        setIsSaving(true);
        try {
            await workoutService.saveCardioSession(user.uid, {
                activityType,
                durationMin: parseInt(durationMin, 10),
                distanceKm: parseFloat(distanceKm) || 0,
                intensity,
                calories: parseInt(calories, 10) || 0,
                notes
            });
            toast.success('Cardio registrado com sucesso!');
            onClose();
        } catch (error) {
            toast.error('Erro ao registrar cardio.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50 relative overflow-hidden">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                            <Activity className="text-cyan-400" size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Adicionar Cardio</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-6">
                    
                    {/* Activity Type */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Atividade</label>
                        <div className="grid grid-cols-2 gap-2">
                            {activityOptions.map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setActivityType(opt)}
                                    className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all border ${
                                        activityType === opt 
                                            ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={14} className="text-blue-400" /> Duração (min) <span className="text-cyan-500">*</span>
                            </label>
                            <input 
                                type="number" 
                                value={durationMin}
                                onChange={e => setDurationMin(e.target.value)}
                                placeholder="Ex: 30"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Navigation size={14} className="text-indigo-400" /> Distância (km)
                            </label>
                            <input 
                                type="number" 
                                step="0.1"
                                value={distanceKm}
                                onChange={e => setDistanceKm(e.target.value)}
                                placeholder="Ex: 5.2"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {/* Intensity */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Intensidade (Esforço)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {intensityOptions.map(opt => (
                                <button
                                    key={opt.label}
                                    onClick={() => setIntensity(opt.label)}
                                    className={`py-2 px-2 rounded-xl text-sm font-bold transition-all border ${
                                        intensity === opt.label 
                                            ? opt.color
                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800 hover:border-slate-700 hover:text-slate-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calories & Notes */}
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Flame size={14} className="text-orange-400" /> Calorias Queimadas
                            </label>
                            <input 
                                type="number" 
                                value={calories}
                                onChange={e => setCalories(e.target.value)}
                                placeholder="Opcional (Ex: 350)"
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Anotações
                            </label>
                            <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Como foi o treino? (Opcional)"
                                rows={2}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none text-sm"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-800 bg-slate-900/80">
                    <Button
                        variant="primary"
                        className="w-full py-3.5 text-base rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                        onClick={handleSave}
                        disabled={isSaving}
                        leftIcon={isSaving ? <Activity className="animate-spin" size={18} /> : <Check size={18} />}
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Treino'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
