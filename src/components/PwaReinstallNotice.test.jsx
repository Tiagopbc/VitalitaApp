import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../utils/windowConfig', () => ({
    checkWindowConfig: vi.fn(),
    acknowledgeWindowConfig: vi.fn()
}));

const mockWorkout = { activeWorkoutId: null };
vi.mock('../context/WorkoutContext', () => ({
    useWorkout: () => mockWorkout
}));

import { PwaReinstallNotice } from './PwaReinstallNotice';
import { checkWindowConfig, acknowledgeWindowConfig } from '../utils/windowConfig';

describe('PwaReinstallNotice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockWorkout.activeWorkoutId = null;
        checkWindowConfig.mockReturnValue({ needsReinstall: false });
    });

    it('fica invisível quando a janela instalada está em dia', () => {
        render(<PwaReinstallNotice />);

        expect(screen.queryByText(/Reinstalação/i)).not.toBeInTheDocument();
    });

    it('mostra o passo a passo quando a janela ficou para trás', () => {
        checkWindowConfig.mockReturnValue({ needsReinstall: true });

        render(<PwaReinstallNotice />);

        expect(screen.getByText(/Esta Atualização Pede Reinstalação/i)).toBeInTheDocument();
        expect(screen.getByText(/Remover App/i)).toBeInTheDocument();
        expect(screen.getByText(/Adicionar à Tela de Início/i)).toBeInTheDocument();
    });

    // Reinstalar no meio de um treino é a pior hora possível, e configuração
    // de janela é cosmética: pode esperar.
    it('não interrompe um treino em andamento', () => {
        checkWindowConfig.mockReturnValue({ needsReinstall: true });
        mockWorkout.activeWorkoutId = 'treino-123';

        render(<PwaReinstallNotice />);

        expect(screen.queryByText(/Esta Atualização Pede Reinstalação/i)).not.toBeInTheDocument();
    });

    // O iOS não avisa que a reinstalação aconteceu: a confirmação do usuário é
    // o único sinal, e sem gravá-la o aviso voltaria para sempre.
    it('grava a confirmação quando o usuário diz que já reinstalou', () => {
        checkWindowConfig.mockReturnValue({ needsReinstall: true });
        render(<PwaReinstallNotice />);

        fireEvent.click(screen.getByRole('button', { name: /Já Reinstalei/i }));

        expect(acknowledgeWindowConfig).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(/Esta Atualização Pede Reinstalação/i)).not.toBeInTheDocument();
    });

    // "Agora Não" some da tela, mas não pode marcar como resolvido — senão o
    // usuário perderia o aviso sem nunca ter reinstalado.
    it('adia sem gravar confirmação quando o usuário escolhe Agora Não', () => {
        checkWindowConfig.mockReturnValue({ needsReinstall: true });
        render(<PwaReinstallNotice />);

        fireEvent.click(screen.getByRole('button', { name: /Agora Não/i }));

        expect(acknowledgeWindowConfig).not.toHaveBeenCalled();
        expect(screen.queryByText(/Esta Atualização Pede Reinstalação/i)).not.toBeInTheDocument();
    });
});
