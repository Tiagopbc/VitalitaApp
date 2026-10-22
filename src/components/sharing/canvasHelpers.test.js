import { describe, it, expect, vi } from 'vitest';
import {
    applyGlow,
    resetShadow,
    coverFit,
    drawImageCover,
    loadImagesThenDraw,
    displayNameOf
} from './canvasHelpers';

function ctxFake() {
    return {
        fillStyle: null,
        shadowColor: null,
        shadowBlur: null,
        shadowOffsetX: null,
        shadowOffsetY: null,
        drawImage: vi.fn()
    };
}

describe('applyGlow', () => {
    it('define cor, sombra e deslocamento', () => {
        const ctx = ctxFake();
        applyGlow(ctx, '#fff', 'rgba(0,255,255,0.5)', { blur: 20, y: 4 });
        expect(ctx.fillStyle).toBe('#fff');
        expect(ctx.shadowColor).toBe('rgba(0,255,255,0.5)');
        expect(ctx.shadowBlur).toBe(20);
        expect(ctx.shadowOffsetY).toBe(4);
        expect(ctx.shadowOffsetX).toBe(0);
    });

    it('trata blur e y ausentes como zero', () => {
        const ctx = ctxFake();
        applyGlow(ctx, '#fff', 'transparent', {});
        expect(ctx.shadowBlur).toBe(0);
        expect(ctx.shadowOffsetY).toBe(0);
    });

    it('aceita omitir o objeto de deslocamento', () => {
        const ctx = ctxFake();
        applyGlow(ctx, '#fff', 'transparent');
        expect(ctx.shadowBlur).toBe(0);
        expect(ctx.shadowOffsetY).toBe(0);
    });
});

describe('resetShadow', () => {
    it('zera a sombra sem mexer na cor de preenchimento', () => {
        const ctx = ctxFake();
        ctx.fillStyle = '#abc';
        applyGlow(ctx, '#fff', 'azul', { blur: 10, y: 5 });
        resetShadow(ctx);
        expect(ctx.shadowColor).toBe('transparent');
        expect(ctx.shadowBlur).toBe(0);
        expect(ctx.shadowOffsetY).toBe(0);
        expect(ctx.fillStyle).toBe('#fff');
    });
});

describe('coverFit', () => {
    it('cobre o canvas por inteiro quando a imagem é mais larga', () => {
        const r = coverFit({ width: 2000, height: 1000 }, 1080, 1080);
        expect(r.largura).toBeGreaterThanOrEqual(1080);
        expect(r.altura).toBeGreaterThanOrEqual(1080);
    });

    it('cobre o canvas por inteiro quando a imagem é mais alta', () => {
        const r = coverFit({ width: 1000, height: 2000 }, 1080, 1080);
        expect(r.largura).toBeGreaterThanOrEqual(1080);
        expect(r.altura).toBeGreaterThanOrEqual(1080);
    });

    it('centraliza o recorte', () => {
        const r = coverFit({ width: 2000, height: 1000 }, 1080, 1080);
        expect(r.dx + r.largura / 2).toBeCloseTo(540);
        expect(r.dy + r.altura / 2).toBeCloseTo(540);
    });

    it('devolve zeros para imagem sem dimensão', () => {
        expect(coverFit({ width: 0, height: 0 }, 1080, 1080)).toEqual({ dx: 0, dy: 0, largura: 0, altura: 0 });
        expect(coverFit(null, 1080, 1080)).toEqual({ dx: 0, dy: 0, largura: 0, altura: 0 });
    });
});

describe('drawImageCover', () => {
    it('desenha com as medidas do coverFit', () => {
        const ctx = ctxFake();
        const img = { width: 2000, height: 1000 };
        drawImageCover(ctx, img, 1080, 1080);
        const { dx, dy, largura, altura } = coverFit(img, 1080, 1080);
        expect(ctx.drawImage).toHaveBeenCalledWith(img, dx, dy, largura, altura);
    });

    it('não desenha imagem sem largura', () => {
        const ctx = ctxFake();
        drawImageCover(ctx, { width: 0, height: 0 }, 1080, 1080);
        expect(ctx.drawImage).not.toHaveBeenCalled();
    });
});

describe('loadImagesThenDraw', () => {
    function imagemFake() {
        return { onload: null, onerror: null, crossOrigin: null, src: null, width: 100, height: 100 };
    }

    it('só desenha depois que todas as imagens resolvem', () => {
        const desenhar = vi.fn();
        const a = imagemFake();
        const b = imagemFake();
        loadImagesThenDraw([[a, '/a.jpg'], [b, '/b.png']], desenhar);

        expect(a.src).toBe('/a.jpg');
        expect(b.src).toBe('/b.png');
        expect(desenhar).not.toHaveBeenCalled();

        a.onload();
        expect(desenhar).not.toHaveBeenCalled();

        b.onload();
        expect(desenhar).toHaveBeenCalledTimes(1);
    });

    // Imagem que falha não pode travar o card num fundo preto.
    it('desenha mesmo quando uma imagem falha', () => {
        const desenhar = vi.fn();
        const a = imagemFake();
        const b = imagemFake();
        loadImagesThenDraw([[a, '/a.jpg'], [b, '/b.png']], desenhar);

        a.onerror();
        b.onload();
        expect(desenhar).toHaveBeenCalledTimes(1);
    });

    it('desenha uma vez só, mesmo se um evento repetir', () => {
        const desenhar = vi.fn();
        const a = imagemFake();
        const b = imagemFake();
        loadImagesThenDraw([[a, '/a.jpg'], [b, '/b.png']], desenhar);

        a.onload();
        b.onload();
        b.onload();
        a.onerror();
        expect(desenhar).toHaveBeenCalledTimes(1);
    });

    it('marca crossOrigin para o canvas não ficar contaminado', () => {
        const a = imagemFake();
        loadImagesThenDraw([[a, '/a.jpg']], vi.fn());
        expect(a.crossOrigin).toBe('anonymous');
    });
});

describe('displayNameOf', () => {
    it('usa o nome quando há um', () => {
        expect(displayNameOf('Tiago')).toBe('Tiago');
    });

    it('tira espaços das pontas', () => {
        expect(displayNameOf('  Tiago  ')).toBe('Tiago');
    });

    it('cai para Atleta quando vazio, só espaço ou ausente', () => {
        for (const v of ['', '   ', null, undefined]) {
            expect(displayNameOf(v)).toBe('Atleta');
        }
    });
});
