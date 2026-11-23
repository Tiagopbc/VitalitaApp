import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Desenha na hora, sem esperar imagem carregar (jsdom não carrega imagens).
vi.mock('./canvasHelpers', async (importOriginal) => ({
    ...(await importOriginal()),
    loadImagesThenDraw: (_pares, desenhar) => desenhar(),
}));

import { ShareableWorkoutCard } from './ShareableWorkoutCard';

const session = { volumeLoad: 13659, templateName: 'Treino A - Costas e bíceps', duration: '64min', exercisesCount: 7 };

function contextoGravador() {
    const chamadas = [];
    const gradiente = { addColorStop: vi.fn() };
    const ctx = new Proxy({}, {
        get(alvo, nome) {
            if (nome in alvo) return alvo[nome];
            if (nome === 'createLinearGradient' || nome === 'createRadialGradient') {
                return (...args) => { chamadas.push([nome, args]); return gradiente; };
            }
            if (nome === 'measureText') return (texto) => ({ width: texto.length * 20 });
            return (...args) => chamadas.push([nome, args]);
        },
        set(alvo, nome, valor) { alvo[nome] = valor; return true; },
    });
    return { ctx, chamadas };
}

describe('ShareableWorkoutCard', () => {
    let gravador;
    beforeEach(() => {
        gravador = contextoGravador();
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(gravador.ctx);
    });
    afterEach(() => vi.restoreAllMocks());

    const textos = () => gravador.chamadas.filter(([n]) => n === 'fillText').map(([, [t]]) => t);

    it('escreve os dados do treino em texto sólido', () => {
        render(<ShareableWorkoutCard ref={createRef()} session={session} userName="Tiago" />);
        expect(textos()).toEqual(expect.arrayContaining([
            'TREINO CONCLUÍDO', 'Tiago', '13.659', 'KG LEVANTADOS',
            'Treino A', 'Costas e bíceps', '64 min', '7 exercícios',
        ]));
    });

    // O "KILOS" só de contorno e o "VOLUME EMPILHADO" sumiam sobre os halteres.
    it('não usa texto vazado nem a legenda que se perdia no fundo', () => {
        render(<ShareableWorkoutCard ref={createRef()} session={session} userName="Tiago" />);
        expect(gravador.chamadas.some(([n]) => n === 'strokeText')).toBe(false);
        expect(textos()).not.toContain('KILOS');
        expect(textos()).not.toContain('VOLUME EMPILHADO');
    });

    // Véus em degradê escurecem topo, centro e rodapé para o texto ter contraste.
    it('escurece a foto atrás do texto com degradês', () => {
        render(<ShareableWorkoutCard ref={createRef()} session={session} userName="Tiago" />);
        const nomes = gravador.chamadas.map(([n]) => n);
        expect(nomes.filter((n) => n === 'createLinearGradient').length).toBeGreaterThanOrEqual(2);
        expect(nomes).toContain('createRadialGradient');
    });
});
