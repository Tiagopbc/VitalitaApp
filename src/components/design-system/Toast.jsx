
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export function Toast({ message, type = 'error', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const colors = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        info: 'bg-blue-600'
    };

    const icons = {
        success: <CheckCircle2 size={20} className="text-white shrink-0" />,
        error: <AlertCircle size={20} className="text-white shrink-0" />,
        info: <AlertCircle size={20} className="text-white shrink-0" />
    };

    // Centralizado, e não no topo: ancorado em `top-6` o aviso ficava atrás da
    // status bar do iPhone (relógio/bateria) e passava despercebido. No centro
    // ele cai logo acima dos campos de peso/repetições da tela de execução —
    // aponta para o campo que a mensagem manda corrigir, sem cobri-lo.
    //
    // Só este Toast é centralizado. Os demais avisos do app (o verde de "salvo"
    // e os erros do resto das telas) vivem no `TopBanner`, a barra full-bleed que
    // desce do topo. Este componente ficou de fora daquela migração justamente
    // pelo motivo acima: ele precisa aparecer junto dos campos de peso/repetições
    // para apontar o campo que a mensagem manda corrigir — no topo perderia essa
    // relação com o campo.
    //
    // O eixo X usa `inset-x-4 mx-auto w-fit`, e não `left-1/2 -translate-x-1/2`:
    // com `left-1/2` o elemento começa na metade da tela e só tem metade da
    // largura para diagramar, então "Preencha peso e repetições em todas as
    // sub-séries." quebrava numa coluna estreita de cinco linhas. O `mx-auto`
    // centraliza dentro dos recuos sem estrangular a largura disponível.
    return (
        <div className={`fixed top-1/2 -translate-y-1/2 inset-x-4 mx-auto w-fit max-w-[28rem] z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white ${colors[type] || colors.error} transition-all`}>
            {icons[type] || icons.error}
            <span className="font-bold text-sm">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
}
