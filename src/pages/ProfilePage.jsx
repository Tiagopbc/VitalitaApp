// -----------------------------------------------------------------------------
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Loader2, LogOut, Users } from 'lucide-react';
import { getStoredTheme, setTheme, THEMES } from '../utils/theme';
import { Button } from '../components/design-system/Button';
import { computeXpLevel } from '../utils/xpLevel';
import { useProfileData } from '../hooks/profile/useProfileData';
import { useAchievements } from '../hooks/profile/useAchievements';
import { ProfileHeaderCard } from '../components/profile/ProfileHeaderCard';
import { BodyStatsCard } from '../components/profile/BodyStatsCard';
import { BestMarksCard } from '../components/profile/BestMarksCard';
import { StatsGrid } from '../components/profile/StatsGrid';
import { AchievementsSection } from '../components/profile/AchievementsSection';
import { PrivacyTermsCard } from '../components/profile/PrivacyTermsCard';
import { EditProfileModal } from '../components/profile/EditProfileModal';
import { LinkTrainerModal } from '../components/profile/LinkTrainerModal';
const AchievementUnlockedModal = React.lazy(() => import('../components/achievements/AchievementUnlockedModal').then(module => ({ default: module.AchievementUnlockedModal })));




export default function ProfilePage({ user, onLogout, onNavigateToHistory, onNavigateToTrainer, isTrainer }) {
    const [showEditModal, setShowEditModal] = useState(false);

    const [saving, setSaving] = useState(false);
    const [exportingData, setExportingData] = useState(false);
    const [appTheme, setAppTheme] = useState(getStoredTheme);

    const handleThemeChange = (nextTheme) => {
        setAppTheme(setTheme(nextTheme));
    };

    // --- VINCULAÇÃO DE PERSONAL TRAINER ---
    const [showLinkTrainer, setShowLinkTrainer] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [linking, setLinking] = useState(false);

    const handleLinkTrainer = async () => {
        if (!inviteCode || !user) return;
        setLinking(true);
        try {
            const { userService } = await import('../services/userService');
            await userService.linkTrainer(user.uid, inviteCode);
            toast.success("Personal vinculado com sucesso!");
            setShowLinkTrainer(false);
            setInviteCode('');
        } catch (err) {
            console.error(err);
            if (err.message === "PERSONAL_NOT_FOUND") toast.error("Convite inválido ou expirado.");
            else if (err.message === "ALREADY_LINKED") toast.error("Você já está vinculado a este personal.");
            else if (err.message === "LINK_TRAINER_FAILED") toast.error("Não foi possível vincular. Verifique o código ou se o vínculo já existe.");
            else toast.error("Erro ao vincular.");
        } finally {
            setLinking(false);
        }
    };

    // Estado do Perfil e Conquistas (extraídos para hooks de dados)
    const { profile, setProfile, loading } = useProfileData(user);
    const { achievementsList, stats, loadingAchievements } = useAchievements(user, profile);

    // Achievement Sharing
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleWeeklyGoalDelta = (delta) => {
        setProfile(p => ({ ...p, weeklyGoal: Math.min(7, Math.max(1, (p.weeklyGoal || 4) + delta)) }));
    };

    const handleSave = async () => {
        // Validação de Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profile.email)) {
            toast.error("Por favor, insira um email válido.");
            return;
        }

        setSaving(true);
        try {
            const { userService } = await import('../services/userService');
            await userService.updateUserProfile(user.uid, {
                ...profile,
                updatedAt: new Date().toISOString()
            });
            setShowEditModal(false);
            toast.success("Perfil atualizado.");
        } catch (err) {
            console.error("Error saving profile:", err);
            toast.error("Erro ao salvar perfil.");
        } finally {
            setSaving(false);
        }
    };

    const handleExportData = async () => {
        if (!user?.uid || exportingData) return;

        setExportingData(true);
        try {
            const { privacyExportService } = await import('../services/privacyExportService');
            const exportPayload = await privacyExportService.buildUserDataExport(user);
            const fileName = privacyExportService.downloadJson(exportPayload);
            toast.success(`Exportação criada: ${fileName}`);
        } catch (err) {
            console.error('Error exporting user data:', err);
            toast.error('Não foi possível exportar seus dados agora.');
        } finally {
            setExportingData(false);
        }
    };

    const calculateBMI = () => {
        if (!profile.weight || !profile.height) return null;
        const h = profile.height / 100;
        return (profile.weight / (h * h)).toFixed(1);
    };

    // Nível e XP derivados das estatísticas.
    const { level, xpInLevel, xpProgress } = computeXpLevel(stats);

    const formattedJoinDate = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '14/09/2025'; // Data de design como fallback se ausente
    const privacyConsent = profile.privacyConsent;
    const hasPrivacyConsent = Boolean(privacyConsent?.privacyVersion || privacyConsent?.termsVersion);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-8 px-4 pt-2 w-full max-w-3xl mx-auto lg:pb-12 lg:pt-6">

            {/* --- CARTÃO DE CABEÇALHO DO PERFIL --- */}
            <ProfileHeaderCard
                profile={profile}
                level={level}
                formattedJoinDate={formattedJoinDate}
                appTheme={appTheme}
                xpInLevel={xpInLevel}
                xpProgress={xpProgress}
                onEditProfile={() => setShowEditModal(true)}
                onLinkTrainer={() => setShowLinkTrainer(true)}
                onToggleTheme={() => handleThemeChange(appTheme === THEMES.dark ? THEMES.light : THEMES.dark)}
            />

            {/* --- ÁREA DO TREINADOR (Apenas Mobile - Faixa) --- */}
            {
                isTrainer && (
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={onNavigateToTrainer}
                        className="mb-6 w-full rounded-xl lg:hidden"
                        leftIcon={<Users size={14} />}
                    >
                        Área do Personal
                    </Button>
                )
            }

            {/* --- DADOS CORPORAIS --- */}
            <BodyStatsCard profile={profile} bmi={calculateBMI()} />

            {/* --- DESTAQUES BIG 3 (ATUALIZADO para TOP 4) --- */}
            <BestMarksCard stats={stats} />

            {/* --- GRADE DE ESTATÍSTICAS --- */}
            <StatsGrid stats={stats} onNavigateToHistory={onNavigateToHistory} />

            {/* --- SEÇÃO DE CONQUISTAS --- */}
            <AchievementsSection
                achievements={achievementsList}
                loading={loadingAchievements}
                onSelect={setSelectedAchievement}
            />

            {/* --- PRIVACIDADE E TERMOS --- */}
            <PrivacyTermsCard
                hasPrivacyConsent={hasPrivacyConsent}
                privacyConsent={privacyConsent}
                exportingData={exportingData}
                onExportData={handleExportData}
            />

            {/* ACHIEVEMENT SHARE MODAL */}
            {selectedAchievement && (
                <React.Suspense fallback={
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
                        <div className="h-12 w-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                    </div>
                }>
                    <AchievementUnlockedModal
                        achievements={[selectedAchievement]}
                        onClose={() => setSelectedAchievement(null)}
                    />
                </React.Suspense>
            )}

            {/* --- SAIR --- */}
            <div className="flex flex-col items-center gap-4 mt-8 pb-8">
                <Button
                    variant="danger"
                    onClick={onLogout}
                    className="rounded-2xl"
                    leftIcon={<LogOut size={20} />}
                >
                    Sair da Conta
                </Button>
                <p className="text-[10px] text-slate-600 font-mono">
                    Vitalità Pro v3.1.2
                </p>
            </div>

            {/* --- MODAL DE EDIÇÃO --- */}
            {showEditModal && (
                <EditProfileModal
                    profile={profile}
                    saving={saving}
                    onClose={() => setShowEditModal(false)}
                    onChange={handleChange}
                    onSave={handleSave}
                    onWeeklyGoalDelta={handleWeeklyGoalDelta}
                />
            )}

            {/* --- MODAL DE VINCULAR TREINADOR --- */}
            {showLinkTrainer && (
                <LinkTrainerModal
                    inviteCode={inviteCode}
                    linking={linking}
                    onInviteCodeChange={setInviteCode}
                    onConfirm={handleLinkTrainer}
                    onClose={() => setShowLinkTrainer(false)}
                />
            )}
        </div>
    );
}
