import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// `virtual:pwa-register/react` só existe no build (é criado pelo
// vite-plugin-pwa). Sem este mock nenhum teste carregava o componente, e o
// coverage o excluía com PARSE_ERROR ao tentar lê-lo sem transformar o JSX.
const pwa = vi.hoisted(() => ({
    needRefresh: false,
    offlineReady: false,
    setNeedRefresh: vi.fn(),
    setOfflineReady: vi.fn(),
    updateServiceWorker: vi.fn()
}));
vi.mock('virtual:pwa-register/react', () => ({
    useRegisterSW: () => ({
        needRefresh: [pwa.needRefresh, pwa.setNeedRefresh],
        offlineReady: [pwa.offlineReady, pwa.setOfflineReady],
        updateServiceWorker: pwa.updateServiceWorker
    })
}));

const treino = vi.hoisted(() => ({ activeWorkoutId: null }));
vi.mock('../context/WorkoutContext', () => ({
    useWorkout: () => ({ activeWorkoutId: treino.activeWorkoutId })
}));

const notify = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn() }));
vi.mock('../utils/notifyStore', () => ({ notify }));

import { PwaUpdatePrompt } from './PwaUpdatePrompt';

describe('PwaUpdatePrompt', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        pwa.needRefresh = false;
        pwa.offlineReady = false;
        treino.activeWorkoutId = null;
    });

    it('não mostra nada sem versão nova', () => {
        const { container } = render(<PwaUpdatePrompt />);
        expect(container).toBeEmptyDOMElement();
    });

    it('avisa uma vez quando o app fica pronto para uso offline', () => {
        pwa.offlineReady = true;
        render(<PwaUpdatePrompt />);
        expect(notify.success).toHaveBeenCalledWith('Vitalità pronto para uso offline.');
        expect(pwa.setOfflineReady).toHaveBeenCalledWith(false);
    });

    it('sem treino ativo, atualiza na hora', () => {
        pwa.needRefresh = true;
        render(<PwaUpdatePrompt />);

        expect(screen.getByText('Nova Versão Disponível')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Atualizar Agora/ }));
        expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true);
    });

    it('sem treino ativo, "Lembrar Mais Tarde" fecha o aviso', () => {
        pwa.needRefresh = true;
        render(<PwaUpdatePrompt />);

        fireEvent.click(screen.getByRole('button', { name: 'Lembrar Mais Tarde' }));
        expect(pwa.setNeedRefresh).toHaveBeenCalledWith(false);
    });

    it('com treino ativo, bloqueia a atualização para não perder o treino', () => {
        pwa.needRefresh = true;
        treino.activeWorkoutId = 'treino-1';
        render(<PwaUpdatePrompt />);

        expect(screen.getByText('Atualização Aguardando')).toBeInTheDocument();
        const atualizar = screen.getByRole('button', { name: /Atualizar Após o Treino/ });
        expect(atualizar).toBeDisabled();
        fireEvent.click(atualizar);
        expect(pwa.updateServiceWorker).not.toHaveBeenCalled();
    });

    it('com treino ativo, adiar esconde o aviso só durante esse treino', () => {
        pwa.needRefresh = true;
        treino.activeWorkoutId = 'treino-1';
        const { container, rerender } = render(<PwaUpdatePrompt />);

        fireEvent.click(screen.getByRole('button', { name: 'Lembrar Mais Tarde' }));
        expect(container).toBeEmptyDOMElement();
        expect(pwa.setNeedRefresh).not.toHaveBeenCalled();

        treino.activeWorkoutId = 'treino-2';
        rerender(<PwaUpdatePrompt />);
        expect(screen.getByText('Atualização Aguardando')).toBeInTheDocument();
    });
});
