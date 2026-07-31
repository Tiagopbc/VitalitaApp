import { Link2, ArrowRight, RotateCcw } from 'lucide-react';

/**
 * Aviso de volta de grupo (bi-set/tri-set/circuito) no Modo Foco.
 *
 * O problema que ele resolve: no Modo Foco só um exercício aparece por vez, e
 * ao concluir a série a navegação salta para o parceiro do grupo — que às
 * vezes exige outro equipamento. Sem aviso o usuário começa a volta e precisa
 * levantar no meio dela para buscar halter, barra ou anilha.
 *
 * A tag de método do card ("BI-SET") não resolve isso: ela nomeia o método,
 * nunca o exercício parceiro — e some quando o `method` é "Convencional", que
 * é o caso dos grupos feitos pelo botão de corrente. Por isso o `round` vem de
 * `getGroupRoundPreview`, derivado do `groupId`.
 *
 * Dois estados, para ser alto quando importa e discreto depois:
 * - volta ainda zerada → bloco com os exercícios da volta em ordem, que é
 *   quando ainda dá para separar tudo sem interromper nada;
 * - volta em andamento → uma linha só, dizendo quem vem depois desta série.
 */
export function GroupRoundNotice({ round, currentSet, totalSets }) {
    if (!round) return null;

    if (round.roundNotStarted) {
        // Curto de propósito: a 375px o cabeçalho precisa caber numa linha.
        // O que "preparar" significa fica claro na lista logo abaixo.
        const prepare = round.members.length === 2 ? 'prepare os dois' : 'prepare todos';

        return (
            <div
                data-testid="group-round-notice"
                className="flex flex-col gap-2 px-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 mb-1"
            >
                <div className="flex items-center gap-1.5 text-cyan-300 text-[11px] font-bold uppercase tracking-wide">
                    <Link2 size={12} className="shrink-0" />
                    <span>{round.label} — {prepare}</span>
                </div>

                {/* Sem `truncate`: ler os dois nomes inteiros é o motivo deste
                    bloco existir, e exercícios de bi-set costumam diferir só no
                    fim do nome. Em tela estreita o nome quebra em duas linhas —
                    daí o `items-start`, para o número acompanhar a primeira. */}
                <ol className="flex flex-col gap-1">
                    {round.members.map((member, position) => (
                        <li key={member.index} className="flex items-start gap-2 text-[12px] leading-snug">
                            <span className={`w-4 h-4 mt-px shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${member.isCurrent
                                ? 'bg-cyan-400 text-slate-950'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                {position + 1}
                            </span>
                            <span className={`min-w-0 font-medium ${member.isCurrent ? 'text-cyan-200' : 'text-slate-300'}`}>
                                {member.name}
                                {member.isCurrent && (
                                    <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-cyan-400/80 whitespace-nowrap">
                                        agora
                                    </span>
                                )}
                            </span>
                        </li>
                    ))}
                </ol>

                <p className="text-[11px] leading-snug text-cyan-200/70">
                    Você alterna a cada série; o descanso vem só ao fim da volta.
                </p>
            </div>
        );
    }

    // Última série do último membro: a volta está terminando e a navegação
    // segue para o próximo exercício da ficha, não de volta ao grupo — a linha
    // não teria o que prometer.
    if (round.isLastMember && currentSet >= totalSets) return null;

    // Rótulo e nome empilhados, não lado a lado: nomes de exercício são longos
    // ("Puxada pegada supinada") e costumam diferir só no fim, então truncar
    // numa linha só apagaria justamente o que distingue um do outro.
    return (
        <div
            data-testid="group-round-notice"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 mb-1"
        >
            {round.isLastMember
                ? <RotateCcw size={13} className="shrink-0 text-cyan-400" />
                : <ArrowRight size={13} className="shrink-0 text-cyan-400" />}
            <div className="min-w-0 flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-wide text-cyan-300/80 leading-tight">
                    {round.isLastMember ? 'Depois desta série, volta para' : 'Depois desta série'}
                </span>
                <span className="text-[12px] font-bold uppercase tracking-wide text-cyan-200 leading-tight">
                    {round.nextName}
                </span>
            </div>
        </div>
    );
}
