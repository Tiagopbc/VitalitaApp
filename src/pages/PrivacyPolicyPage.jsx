import React from 'react';
import { ChevronLeft, Database, Dumbbell, FileDown, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/design-system/Button';
import {
    LEGAL_LAST_UPDATED_LABEL,
    LEGAL_SUPPORT_EMAIL,
    PRIVACY_POLICY_VERSION
} from '../constants/legal';

const privacySections = [
    {
        title: 'Dados que o Vitalità usa',
        icon: <Database size={18} />,
        items: [
            'Conta: nome, e-mail e identificador do usuário autenticado.',
            'Perfil: peso, altura, idade, objetivo, gênero e meta semanal informados por você.',
            'Treinos: fichas, exercícios, séries, cargas, repetições, observações e histórico concluído.',
            'Relacionamento com personal: convites, vínculos ativos e treinos atribuídos, quando você usar esse modo.',
            'Estatísticas: totais, sequências, conquistas e agregados calculados a partir do histórico.'
        ]
    },
    {
        title: 'Finalidade',
        icon: <Dumbbell size={18} />,
        items: [
            'Salvar e recuperar seus treinos no app.',
            'Mostrar evolução, histórico, conquistas e metas semanais.',
            'Permitir vínculo opcional entre aluno e personal trainer.',
            'Melhorar estabilidade, segurança e performance do produto.'
        ]
    },
    {
        title: 'Compartilhamento',
        icon: <Users size={18} />,
        items: [
            'Se você aceitar vínculo com personal, esse profissional pode ver dados necessários para acompanhamento.',
            'O app não vende dados pessoais.',
            'Serviços técnicos como Firebase e Vercel hospedam autenticação, banco de dados e aplicação.'
        ]
    },
    {
        title: 'Seus direitos',
        icon: <FileDown size={18} />,
        items: [
            'Você pode solicitar exportação dos seus dados em formato JSON.',
            'Você pode solicitar exclusão da conta e dos dados vinculados.',
            'Você pode revogar o compartilhamento com personal trainer quando esse fluxo estiver disponível na interface.'
        ]
    }
];

export default function PrivacyPolicyPage() {
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
                        <ShieldCheck size={24} />
                    </div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                        Versão {PRIVACY_POLICY_VERSION}
                    </p>
                    <h1 className="text-3xl font-bold leading-tight text-white">Política de Privacidade</h1>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        Esta política resume como o Vitalità trata dados pessoais no contexto de um app de estudo,
                        portfólio e acompanhamento individual de treinos.
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Atualizada em {LEGAL_LAST_UPDATED_LABEL}.</p>
                </header>

                <section className="grid gap-4">
                    {privacySections.map((section) => (
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
                        Para dúvidas, exportação ou exclusão de dados, use o e-mail{' '}
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
