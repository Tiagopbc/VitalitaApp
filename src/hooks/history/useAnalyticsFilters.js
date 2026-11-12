/**
 * useAnalyticsFilters.js
 * Filtros da aba Evolução: templates do usuário, template e exercício
 * selecionados, opções de exercício, os filtros iniciais vindos da URL
 * (?template= e ?exercise=), o modo de busca (template ou global, com termo e
 * exercícios marcados) e o período do gráfico. Lógica movida de HistoryPage
 * (D16) sem mudança.
 */
import { useEffect, useMemo, useState } from 'react';
import { workoutService } from '../../services/workoutService';
import { sortWorkoutTemplates } from '../../utils/workoutTemplateOrder';

export function useAnalyticsFilters({ user, activeTab, initialTemplate, initialExercise }) {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    // --- BUSCA INTELIGENTE ---
    const [searchMode, setSearchMode] = useState('template'); // 'template' | 'global'
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [selectedGlobalExercises, setSelectedGlobalExercises] = useState([]);
    const toggleGlobalExercise = (exName) => {
        setSelectedGlobalExercises(prev =>
            prev.includes(exName)
                ? prev.filter(n => n !== exName)
                : [...prev, exName]
        );
    };

    // --- GRÁFICO ---
    const [chartRange, setChartRange] = useState('3M');

    useEffect(() => {
        async function fetchTemplates() {
            if (activeTab !== 'analytics') return;

            setLoadingTemplates(true);
            try {
                const list = sortWorkoutTemplates(await workoutService.getTemplates(user.uid));
                setTemplates(list);

                if (list.length > 0 && !selectedTemplate) {
                    const firstActiveTemplate = list.find(template => !template.isArchived);
                    let defaultTemplateName = firstActiveTemplate?.name || list[0].name;
                    if (initialTemplate) {
                        const found = list.find((t) => t.name === initialTemplate);
                        if (found) defaultTemplateName = found.name;
                    }
                    setSelectedTemplate(defaultTemplateName);
                }
            } catch (err) {
                console.error('Erro ao carregar templates do histórico', err);
            } finally {
                setLoadingTemplates(false);
            }
        }

        fetchTemplates();
    }, [activeTab, initialTemplate, user?.uid, selectedTemplate]);

    // Opções de exercício derivadas do template escolhido; nada de efeito.
    const exerciseOptions = useMemo(() => {
        if (!selectedTemplate) return [];
        const template = templates.find((t) => t.name === selectedTemplate);
        return template && Array.isArray(template.exercises)
            ? template.exercises.map((ex) => ex.name)
            : [];
    }, [selectedTemplate, templates]);

    // O exercício escolhido fica no estado e começa com o ?exercise= da URL;
    // o exercício efetivo é derivado: vazio sem opções, o escolhido quando
    // existe no template, senão o primeiro. Sem escrita de estado no render
    // nem em efeito.
    const [exercicioEscolhido, setExercicioEscolhido] = useState(() => initialExercise || '');
    let selectedExercise = '';
    if (exerciseOptions.length) {
        selectedExercise = exerciseOptions.includes(exercicioEscolhido)
            ? exercicioEscolhido
            : exerciseOptions[0];
    }

    return {
        templates,
        loadingTemplates,
        selectedTemplate,
        setSelectedTemplate,
        exerciseOptions,
        selectedExercise,
        setSelectedExercise: setExercicioEscolhido,
        searchMode,
        setSearchMode,
        globalSearchTerm,
        setGlobalSearchTerm,
        selectedGlobalExercises,
        toggleGlobalExercise,
        chartRange,
        setChartRange
    };
}
