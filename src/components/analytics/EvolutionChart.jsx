/**
 * EvolutionChart.jsx
 * Gráfico de evolução de carga (uma série: carga por data) em SVG próprio.
 *
 * Substitui o Recharts (removido em 11/2026): uma `AreaChart` de uma série
 * não justificava centenas de KB de chunks que o service worker pré-cacheia em
 * toda instalação. Tudo aqui é escala linear calculada à mão; sem lib.
 *
 * Cores vêm das variáveis do Tailwind (`--color-*`), que o tema claro já
 * redefine — o gráfico troca de tema junto com o resto do app.
 */
import React, { useEffect, useRef, useState } from 'react';
import { LineChart } from 'lucide-react';

const ALTURA = 256;
const LARGURA_RESERVA = 600;
const MARGEM = { top: 12, right: 12, bottom: 24, left: 36 };
const TICKS_Y = 5;
const MAX_TICKS_X = 5;

const COR = {
    serie: 'var(--color-cyan-500)',
    grade: 'var(--color-slate-800)',
    eixo: 'var(--color-slate-500)',
    fundoPonto: 'var(--color-slate-950)'
};

const formatKg = (valor) => `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;

/** Largura do contêiner via ResizeObserver; sem ele (jsdom), a de reserva. */
function useLarguraDoContainer() {
    const ref = useRef(null);
    const [largura, setLargura] = useState(LARGURA_RESERVA);

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(([entry]) => {
            const w = Math.round(entry.contentRect.width);
            if (w > 0) setLargura(w);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return [ref, largura];
}

/**
 * Ticks do eixo Y: cobre [mín−5, máx+5] com um passo "redondo" (1, 2, 2,5, 5
 * ou 10 vezes uma potência de 10), para o eixo não mostrar 48,3 nem 61,5.
 * Sai perto de cinco ticks; pode variar entre quatro e seis.
 */
function ticksDoEixoY(valores) {
    const min = Math.min(...valores) - 5;
    const max = Math.max(...valores) + 5;
    const bruto = (max - min) / (TICKS_Y - 1);
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const fator = bruto / potencia;
    const passo = potencia * (fator <= 1 ? 1 : fator <= 2 ? 2 : fator <= 2.5 ? 2.5 : fator <= 5 ? 5 : 10);
    const inicio = Math.floor(min / passo) * passo;
    const fim = Math.ceil(max / passo) * passo;
    const ticks = [];
    for (let t = inicio; t <= fim + passo / 1000; t += passo) ticks.push(Number(t.toFixed(6)));
    return ticks;
}

/** Índices das datas mostradas no eixo X: primeira, última e até 3 no meio. */
function indicesDoEixoX(total) {
    if (total <= MAX_TICKS_X) return Array.from({ length: total }, (_, i) => i);
    const passo = (total - 1) / (MAX_TICKS_X - 1);
    return Array.from({ length: MAX_TICKS_X }, (_, i) => Math.round(i * passo));
}

/**
 * Curva suave sem ultrapassar os pontos: tangentes horizontais em cada ponto,
 * o que dá o mesmo "monotone" do gráfico anterior sem a matemática dele.
 */
function caminhoDaLinha(pontos) {
    return pontos.reduce((d, p, i) => {
        if (i === 0) return `M${p.x},${p.y}`;
        const a = pontos[i - 1];
        const meio = (a.x + p.x) / 2;
        return `${d} C${meio},${a.y} ${meio},${p.y} ${p.x},${p.y}`;
    }, '');
}

function EstadoVazio() {
    return (
        <div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 px-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/20">
                <LineChart size={24} />
            </div>
            <p className="text-sm font-bold text-slate-200">Sem evolução neste período</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Finalize treinos com carga e repetições para montar o gráfico automaticamente.
            </p>
        </div>
    );
}

export function EvolutionChart({ data }) {
    const [ref, largura] = useLarguraDoContainer();
    const [ativo, setAtivo] = useState(null);
    const gradientId = React.useId();

    if (!data || data.length === 0) return <EstadoVazio />;

    const pesos = data.map((d) => d.weight);
    const ticksY = ticksDoEixoY(pesos);
    const yMin = ticksY[0];
    const yMax = ticksY.at(-1);

    const x0 = MARGEM.left;
    const x1 = largura - MARGEM.right;
    const y0 = MARGEM.top;
    const y1 = ALTURA - MARGEM.bottom;
    const escalaX = (i) => (data.length === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (data.length - 1));
    const escalaY = (v) => y1 - ((v - yMin) / (yMax - yMin)) * (y1 - y0);

    const pontos = data.map((d, i) => ({ x: escalaX(i), y: escalaY(d.weight), ...d }));
    const unico = pontos.length === 1;
    const linha = unico ? '' : caminhoDaLinha(pontos);
    const area = unico ? '' : `${linha} L${pontos.at(-1).x},${y1} L${pontos[0].x},${y1} Z`;

    const rotulo = `Evolução de carga: ${data.length} ${data.length === 1 ? 'registro' : 'registros'}, `
        + `de ${formatKg(Math.min(...pesos))} a ${formatKg(Math.max(...pesos))}`;

    const aoMover = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const fator = rect.width > 0 ? largura / rect.width : 1;
        const x = (event.clientX - rect.left) * fator;
        let maisProximo = 0;
        pontos.forEach((p, i) => {
            if (Math.abs(p.x - x) < Math.abs(pontos[maisProximo].x - x)) maisProximo = i;
        });
        setAtivo(maisProximo);
    };

    const pontoAtivo = ativo == null ? null : pontos[ativo];
    // O tooltip fica do lado que tem espaço: à direita do ponto na metade
    // esquerda do gráfico, à esquerda dele na outra metade.
    const percentualX = pontoAtivo ? (pontoAtivo.x / largura) * 100 : 0;
    const aDireita = pontoAtivo ? pontoAtivo.x > largura / 2 : false;

    return (
        <div ref={ref} className="relative w-full h-72 bg-slate-900/20 border border-slate-800/50 rounded-2xl p-4">
            <svg
                role="img"
                aria-label={rotulo}
                width="100%"
                height={ALTURA}
                viewBox={`0 0 ${largura} ${ALTURA}`}
                className="block touch-none select-none"
                onPointerMove={aoMover}
                onPointerDown={aoMover}
                onPointerLeave={() => setAtivo(null)}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" style={{ stopColor: COR.serie, stopOpacity: 0.3 }} />
                        <stop offset="95%" style={{ stopColor: COR.serie, stopOpacity: 0 }} />
                    </linearGradient>
                </defs>

                <g data-chart="grid" style={{ stroke: COR.grade }} strokeDasharray="3 3">
                    {ticksY.map((t) => (
                        <line key={t} x1={x0} x2={x1} y1={escalaY(t)} y2={escalaY(t)} />
                    ))}
                </g>

                <g data-chart="axis-y" style={{ fill: COR.eixo }} fontSize="10" textAnchor="end">
                    {[...ticksY].reverse().map((t) => (
                        <text key={t} x={x0 - 8} y={escalaY(t) + 3}>
                            {t.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                        </text>
                    ))}
                </g>

                <g data-chart="axis-x" style={{ fill: COR.eixo }} fontSize="10" textAnchor="middle">
                    {indicesDoEixoX(pontos.length).map((i) => (
                        <text key={i} x={pontos[i].x} y={ALTURA - 6}>{pontos[i].dateStr}</text>
                    ))}
                </g>

                {unico ? (
                    <g data-chart="single">
                        <circle cx={pontos[0].x} cy={pontos[0].y} r="5" style={{ fill: COR.fundoPonto, stroke: COR.serie }} strokeWidth="3" />
                        <text x={pontos[0].x} y={pontos[0].y - 12} textAnchor="middle" fontSize="12" fontWeight="700" style={{ fill: COR.serie }}>
                            {formatKg(pontos[0].weight)}
                        </text>
                    </g>
                ) : (
                    <>
                        <path data-chart="area" d={area} fill={`url(#${gradientId})`} />
                        <path data-chart="line" d={linha} fill="none" style={{ stroke: COR.serie }} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </>
                )}

                {pontoAtivo && (
                    <g data-chart="cursor">
                        <line x1={pontoAtivo.x} x2={pontoAtivo.x} y1={y0} y2={y1} style={{ stroke: COR.serie }} strokeDasharray="5 5" />
                        <circle cx={pontoAtivo.x} cy={pontoAtivo.y} r="5" style={{ fill: COR.fundoPonto, stroke: COR.serie }} strokeWidth="3" />
                    </g>
                )}
            </svg>

            {pontoAtivo && (
                <div
                    data-testid="chart-tooltip"
                    className="pointer-events-none absolute top-4 bg-[#020617]/90 border border-slate-700/50 px-3 py-2 rounded-xl shadow-xl backdrop-blur-md"
                    style={aDireita
                        ? { left: `calc(${percentualX}% - 12px)`, transform: 'translateX(-100%)' }
                        : { left: `calc(${percentualX}% + 12px)` }}
                >
                    <p className="text-slate-400 text-xs mb-1">{pontoAtivo.dateStr}</p>
                    <p className="text-cyan-400 font-bold text-lg">{formatKg(pontoAtivo.weight)}</p>
                </div>
            )}
        </div>
    );
}
