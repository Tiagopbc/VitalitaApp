/**
 * CreateWorkoutPage.jsx
 * Criar e editar fichas de treino: nome, exercícios (séries, repetições,
 * método, carga alvo), agrupamento em bi-set/tri-set e, na criação, a
 * importação de um PDF com fila de revisão.
 *
 * Orquestrador fino (D18): estado e ações em src/hooks/create-workout/, JSX
 * de cada parte em src/components/create-workout/. Aqui ficam só a leitura da
 * rota, a composição e os botões de adicionar e salvar.
 */
import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell, Plus } from 'lucide-react';
import { Button } from '../components/design-system/Button';
import { PageHeader } from '../components/design-system/PageHeader';
import { ExerciseList } from '../components/create-workout/ExerciseList';
import { ExerciseFormModal } from '../components/create-workout/ExerciseFormModal';
import { PdfImportPanel } from '../components/create-workout/PdfImportPanel';
import { isPdfImportEnabled } from '../services/workoutPdfImport';
import { useWorkoutDraft } from '../hooks/create-workout/useWorkoutDraft';
import { useExerciseEditor } from '../hooks/create-workout/useExerciseEditor';
import { usePdfImportQueue } from '../hooks/create-workout/usePdfImportQueue';
import { useSaveWorkout } from '../hooks/create-workout/useSaveWorkout';

export default function CreateWorkoutPage({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { initialData, creationContext } = location.state || {};
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('editId');
    const onBack = () => navigate(-1);

    const { workoutName, setWorkoutName, exercises, setExercises, loadingDraft, replaceDraft } =
        useWorkoutDraft({ initialData, editId });
    const editor = useExerciseEditor({ exercises, setExercises });

    function loadWorkoutIntoForm(workout) {
        replaceDraft(workout);
        editor.hideEditor();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Importação por PDF (só na criação, e só onde o servidor está configurado;
    // a revisão acontece nesta própria tela)
    const canImportPdf = !initialData?.id && !editId && isPdfImportEnabled();
    const pdf = usePdfImportQueue({ loadWorkoutIntoForm });

    const { saving, handleSave } = useSaveWorkout({
        user,
        initialData,
        creationContext,
        workoutName,
        exercises,
        advanceQueue: pdf.advanceQueue,
        onBack
    });
    // Carregar por ?editId= e salvar mostram o mesmo estado no botão, como antes.
    const loading = loadingDraft || saving;

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pt-2 pb-8 lg:pt-[calc(1.5rem+env(safe-area-inset-top))] lg:pb-12">
            <PageHeader
                title={initialData ? 'Editar Treino' : 'Criar Novo Treino'}
                description="Monte a ficha com exercícios, séries, repetições e método de execução."
                icon={<Dumbbell size={20} />}
                onBack={onBack}
            />

            <PdfImportPanel
                canImport={canImportPdf}
                importQueue={pdf.importQueue}
                importing={pdf.importingPdf}
                inputRef={pdf.pdfInputRef}
                onFileSelected={pdf.handlePdfSelected}
            />

            {/* Entrada do Nome do Treino */}
            <div className="mb-8">
                <label className="flex flex-col gap-2 text-[0.85rem] text-slate-400 font-medium">
                    Nome do Treino
                    <input
                        type="text"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        placeholder="Ex: Treino A - Peito e Tríceps"
                        className="w-full rounded-xl border border-blue-800/60 bg-[#0f172a] text-gray-200 px-3.5 py-3 text-[0.95rem] outline-none focus:border-blue-500/95 focus:ring-1 focus:ring-blue-600/70 transition-all placeholder:text-slate-600 font-medium"
                    />
                </label>
            </div>

            <ExerciseList
                exercises={exercises}
                showAddExercise={editor.showAddExercise}
                onReorder={setExercises}
                onAddFirst={editor.openNewExercise}
                onEdit={editor.handleEditExercise}
                onRemove={editor.removeExercise}
                onToggleLink={editor.handleToggleLink}
            />

            {editor.showAddExercise && (
                <ExerciseFormModal
                    editingExerciseId={editor.editingExerciseId}
                    newExercise={editor.newExercise}
                    setNewExercise={editor.setNewExercise}
                    suggestions={editor.suggestions}
                    isSearching={editor.isSearching}
                    onSelectSuggestion={editor.handleSelectSuggestion}
                    onClose={editor.closeEditor}
                    onSubmit={editor.handleAddExercise}
                />
            )}

            {!editor.showAddExercise && exercises.length > 0 && (
                <Button
                    onClick={editor.openNewExercise}
                    variant="secondary"
                    fullWidth
                    className="mb-6 border-dashed border-slate-600/50 bg-slate-900/30 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-950/10 h-14"
                    leftIcon={<Plus size={18} />}
                >
                    Adicionar Exercício
                </Button>
            )}

            <Button
                onClick={handleSave}
                loading={loading}
                disabled={loading || exercises.length === 0 || !workoutName}
                variant="primary"
                size="lg"
                fullWidth
                className="shadow-xl disabled:border-slate-700 disabled:bg-slate-900/60 disabled:bg-none disabled:text-slate-500 disabled:shadow-none disabled:opacity-100"
            >
                {loading
                    ? 'Salvando...'
                    : pdf.hasNextInQueue
                        ? 'Salvar e revisar o próximo'
                        : 'Salvar Treino'}
            </Button>
            {(exercises.length === 0 || !workoutName) && !loading && (
                <p className="mt-3 text-center text-xs text-slate-500">
                    Informe o nome e adicione pelo menos um exercício para salvar.
                </p>
            )}
        </div>
    );
}
