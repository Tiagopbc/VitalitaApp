/**
 * PushDebugPanel.jsx
 * Painel de diagnóstico do push do descanso. Mostra o contexto de instalação e
 * o log de eventos (getPushLog), para diagnosticar num aparelho real onde o
 * push falha — sem depender de cabo/console.
 *
 * Oculto por padrão: abre com `?debug=push` na URL e fecha no ✕ (ou com
 * `?debug=off`). Sem afordância visível em produção — o painel só aparece para
 * quem souber o parâmetro.
 */
import React, { useEffect, useState } from 'react';
import { getPushLog, clearPushLog, describePushContext } from '../services/pushDiagnostics';

const FLAG_KEY = 'vitalita:pushDebug';

/**
 * Habilitado por `?debug=push`. A flag é "grudenta" (localStorage): sobrevive a
 * redirects de auth (ex.: /login), à navegação entre rotas e — importante — à
 * instalação na tela de início (o PWA standalone abre sem barra de endereço,
 * então não dá para redigitar `?debug=push`). `?debug=off` desliga.
 */
function isEnabled() {
    if (typeof window === 'undefined') return false;
    try {
        const param = new URLSearchParams(window.location.search).get('debug');
        if (param === 'push') {
            localStorage.setItem(FLAG_KEY, '1');
            return true;
        }
        if (param === 'off') {
            localStorage.removeItem(FLAG_KEY);
            return false;
        }
        return localStorage.getItem(FLAG_KEY) === '1';
    } catch {
        return false;
    }
}

export function PushDebugPanel() {
    const [enabled, setEnabled] = useState(isEnabled);
    const [log, setLog] = useState([]);
    const [ctx, setCtx] = useState(null);

    useEffect(() => {
        if (!enabled) return undefined;
        const refresh = () => {
            setLog(getPushLog());
            setCtx(describePushContext());
        };
        refresh();
        const id = setInterval(refresh, 1000);
        return () => clearInterval(id);
    }, [enabled]);

    const disable = () => {
        try { localStorage.removeItem(FLAG_KEY); } catch { /* sem storage */ }
        setEnabled(false);
    };

    if (!enabled) return null;

    const box = {
        position: 'fixed',
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 2147483647,
        maxHeight: '45vh',
        overflowY: 'auto',
        background: 'rgba(2,6,23,0.96)',
        color: '#e2e8f0',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 10,
        font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace'
    };

    return (
        <div style={box}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong>push debug</strong>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => { clearPushLog(); setLog([]); }}
                        style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '2px 8px' }}
                    >
                        limpar
                    </button>
                    <button
                        onClick={disable}
                        aria-label="Fechar diagnóstico"
                        style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '2px 10px' }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {ctx && (
                <div style={{ marginBottom: 6, color: ctx.pushViable ? '#86efac' : '#fca5a5' }}>
                    ctx: {ctx.platform} · standalone={String(ctx.isStandalone)} · {ctx.browser}
                    {' · '}push={ctx.pushViable ? 'ok' : `no (${ctx.reason})`}
                    {' · perm='}{typeof Notification !== 'undefined' ? Notification.permission : 'n/a'}
                </div>
            )}

            {log.length === 0 ? (
                <div style={{ color: '#94a3b8' }}>sem eventos ainda…</div>
            ) : (
                log.slice().reverse().map((e, i) => (
                    <div key={i} style={{ borderTop: '1px solid #1e293b', padding: '2px 0' }}>
                        <span style={{ color: '#64748b' }}>{e.t?.slice(11, 19)}</span>{' '}
                        <span style={{ color: '#38bdf8' }}>{e.stage}</span>{' '}
                        <span style={{ color: '#64748b' }}>[{e.vis}]</span>
                        {e.detail != null && (
                            <span style={{ color: '#cbd5e1' }}> {JSON.stringify(e.detail)}</span>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
