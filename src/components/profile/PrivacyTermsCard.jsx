import { FileDown, FileText, ShieldCheck } from 'lucide-react';
import { Button } from '../design-system/Button';
import { SectionHeader } from '../design-system/SectionHeader';
import { PRIVACY_POLICY_VERSION, TERMS_OF_USE_VERSION } from '../../constants/legal';

/**
 * Cartão de privacidade e termos: status do consentimento, links de
 * Política/Termos e exportação de dados (LGPD).
 */
export function PrivacyTermsCard({ hasPrivacyConsent, privacyConsent, exportingData, onExportData }) {
    return (
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-5">
            <SectionHeader icon={<ShieldCheck size={18} className="text-cyan-300" />} title="Privacidade e termos" />
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
                {hasPrivacyConsent
                    ? `Consentimento registrado: Política v${privacyConsent.privacyVersion || PRIVACY_POLICY_VERSION} e Termos v${privacyConsent.termsVersion || TERMS_OF_USE_VERSION}.`
                    : `Esta conta é anterior ao registro de versão. Novos cadastros salvam Política v${PRIVACY_POLICY_VERSION} e Termos v${TERMS_OF_USE_VERSION}.`}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
                <a
                    href="/privacy"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-cyan-300 transition-colors hover:border-cyan-300/50 hover:bg-cyan-400/10"
                >
                    <ShieldCheck size={16} />
                    Política
                </a>
                <a
                    href="/terms"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                >
                    <FileText size={16} />
                    Termos
                </a>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onExportData}
                    loading={exportingData}
                    className="h-auto rounded-2xl px-4 py-3 text-xs"
                    leftIcon={<FileDown size={16} />}
                >
                    Exportar dados
                </Button>
            </div>
        </div>
    );
}
