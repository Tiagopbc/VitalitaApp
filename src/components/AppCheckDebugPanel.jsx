/**
 * AppCheckDebugPanel.jsx
 * Painel de diagnóstico do App Check. Mostra se o token está sendo emitido e o
 * histórico de falhas, para conferir num aparelho real — o Sentry é desligado
 * em produção por decisão (docs/observability.md) e um PWA de iPhone não tem
 * console à mão.
 *
 * Oculto por padrão: abre com `?debug=appcheck` na URL e fecha no ✕ (ou com
 * `?debug=off`, que desliga também o painel de push). Sem afordância visível em
 * produção — o painel só aparece para quem souber o parâmetro.
 */
import React, { useEffect, useState } from 'react';
import { useDebugPanelFlag } from '../hooks/useDebugPanelFlag';
import { getAppCheckLog, getAppCheckStatus, clearAppCheckLog } from '../services/appCheckDiagnostics';
import { isAppCheckMonitoringEnabled } from '../services/appCheckService';

/**
 * "Desligado" e "falhando" são estados diferentes e a distinção é o ponto do
 * painel: sem site key o App Check nem tenta, e ler isso como quebra manda o
 * diagnóstico para o lado errado.
 */
function describeState(status) {
    // `mostraHorario` fica falso quando não há verificação corrente: o status
    // sobrevive no storage, e exibir o horário de uma checagem de outro build
    // faria parecer que o App Check acabou de rodar.
    if (!isAppCheckMonitoringEnabled()) {
        return { label: 'desligado (sem site key)', color: '#94a3b8', mostraHorario: false };
    }
    if (!status) {
        return { label: 'verificando...', color: '#94a3b8', mostraHorario: false };
    }
    if (status.ok) {
        return { label: 'ativo', color: '#86efac', mostraHorario: true };
    }
    return { label: `falhando (${status.code || 'sem código'})`, color: '#fca5a5', mostraHorario: true };
}

export function AppCheckDebugPanel() {
    const [enabled, disable] = useDebugPanelFlag('appcheck');
    const [status, setStatus] = useState(null);
    const [log, setLog] = useState([]);

    useEffect(() => {
        if (!enabled) return undefined;
        const refresh = () => {
            setStatus(getAppCheckStatus());
            setLog(getAppCheckLog());
        };
        refresh();
        const id = setInterval(refresh, 1000);
        return () => clearInterval(id);
    }, [enabled]);

    if (!enabled) return null;

    const state = describeState(status);

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

    const button = {
        background: '#1e293b',
        color: '#e2e8f0',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '2px 8px'
    };

    return (
        <div style={box}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong>app check debug</strong>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { clearAppCheckLog(); setLog([]); }} style={button}>
                        limpar
                    </button>
                    <button onClick={disable} aria-label="Fechar diagnóstico" style={{ ...button, padding: '2px 10px' }}>
                        ✕
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: 6, color: state.color }}>
                token: {state.label}
                {state.mostraHorario && status?.checkedAt
                    && ` · verificado ${new Date(status.checkedAt).toLocaleTimeString('pt-BR')}`}
            </div>

            {status && !status.ok && status.message && (
                <div style={{ marginBottom: 6, color: '#fca5a5', wordBreak: 'break-word' }}>
                    {status.message}
                </div>
            )}

            {log.length === 0 ? (
                <div style={{ color: '#64748b' }}>sem falhas registradas</div>
            ) : (
                log.map((entry, i) => (
                    <div key={i} style={{ borderTop: '1px solid #1e293b', paddingTop: 4, marginTop: 4 }}>
                        <span style={{ color: '#64748b' }}>{new Date(entry.t).toLocaleString('pt-BR')}</span>
                        {' · '}
                        <span style={{ color: entry.stage === 'token:recuperado' ? '#86efac' : '#fca5a5' }}>
                            {entry.stage}
                        </span>
                        {entry.code && ` · ${entry.code}`}
                        {entry.repeticoes > 1 && ` · ${entry.repeticoes}x`}
                    </div>
                ))
            )}
        </div>
    );
}
