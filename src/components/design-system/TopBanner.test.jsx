import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TopBanner } from './TopBanner';
import { notify, resetNotifyStore, getNotifySnapshot } from '../../utils/notifyStore';

describe('TopBanner', () => {
    beforeEach(() => {
        resetNotifyStore();
    });

    afterEach(() => {
        resetNotifyStore();
    });

    it('não renderiza nada sem aviso', () => {
        render(<TopBanner />);

        expect(screen.queryByTestId('top-banner')).not.toBeInTheDocument();
    });

    it('mostra a mensagem quando o aviso chega', () => {
        render(<TopBanner />);

        act(() => { notify.success('Treino salvo.'); });

        expect(screen.getByTestId('top-banner')).toBeInTheDocument();
        expect(screen.getByText('Treino salvo.')).toBeInTheDocument();
    });

    it('mostra o aviso que já estava no store antes da montagem', () => {
        notify.success('Treino salvo.');

        render(<TopBanner />);

        expect(screen.getByText('Treino salvo.')).toBeInTheDocument();
    });

    it.each([
        ['success', 'bg-emerald-600'],
        ['error', 'bg-red-600'],
        ['info', 'bg-blue-600']
    ])('usa a cor do tipo %s', (tipo, classe) => {
        render(<TopBanner />);

        act(() => { notify[tipo]('Mensagem.'); });

        const barra = screen.getByTestId('top-banner');
        expect(barra).toHaveAttribute('data-type', tipo);
        expect(barra.className).toContain(classe);
    });

    // A cor precisa alcançar o pixel 0: é isso que faz o texto cair na faixa
    // abaixo do relógio em vez de atrás dele.
    it('ancora no topo, de borda a borda', () => {
        render(<TopBanner />);

        act(() => { notify.success('Treino salvo.'); });

        expect(screen.getByTestId('top-banner').className).toContain('top-0');
        expect(screen.getByTestId('top-banner').className).toContain('inset-x-0');
    });

    // Sem botão, a barra não precisa de toque nenhum — e é isso que permite
    // ela ficar acima dos modais de z-9999 sem roubar toque.
    it('não intercepta toque quando não tem ação', () => {
        render(<TopBanner />);

        act(() => { notify.success('Treino salvo.'); });

        expect(screen.getByTestId('top-banner').className).toContain('pointer-events-none');
    });

    it('anuncia erro como alert e sucesso como status', () => {
        render(<TopBanner />);

        act(() => { notify.error('Erro ao salvar treino.'); });
        expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');

        act(() => { notify.success('Treino salvo.'); });
        expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    // Emenda 5a: aviso de bi-set em CreateWorkoutPage tem título e explicação.
    it('mostra a description como segunda linha, abaixo da message', () => {
        render(<TopBanner />);

        act(() => {
            notify.info('Bi-set é executado em dupla', {
                description: 'Agrupar com "Supino" para alternar as séries na execução?'
            });
        });

        expect(screen.getByText('Bi-set é executado em dupla')).toBeInTheDocument();
        expect(
            screen.getByText('Agrupar com "Supino" para alternar as séries na execução?')
        ).toBeInTheDocument();

        const barra = screen.getByTestId('top-banner');
        expect(barra.querySelectorAll('span').length).toBe(2);
    });

    it('sem description, a barra continua com uma linha só', () => {
        render(<TopBanner />);

        act(() => { notify.success('Treino salvo.'); });

        const barra = screen.getByTestId('top-banner');
        expect(barra.querySelectorAll('span').length).toBe(1);
    });

    it('renderiza o botão da ação e o deixa clicável', () => {
        render(<TopBanner />);

        act(() => {
            notify.error('Erro ao carregar dados.', {
                action: { label: 'Tentar Novamente', onClick: vi.fn() }
            });
        });

        const botao = screen.getByRole('button', { name: 'Tentar Novamente' });
        expect(botao.className).toContain('pointer-events-auto');
    });

    it('clique na ação dispara o onClick e fecha a barra', () => {
        const onClick = vi.fn();
        render(<TopBanner />);

        act(() => {
            notify.error('Erro ao carregar dados.', { action: { label: 'Tentar Novamente', onClick } });
        });

        act(() => {
            screen.getByRole('button', { name: 'Tentar Novamente' }).click();
        });

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getNotifySnapshot()).toBeNull();
    });

    // Sensível à ordem: se `handleAction` chamasse `onClick()` antes de
    // `notify.dismiss()`, o `dismiss()` que roda depois apagaria o aviso novo
    // que o onClick acabou de criar (caso de "Tentar Novamente" terminando em
    // `notify.success(...)`). `dismiss()` precisa rodar primeiro.
    it('limpa o aviso anterior antes de disparar o onClick, não depois', () => {
        const onClick = vi.fn(() => notify.success('Reconectado.'));
        render(<TopBanner />);

        act(() => {
            notify.error('Erro ao carregar dados.', { action: { label: 'Tentar Novamente', onClick } });
        });

        act(() => {
            screen.getByRole('button', { name: 'Tentar Novamente' }).click();
        });

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(getNotifySnapshot()).toEqual(
            expect.objectContaining({ type: 'success', message: 'Reconectado.' })
        );
    });
});
