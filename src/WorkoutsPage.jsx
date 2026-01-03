/**
 * WorkoutsPage.jsx
 * Exibe uma grade de modelos de treino disponíveis para o usuário.
 * Suporta pesquisa, filtragem (por empurrar/puxar/pernas/etc) e classificação de modelos.
 */
import React, { useState, useRef, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, query, where, getDocs, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

import {
    Search,
    Plus,
    Filter,
    Dumbbell,
    Clock,
    Calendar,
    ChevronRight,
    MoreVertical,
    Trophy,
    TrendingUp,
    Play,
    Star,
    X,
    Flame,
    Check,
    Edit2,
    Copy,
    Trash2
} from 'lucide-react';
import { RippleButton } from './components/design-system/RippleButton';
import { PremiumCard } from './components/design-system/PremiumCard';
import { PremiumAlert } from './components/design-system/PremiumAlert';

const WEEKLY_STATS = [
    { label: 'Treinos', value: '4', total: '5', icon: Trophy, color: 'text-amber-400' },
    { label: 'Volume', value: '12.4t', icon: Dumbbell, color: 'text-cyan-400' },
    { label: 'Tempo', value: '3h 20m', icon: Clock, color: 'text-purple-400' },
];

const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'push', label: 'Push' },
    { id: 'pull', label: 'Pull' },
    { id: 'legs', label: 'Pernas' },
    { id: 'fullbody', label: 'Full Body' },
];

const SORT_OPTIONS = [
    { id: 'recent', label: 'Recentes' },
    { id: 'frequency', label: 'Frequência' },
    { id: 'name', label: 'Nome' },
];

export default function WorkoutsPage({ onNavigateToCreate, onNavigateToWorkout, user }) {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [isSearchActive, setIsSearchActive] = useState(false);

    // Menu States
    const [activeSortMenu, setActiveSortMenu] = useState(false);
    const [activeCardMenu, setActiveCardMenu] = useState(null);
    const sortMenuRef = useRef(null);
    // Alert State
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
        type: 'danger' // default
    });


    // Fetch Workouts
    useEffect(() => {
        async function fetchWorkouts() {
            setLoading(true);
            try {
                // Fetch all templates for now. 
                // In a real app, you might want to filter by owner: where('userId', '==', user.uid)
                // For now we just get them all to ensure we see data.
                const q = query(collection(db, 'workout_templates')); // , where('userId', '==', user.uid)
                const snapshot = await getDocs(q);

                const loadedWorkouts = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        exercisesCount: data.exercises ? data.exercises.length : 0, // Keep count for UI
                        exercises: data.exercises || [], // Store full array for Edit/Duplicate
                        duration: data.estimatedDuration || '45-60min',
                        muscleGroups: data.muscleGroups || [],
                        lastPerformed: 'Nunca', // Would need separate history query
                        lastPerformedDate: null,
                        frequency: '1x/sem',
                        timesPerformed: 0,
                        isFavorite: false, // data.isFavorite
                        category: data.category || 'fullbody',
                        completedToday: false
                    };
                });

                setWorkouts(loadedWorkouts);
            } catch (error) {
                console.error("Error fetching workouts:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchWorkouts();
    }, [user]);

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
                setActiveSortMenu(false);
            }

            // Fix: Check if click is inside the menu dropdown or the toggle button
            const isInsideMenu = event.target.closest('.workout-card-menu-dropdown');
            const isInsideToggle = event.target.closest('.card-menu-btn');

            if (activeCardMenu && !isInsideMenu && !isInsideToggle) {
                setActiveCardMenu(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCardMenu]);

    // Filter Logic
    const filteredWorkouts = workouts.filter(workout => {
        const matchesCategory = selectedFilter === 'all' || workout.category === selectedFilter;
        const matchesSearch = workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (workout.muscleGroups && workout.muscleGroups.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesCategory && matchesSearch;
    }).sort((a, b) => {
        if (sortBy === 'recent') {
            // Since we don't have real dates yet, assume 0
            if (!a.lastPerformedDate) return 1;
            if (!b.lastPerformedDate) return -1;
            return new Date(b.lastPerformedDate) - new Date(a.lastPerformedDate);
        }
        if (sortBy === 'most_trained') return b.timesPerformed - a.timesPerformed;
        if (sortBy === 'favorites') return (b.isFavorite === a.isFavorite) ? 0 : b.isFavorite ? 1 : -1;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
    });

    const handleCardClick = (id, name) => {
        onNavigateToWorkout(id, name);
    };

    const handleMenuAction = async (e, action, workout) => {
        e.stopPropagation();
        setActiveCardMenu(null);

        try {
            if (action === 'delete') {
                // Native confirm for reliability
                if (window.confirm(`Tem certeza que deseja excluir "${workout.name}"?`)) {
                    try {
                        const ref = doc(db, 'workout_templates', workout.id);
                        await deleteDoc(ref);

                        // Update local state instead of reloading
                        setWorkouts(prev => prev.filter(w => w.id !== workout.id));

                        // Optional: subtle feedback instead of blocking alert
                        // alert("Treino excluído com sucesso!"); 
                    } catch (err) {
                        console.error("Delete error", err);
                        alert(`ERRO AO EXCLUIR: ${err.message}`);
                    }
                }
            } else if (action === 'duplicate') {
                const newWorkoutData = {
                    name: `${workout.name} (Cópia)`,
                    exercises: workout.exercises || [],
                    category: workout.category,
                    estimatedDuration: workout.duration,
                    userId: user.uid,
                    createdAt: new Date().toISOString()
                };

                await addDoc(collection(db, 'workout_templates'), newWorkoutData);
                window.location.reload();

            } else if (action === 'edit') {
                // Edit Logic
                onNavigateToCreate(workout);
            }
        } catch (error) {
            console.error("Action error:", error);
        }
    };

    return (
        <div className="min-h-screen pb-32 pt-20 px-4 lg:px-8 max-w-7xl mx-auto" onClick={() => { }}>

            {/* --- HEADER --- */}
            <header className="flex flex-col gap-4 mb-8 sticky top-0 z-40  pb-4 transition-all">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Meus Treinos</h1>

                    <button
                        onClick={() => setIsSearchActive(!isSearchActive)}
                        className={`p-3 rounded-full transition-all duration-300 ${isSearchActive ? 'bg-slate-800 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        {isSearchActive ? <X size={20} /> : <Search size={20} />}
                    </button>
                </div>

                {/* Search Bar Expandable */}
                <div className={`overflow-hidden transition-all duration-300 ${isSearchActive ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar treino..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                            autoFocus={isSearchActive}
                        />
                    </div>
                </div>
            </header>

            {/* --- QUICK STATS --- */}
            <section className="mb-8">
                <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 grid grid-cols-3 divide-x divide-slate-800">
                    {WEEKLY_STATS.map((stat, i) => (
                        <div key={i} className="flex flex-col items-center justify-center text-center px-2">
                            <div className={`mb-2 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-white font-bold text-xl">{stat.value}</span>
                                {stat.total && <span className="text-slate-500 text-xs">/ {stat.total}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- FILTERS & SORTING --- */}
            <section className="mb-6 flex items-center justify-between gap-2 overflow-hidden">
                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
                    {FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 border whitespace-nowrap ${selectedFilter === filter.id
                                ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Sort Button */}
                <div className="relative shrink-0 pb-2" ref={sortMenuRef}>
                    <button
                        onClick={() => setActiveSortMenu(!activeSortMenu)}
                        className={`p-2.5 rounded-xl border transition-all ${activeSortMenu ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'}`}
                    >
                        <Filter size={18} />
                    </button>

                    {/* Sort Dropdown */}
                    {activeSortMenu && (
                        <div className="absolute top-12 right-0 w-48 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-xl">
                            {SORT_OPTIONS.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setSortBy(option.id);
                                        setActiveSortMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white flex items-center justify-between"
                                >
                                    {option.label}
                                    {sortBy === option.id && <Check size={14} className="text-cyan-400" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* --- WORKOUT CARDS GRID --- */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">

                {filteredWorkouts.length > 0 ? (
                    filteredWorkouts.map((workout, idx) => (
                        <PremiumCard
                            key={workout.id}
                            style={{ animationDelay: `${idx * 100}ms` }}
                            onClick={() => handleCardClick(workout.id, workout.name)}
                            className="bg-[#0f172a] hover:border-cyan-500/30 group animate-fade-in-up"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center group-hover:border-cyan-500/20  group-hover:bg-slate-800/50 transition-all shadow-inner">
                                        <Dumbbell size={24} className="text-slate-300 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight">{workout.name}</h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium mt-0.5">
                                            <Calendar size={12} />
                                            {workout.frequency}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 relative">
                                    {workout.isFavorite && <div className="p-2 rounded-full bg-amber-500/10"><Star size={16} className="text-amber-400 fill-amber-400" /></div>}

                                    {/* Menu Button */}
                                    <RippleButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveCardMenu(activeCardMenu === workout.id ? null : workout.id);
                                        }}
                                        className="card-menu-btn text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
                                        haptic="light"
                                    >
                                        <MoreVertical size={20} />
                                    </RippleButton>

                                    {/* Card Context Menu */}
                                    {activeCardMenu === workout.id && (
                                        <div
                                            className="workout-card-menu-dropdown absolute top-10 right-0 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    console.log('Edit clicked');
                                                    handleMenuAction(e, 'edit', workout);
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-cyan-400 flex items-center gap-2 transition-colors border-b border-slate-800/50"
                                            >
                                                <Edit2 size={14} /> Editar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    console.log('Duplicate clicked');
                                                    handleMenuAction(e, 'duplicate', workout);
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors border-b border-slate-800/50"
                                            >
                                                <Copy size={14} /> Duplicar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    console.log('Delete clicked');
                                                    handleMenuAction(e, 'delete', workout);
                                                }}
                                                className="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                                            >
                                                <Trash2 size={14} /> Excluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {workout.muscleGroups.map((tag, i) => (
                                    <span key={i} className="text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700/50">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-slate-950/30 border border-slate-800/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
                                        <Dumbbell size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Exercícios</span>
                                        <span className="text-xs font-bold text-slate-200">{workout.exercisesCount}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
                                        <Clock size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold">Duração</span>
                                        <span className="text-xs font-bold text-slate-200">{workout.duration}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-2">
                                <p className="text-[10px] text-slate-500 font-medium">
                                    Último: <span className="text-slate-300">{workout.lastPerformed}</span>
                                </p>

                                <RippleButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCardClick(workout.id, workout.name);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold text-xs hover:bg-cyan-500 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                    haptic="medium"
                                >
                                    <Play size={14} fill="currentColor" className="group-hover:fill-slate-950" />
                                    INICIAR
                                </RippleButton>
                            </div>

                            {/* Clean Badge for Completed Today */}
                            {workout.completedToday && (
                                <div className="absolute top-5 right-14 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1.5 backdrop-blur-sm">
                                    <Check size={10} strokeWidth={4} />
                                    Feito
                                </div>
                            )}
                        </PremiumCard>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center flex flex-col items-center select-none opacity-50">
                        <div className="w-20 h-20 rounded-3xl bg-slate-800/30 flex items-center justify-center mb-6 border border-slate-700/30">
                            <Search size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300 mb-2">Nenhum treino encontrado</h3>
                        <p className="text-slate-500 text-sm max-w-[200px]">Tente mudar os filtros ou criar um novo treino.</p>
                    </div>
                )}

            </section>

            {/* --- FAB (Create New) --- */}
            {/* --- FAB (Create New) --- */}
            <div className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 z-40 flex flex-col gap-4 items-end">


                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToCreate();
                    }}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
