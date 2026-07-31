import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupRoundNotice } from './GroupRoundNotice';
import { getGroupRoundPreview } from '../../utils/exerciseGroups';

// Os dados vêm do helper real, não de objetos montados à mão: assim o teste
// quebra se a forma do `getGroupRoundPreview` mudar.
const pair = (completedFlags = [[false, false], [false, false]]) => [
    { id: 'a', name: 'Puxada pela frente pronada', groupId: 'g1', sets: completedFlags[0].map(completed => ({ completed })) },
    { id: 'b', name: 'Puxada pegada supinada', groupId: 'g1', sets: completedFlags[1].map(completed => ({ completed })) }
];

describe('GroupRoundNotice', () => {
    it('não renderiza nada para exercício avulso', () => {
        const { container } = render(<GroupRoundNotice round={null} currentSet={1} totalSets={3} />);
        expect(container).toBeEmptyDOMElement();
    });

    describe('volta ainda zerada', () => {
        it('lista os exercícios da volta em ordem, marcando o atual', () => {
            render(<GroupRoundNotice round={getGroupRoundPreview(pair(), 0)} currentSet={1} totalSets={2} />);

            expect(screen.getByText(/Bi-set/)).toBeInTheDocument();
            expect(screen.getByText(/prepare os dois/i)).toBeInTheDocument();
            expect(screen.getByText('Puxada pela frente pronada')).toBeInTheDocument();
            expect(screen.getByText('Puxada pegada supinada')).toBeInTheDocument();
            expect(screen.getByText('agora')).toBeInTheDocument();
        });

        it('usa "prepare todos" em grupos maiores que dois', () => {
            const trio = [
                { id: 'a', name: 'A', groupId: 'g1', sets: [{ completed: false }] },
                { id: 'b', name: 'B', groupId: 'g1', sets: [{ completed: false }] },
                { id: 'c', name: 'C', groupId: 'g1', sets: [{ completed: false }] }
            ];
            render(<GroupRoundNotice round={getGroupRoundPreview(trio, 0)} currentSet={1} totalSets={1} />);

            expect(screen.getByText(/Tri-set/)).toBeInTheDocument();
            expect(screen.getByText(/prepare todos/i)).toBeInTheDocument();
        });
    });

    describe('volta em andamento', () => {
        const started = () => pair([[true, false], [false, false]]);

        it('anuncia o próximo exercício do grupo', () => {
            render(<GroupRoundNotice round={getGroupRoundPreview(started(), 0)} currentSet={2} totalSets={2} />);

            expect(screen.queryByText(/prepare/i)).not.toBeInTheDocument();
            expect(screen.getByText('Depois desta série')).toBeInTheDocument();
            expect(screen.getByText('Puxada pegada supinada')).toBeInTheDocument();
        });

        it('no último membro, anuncia a volta ao primeiro', () => {
            render(<GroupRoundNotice round={getGroupRoundPreview(started(), 1)} currentSet={1} totalSets={2} />);

            expect(screen.getByText('Depois desta série, volta para')).toBeInTheDocument();
            expect(screen.getByText('Puxada pela frente pronada')).toBeInTheDocument();
        });

        // O nome fica numa linha própria justamente para não ser truncado:
        // exercícios de bi-set costumam diferir só no fim do nome.
        it('mostra o nome do próximo por inteiro, sem truncar', () => {
            render(<GroupRoundNotice round={getGroupRoundPreview(started(), 0)} currentSet={2} totalSets={2} />);

            const nome = screen.getByText('Puxada pegada supinada');
            expect(nome.className).not.toMatch(/truncate/);
        });

        // Aqui a navegação segue para o próximo exercício da ficha, não de
        // volta ao grupo — a linha não teria o que prometer.
        it('some na última série do último membro', () => {
            render(<GroupRoundNotice round={getGroupRoundPreview(started(), 1)} currentSet={2} totalSets={2} />);

            expect(screen.queryByTestId('group-round-notice')).not.toBeInTheDocument();
        });
    });
});
