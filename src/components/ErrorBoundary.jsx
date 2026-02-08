import React from 'react';
const captureWithSentry = (error, errorInfo) => {
    import('@sentry/react')
        .then((Sentry) => {
            Sentry.captureException(error, { extra: errorInfo });
        })
        .catch(() => {
            // Falha ao carregar Sentry não deve quebrar o app
        });
};

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // --- AUTO-RECOVERY FOR LAZY LOADING ERRORS ---
        // Verifies if it's a ChunkLoadError or MIME type mismatch (common in deployments)
        const isChunkError = error.name === 'ChunkLoadError' ||
            error.message?.includes('Loading chunk') ||
            error.message?.includes('valid JavaScript MIME type');

        if (isChunkError) {
            const hasReloaded = sessionStorage.getItem('retry-lazy-chunk');
            if (!hasReloaded) {
                console.log("Chunk load error detected. Reloading...");
                sessionStorage.setItem('retry-lazy-chunk', 'true');
                window.location.reload();
                return;
            }
        }

        // Clear flag if it's another error or if we already reloaded
        sessionStorage.removeItem('retry-lazy-chunk');

        captureWithSentry(error, errorInfo);

        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    color: '#f8fafc',
                    background: '#020617', // Slate-950 match
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontFamily: 'sans-serif'
                }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Ops! Algo deu errado.</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                        Uma nova versão do app pode estar disponível ou houve um erro de conexão.
                    </p>

                    <button
                        onClick={() => {
                            sessionStorage.removeItem('retry-lazy-chunk');
                            window.location.reload();
                        }}
                        style={{
                            padding: '12px 24px',
                            background: '#06b6d4',
                            color: 'black',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Tentar Recarregar
                    </button>

                    <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '80%', color: '#475569', fontSize: '0.8rem' }}>
                        <summary>Detalhes do Erro</summary>
                        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}
