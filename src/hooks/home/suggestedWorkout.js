/**
 * suggestedWorkout.js
 * Próximo treino sugerido na home: o treino ativo seguinte ao último treinado,
 * voltando ao início no fim da lista. Movido de HomeDashboard (D17) sem mudança.
 */
export function pickSuggestedWorkout(templates, latestSession) {
    const activeTemplates = templates ? templates.filter(t => !t.isArchived) : [];
    
    if (activeTemplates.length === 0) {
        return null;
    }

    if (!latestSession) {
        return activeTemplates[0];
    }

    const lastIndex = activeTemplates.findIndex(t =>
        t.id === latestSession.templateId ||
        (t.name && latestSession.templateName && t.name === latestSession.templateName)
    );

    let nextIndex = 0;
    if (lastIndex !== -1) {
        nextIndex = (lastIndex + 1) % activeTemplates.length;
    }

    return activeTemplates[nextIndex];
}
