import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebugPanels } from './DebugPanels';

// Os módulos dos painéis são mockados com fábricas contadas: o ponto do
// componente é que o código deles só seja carregado quando a flag está ligada.
const { carregouPush, carregouAppCheck } = vi.hoisted(() => ({
    carregouPush: vi.fn(),
    carregouAppCheck: vi.fn()
}));

vi.mock('./PushDebugPanel', () => {
    carregouPush();
    return {
        PushDebugPanel: ({ onClose }) => (
            <div>
                push debug
                <button onClick={onClose}>fechar push</button>
            </div>
        )
    };
});

vi.mock('./AppCheckDebugPanel', () => {
    carregouAppCheck();
    return {
        AppCheckDebugPanel: ({ onClose }) => (
            <div>
                app check debug
                <button onClick={onClose}>fechar appcheck</button>
            </div>
        )
    };
});

function setSearch(search) {
    window.history.replaceState({}, '', `/${search}`);
}

describe('DebugPanels', () => {
    beforeEach(() => {
        localStorage.clear();
        setSearch('');
        carregouPush.mockClear();
        carregouAppCheck.mockClear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('sem ?debug= não renderiza nada nem carrega os painéis', async () => {
        const { container } = render(<DebugPanels />);
        // Dá uma volta no event loop: se algum import dinâmico tivesse disparado,
        // a fábrica já teria rodado.
        await new Promise((r) => setTimeout(r, 0));
        expect(container).toBeEmptyDOMElement();
        expect(carregouPush).not.toHaveBeenCalled();
        expect(carregouAppCheck).not.toHaveBeenCalled();
    });

    it('com ?debug=push carrega e mostra só o painel de push', async () => {
        setSearch('?debug=push');
        render(<DebugPanels />);
        expect(await screen.findByText('push debug')).toBeInTheDocument();
        expect(screen.queryByText('app check debug')).not.toBeInTheDocument();
        expect(carregouPush).toHaveBeenCalledTimes(1);
        expect(carregouAppCheck).not.toHaveBeenCalled();
    });

    it('com ?debug=appcheck carrega e mostra só o painel do App Check', async () => {
        setSearch('?debug=appcheck');
        render(<DebugPanels />);
        expect(await screen.findByText('app check debug')).toBeInTheDocument();
        expect(screen.queryByText('push debug')).not.toBeInTheDocument();
        expect(carregouAppCheck).toHaveBeenCalledTimes(1);
    });

    it('fechar o painel desliga a flag persistida', async () => {
        setSearch('?debug=push');
        render(<DebugPanels />);
        fireEvent.click(await screen.findByText('fechar push'));
        await waitFor(() => expect(screen.queryByText('push debug')).not.toBeInTheDocument());
        expect(localStorage.getItem('vitalita:debug:push')).toBeNull();
    });
});
