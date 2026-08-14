/**
 * LayoutMetricsPanel.jsx
 * TEMPORÁRIO — painel de medição para investigar por que o texto da
 * `ExecutionTopBar` sai borrado no PWA em tela cheia e nítido na aba do Safari.
 *
 * Hipótese sob teste: a barra é `position: fixed`, logo vira camada própria de
 * composição; em tela cheia o `env(safe-area-inset-top)` é fracionário, a camada
 * cai fora da grade de pixels do aparelho e o WebKit a reamostra, amolecendo
 * tudo que está dentro. Na aba do Safari o inset é ~0 e o problema some.
 *
 * O que confirma ou derruba: `alturaEmPixelsDoAparelho` e `topoEmPixelsDoAparelho`
 * serem inteiros ou não. Fracionário = reamostragem.
 *
 * Sem flag de propósito: `useDebugPanelFlag` guarda o estado em `localStorage`, e
 * o iOS pode separar o storage do Safari do storage do app da tela inicial — a
 * flag ligada na aba não chegaria onde a medição precisa acontecer.
 *
 * REMOVER assim que a medição for feita.
 */
import React, { useCallback, useState } from 'react';

const inteiro = (n) => Math.abs(n - Math.round(n)) < 0.001;

function medir() {
    if (typeof window === 'undefined') return null;

    // Sonda para ler o valor resolvido de env(safe-area-inset-top): não dá para
    // pedir o valor direto, só aplicar e medir.
    const sonda = document.createElement('div');
    sonda.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top);pointer-events:none;visibility:hidden';
    document.body.appendChild(sonda);
    const safeTop = sonda.getBoundingClientRect().height;
    sonda.remove();

    const barra = document.querySelector('[data-execution-topbar]');
    const r = barra ? barra.getBoundingClientRect() : null;
    const dpr = window.devicePixelRatio;
    const vv = window.visualViewport;

    return {
        telaCheia: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
        dpr,
        safeTop,
        safeTopEmPixelsDoAparelho: safeTop * dpr,
        alturaBarra: r?.height,
        topoBarra: r?.top,
        alturaEmPixelsDoAparelho: r ? r.height * dpr : null,
        topoEmPixelsDoAparelho: r ? r.top * dpr : null,
        paddingTopBarra: barra ? getComputedStyle(barra).paddingTop : null,
        escalaViewport: vv?.scale,
        offsetTopViewport: vv?.offsetTop,
        innerHeight: window.innerHeight,
        screenHeight: window.screen?.height
    };
}

const Linha = ({ nome, valor, alerta }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
        <span style={{ color: '#94a3b8' }}>{nome}</span>
        <span style={{ color: alerta ? '#fca5a5' : '#e2e8f0', fontWeight: 700, textAlign: 'right' }}>{valor}</span>
    </div>
);

export function LayoutMetricsPanel() {
    const [m, setM] = useState(null);
    const remedir = useCallback(() => setM(medir()), []);

    // Medição sob toque, e não em efeito: o lint do projeto barra `setState`
    // síncrono dentro de effect, e medir depois que a tela assentou é mais fiel
    // do que medir no primeiro commit.
    const n = (v, casas = 3) => (typeof v === 'number' ? v.toFixed(casas) : '—');
    const alturaFracionaria = m && typeof m.alturaEmPixelsDoAparelho === 'number' && !inteiro(m.alturaEmPixelsDoAparelho);
    const topoFracionario = m && typeof m.topoEmPixelsDoAparelho === 'number' && !inteiro(m.topoEmPixelsDoAparelho);
    const safeFracionario = m && !inteiro(m.safeTopEmPixelsDoAparelho);

    return (
        <div style={{
            margin: '0 16px 12px', padding: 12, borderRadius: 12,
            border: '1px solid #334155', background: '#0f172a',
            font: '600 12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace'
        }}>
            <div style={{ color: '#67e8f9', fontWeight: 800, marginBottom: 6 }}>MEDIÇÃO TEMPORÁRIA — BARRA</div>

            {!m && (
                <div style={{ color: '#94a3b8' }}>
                    Toque em MEDIR e mande o print desta caixa.
                </div>
            )}

            {m && (
            <>
            <Linha nome="tela cheia" valor={m.telaCheia ? 'sim' : 'não (aba)'} />
            <Linha nome="devicePixelRatio" valor={n(m.dpr, 2)} />
            <Linha nome="safe-area-top (css)" valor={n(m.safeTop)} />
            <Linha nome="safe-area-top (aparelho)" valor={n(m.safeTopEmPixelsDoAparelho)} alerta={safeFracionario} />
            <Linha nome="padding-top da barra" valor={m.paddingTopBarra ?? '—'} />
            <Linha nome="topo da barra (css)" valor={n(m.topoBarra)} />
            <Linha nome="topo (aparelho)" valor={n(m.topoEmPixelsDoAparelho)} alerta={topoFracionario} />
            <Linha nome="altura da barra (css)" valor={n(m.alturaBarra)} />
            <Linha nome="altura (aparelho)" valor={n(m.alturaEmPixelsDoAparelho)} alerta={alturaFracionaria} />
            <Linha nome="escala do viewport" valor={n(m.escalaViewport, 4)} alerta={typeof m.escalaViewport === 'number' && m.escalaViewport !== 1} />
            <Linha nome="offset do viewport" valor={n(m.offsetTopViewport, 2)} />
            <Linha nome="innerHeight / screen" valor={`${m.innerHeight} / ${m.screenHeight ?? '—'}`} />

            <div style={{ marginTop: 8, color: alturaFracionaria || topoFracionario ? '#fca5a5' : '#86efac' }}>
                {alturaFracionaria || topoFracionario
                    ? 'Camada em pixel fracionário — hipótese confirmada.'
                    : 'Camada em pixel inteiro — a hipótese cai, é outra coisa.'}
            </div>
            </>
            )}

            <button
                type="button"
                onClick={remedir}
                style={{
                    marginTop: 10, width: '100%', padding: '8px 0', borderRadius: 8,
                    border: '1px solid #0e7490', background: '#083344', color: '#67e8f9',
                    font: 'inherit', fontWeight: 800
                }}
            >
                {m ? 'MEDIR DE NOVO' : 'MEDIR'}
            </button>
        </div>
    );
}
