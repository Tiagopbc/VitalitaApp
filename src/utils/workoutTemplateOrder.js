const workoutNameCollator = new Intl.Collator('pt-BR', {
    numeric: true,
    sensitivity: 'base'
});

function getDisplayOrder(template) {
    return Number.isInteger(template?.displayOrder) && template.displayOrder >= 0
        ? template.displayOrder
        : null;
}

export function compareWorkoutTemplates(a, b) {
    if (Boolean(a?.isArchived) !== Boolean(b?.isArchived)) {
        return a?.isArchived ? 1 : -1;
    }

    const aOrder = getDisplayOrder(a);
    const bOrder = getDisplayOrder(b);

    if (aOrder !== null && bOrder !== null && aOrder !== bOrder) {
        return aOrder - bOrder;
    }
    if (aOrder !== null) return -1;
    if (bOrder !== null) return 1;

    return workoutNameCollator.compare(a?.name || '', b?.name || '');
}

export function sortWorkoutTemplates(templates = []) {
    return [...templates].sort(compareWorkoutTemplates);
}

/**
 * Próxima posição livre entre os treinos ativos.
 * Usa o maior displayOrder + 1 em vez da contagem: arquivar ou excluir um treino
 * do meio deixa buracos na sequência (ex.: 0 e 2), e a contagem (2) colidiria
 * com uma posição já ocupada.
 */
export function nextDisplayOrder(templates = []) {
    const highest = templates
        .filter(template => !template?.isArchived)
        .reduce((max, template) => {
            const order = getDisplayOrder(template);
            return order !== null && order > max ? order : max;
        }, -1);

    return highest + 1;
}

export function normalizeActiveWorkoutOrder(templates = []) {
    return sortWorkoutTemplates(templates.filter(template => !template.isArchived))
        .map((template, displayOrder) => ({ ...template, displayOrder }));
}
