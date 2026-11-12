/**
 * FinishWorkoutFooter.jsx
 * Rodapé com o "FINALIZAR TREINO", encostado na base da tela pelo fluxo da
 * página. JSX movido de WorkoutExecutionPage.
 */
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../design-system/Button';

export function FinishWorkoutFooter({ saving, onFinish }) {
    return (
        /* `mt-auto` encosta o rodapé na base da tela sem `position:
           fixed` — com ficha curta (série de linha única) o
           "FINALIZAR TREINO" ficava colado no "CONCLUIR SÉRIE" e
           rendia toque errado. O `pb` não repete
           `env(safe-area-inset-bottom)`: o `body` já reserva esse
           espaço e somar de novo deixava o botão boiando acima do
           rodapé real. */
        <div
            data-testid="workout-finish-footer"
            className="w-full mt-auto pt-8 pb-1"
        >
            <div className="max-w-2xl mx-auto flex justify-center">
                <div className="space-y-4 w-full flex flex-col items-center px-4">
                    <Button
                        onClick={onFinish}
                        disabled={saving}
                        variant="success"
                        className="w-auto min-w-[240px] px-8 font-bold h-12 rounded-full tracking-wide flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(34,197,94,0.2)]"
                    >
                        {saving ? (
                            'SALVANDO...'
                        ) : (
                            <>
                                <CheckCircle2 size={18} strokeWidth={3} />
                                FINALIZAR TREINO
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
