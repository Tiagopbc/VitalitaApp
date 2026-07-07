import React from 'react';
import { ChevronLeft, Dumbbell, FileText, ShieldAlert, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/design-system/Button';
import {
    LEGAL_LAST_UPDATED_LABEL,
    LEGAL_SUPPORT_EMAIL,
    TERMS_OF_USE_VERSION
} from '../constants/legal';

const termsSections = [
    {
        title: 'Uso do aplicativo',
        icon: <Dumbbell size={18} />,
        items: [
            'O Vitalità ajuda a registrar treinos, histórico, metas, carga e evolução.',
            'As informações do app não substituem orientação médica, fisioterapêutica ou profissional especializada.',
            'Você é responsável por usar o app de acordo com sua condição física e limites.'
        ]
    },
    {
        title: 'Conta e dados',
        icon: <UserCheck size={18} />,
        items: [
            'Você deve manter suas credenciais em segurança.',
            'Dados de treino e perfil são usados para entregar as funcionalidades do app.',
            'O modo personal só deve ser usado com consentimento entre aluno e treinador.'
        ]
    },
    {
        title: 'Limitações',
        icon: <ShieldAlert size={18} />,
        items: [
            'Este projeto é mantido como estudo e portfólio, sem garantia de disponibilidade contínua.',
            'Mudanças técnicas podem ocorrer para melhorar segurança, desempenho e experiência.',
            'Funcionalidades experimentais podem ser ajustadas ou removidas.'
        ]
    }
];

export default function TermsOfUsePage() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-slate-100">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="w-fit rounded-full"
                    leftIcon={<ChevronLeft size={16} />}
                >
                    Voltar
                </Button>

                <header className="rounded-3xl border border-cyan-400/15 bg-slate-900/60 p-6 shadow-[0_24px_80px_rgba(8,47,73,0.22)]">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/25">
                        <FileText size={24} />
                    </div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                        Versão {TERMS_OF_USE_VERSION}
                    </p>
                    <h1 className="text-3xl font-bold leading-tight text-white">Termos de Uso</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        Estes termos definem o uso esperado do Vitalità como diário inteligente de treinos,
                        projeto de estudo e peça de portfólio profissional.
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Atualizados em {LEGAL_LAST_UPDATED_LABEL}.</p>
                </header>

                <section className="grid gap-4">
                    {termsSections.map((section) => (
                        <article
                            key={section.title}
                            className="rounded-3xl border border-slate-800 bg-slate-900/55 p-5"
                        >
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                                    {section.icon}
                                </div>
                                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                            </div>
                            <ul className="grid gap-2 text-sm leading-relaxed text-slate-400">
                                {section.items.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </section>

                <section className="rounded-3xl border border-slate-800 bg-slate-900/55 p-5 text-sm leading-relaxed text-slate-400">
                    <h2 className="mb-2 text-lg font-bold text-white">Contato</h2>
                    <p>
                        Dúvidas sobre estes termos podem ser enviadas para{' '}
                        <a className="text-cyan-300 underline-offset-4 hover:underline" href={`mailto:${LEGAL_SUPPORT_EMAIL}`}>
                            {LEGAL_SUPPORT_EMAIL}
                        </a>
                        .
                    </p>
                </section>
            </div>
        </main>
    );
}
