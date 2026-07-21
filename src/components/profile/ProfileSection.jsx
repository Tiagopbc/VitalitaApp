import { SectionHeader } from '../design-system/SectionHeader';

/**
 * Contêiner padrão das seções do perfil — mesma superfície, raio e padding em
 * todas. O espaçamento ENTRE seções fica no container da página (`space-y-6`),
 * para não espalhar margens conflitantes pelos componentes.
 */
export function ProfileSection({ icon, title, action, children, className = '' }) {
    return (
        <section className={`rounded-3xl border border-slate-800 bg-slate-900/50 p-5 ${className}`}>
            {title && <SectionHeader icon={icon} title={title} action={action} />}
            {children}
        </section>
    );
}
