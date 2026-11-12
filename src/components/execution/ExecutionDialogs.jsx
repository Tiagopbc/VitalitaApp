/**
 * ExecutionDialogs.jsx
 * Diálogos de apoio da tela de execução: explicação do método, ferramentas de
 * academia, cancelar o treino e confirmar o fim. JSX movido de
 * WorkoutExecutionPage; o estado de cada um continua na página.
 */
import React from 'react';
import MethodModal from '../MethodModal';
import { CancelWorkoutModal } from './CancelWorkoutModal';
import { ConfirmFinishModal } from './ConfirmFinishModal';

const GymToolsModal = React.lazy(() => import('./GymToolsModal').then(module => ({ default: module.GymToolsModal })));

export function ExecutionDialogs({
    selectedMethod,
    onCloseMethod,
    showGymTools,
    onCloseGymTools,
    showCancelModal,
    onCloseCancel,
    onConfirmDiscard,
    showConfirmFinishModal,
    onCloseConfirmFinish,
    onConfirmFinish
}) {
    return (
        <>
            <MethodModal
                methodName={selectedMethod}
                onClose={onCloseMethod}
            />

            {showGymTools && (
                <React.Suspense fallback={null}>
                    <GymToolsModal
                        isOpen={showGymTools}
                        onClose={onCloseGymTools}
                    />
                </React.Suspense>
            )}

            {/* MODAL DE CANCELAMENTO */}
            {showCancelModal && (
                <CancelWorkoutModal
                    onClose={onCloseCancel}
                    onConfirm={onConfirmDiscard}
                />
            )}

            {/* MODAL DE CONFIRMAÇÃO DE FINALIZAÇÃO */}
            {showConfirmFinishModal && (
                <ConfirmFinishModal
                    onClose={onCloseConfirmFinish}
                    onConfirm={onConfirmFinish}
                />
            )}
        </>
    );
}
