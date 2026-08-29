import { getFirestoreDeps } from '../firebaseDb';
import { catalogValuesFor } from '../data/muscleGroups';
import { sortWorkoutTemplates } from '../utils/workoutTemplateOrder';
import { notify } from '../utils/notifyStore';

const TEMPLATES_COLLECTION = 'workout_templates';
const SESSIONS_COLLECTION = 'workout_sessions';
export const SESSION_LIMITS = {
    dashboardRecent: 60,
    analyticsGlobalPage: 120,
    profileStats: 300,
    achievementCheck: 300
};

// Cache em memória
let templatesCache = {
    userId: null,
    data: null,
    timestamp: 0
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Catálogo global por grupo muscular. Sem expiração de propósito:
// `exercises_catalog` é somente-leitura pelas regras, então o conteúdo não muda
// durante a sessão. Evita reler 100 documentos a cada troca do filtro — e agora
// que os 10 grupos retornam resultado, a troca acontece muito mais.
// Não é limpo por `clearCache()`: não tem relação com o usuário logado.
const catalogByMuscleCache = new Map();
const CATALOG_GROUP_FETCH_LIMIT = 100;

function mapSessionDoc(doc) {
    return { id: doc.id, ...doc.data() };
}

function getSessionTimestampMs(session) {
    const raw = session?.completedAt || session?.completedAtClient || session?.date || session?.createdAt || session?.timestamp;
    if (!raw) return 0;
    if (typeof raw.toDate === 'function') return raw.toDate().getTime();
    if (raw instanceof Date) return raw.getTime();
    if (typeof raw === 'object' && typeof raw.seconds === 'number') return raw.seconds * 1000;

    const parsed = new Date(raw).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

function sortSessionsByMostRecent(sessions) {
    return [...sessions].sort((a, b) => getSessionTimestampMs(b) - getSessionTimestampMs(a));
}

async function getLegacyRecentSessions(deps, userId, safeLimit) {
    const { db, collection, query, where, limit, getDocs } = deps;
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const fallbackQuery = query(
        sessionsRef,
        where('userId', '==', userId),
        limit(safeLimit)
    );
    const snap = await getDocs(fallbackQuery);
    return sortSessionsByMostRecent(snap.docs.map(mapSessionDoc));
}

export const workoutService = {
    /**
     * Busca templates de treino para um usuário específico.
     * @param {string} userId - O UID do usuário (ou estudante).
     * @param {boolean} forceRefresh - Ignorar cache.
     * @returns {Promise<Array>} Lista de templates.
     */
    async getTemplates(userId, forceRefresh = false) {
        const { db, collection, query, where, getDocs } = await getFirestoreDeps();
        // Retornar dados cacheados se válidos
        const now = Date.now();
        if (
            !forceRefresh &&
            templatesCache.userId === userId &&
            templatesCache.data &&
            (now - templatesCache.timestamp < CACHE_DURATION)
        ) {
            return templatesCache.data;
        }

        try {
            const templatesRef = collection(db, TEMPLATES_COLLECTION);
            const q = query(
                templatesRef,
                where('userId', '==', userId)
            );

            const snap = await getDocs(q);
            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sorted = sortWorkoutTemplates(list);

            // Atualizar Cache
            templatesCache = {
                userId,
                data: sorted,
                timestamp: now
            };

            return sorted;
        } catch (error) {
            console.error("Error fetching templates:", error);
            notify.error("Erro ao carregar treinos. Verifique sua conexão.");
            throw error;
        }
    },

    /**
     * Busca um único template de treino por ID.
     * @param {string} workoutId 
     * @returns {Promise<Object|null>}
     */
    async getWorkoutById(workoutId) {
        try {
            const { db, doc, getDoc } = await getFirestoreDeps();
            const docRef = doc(db, TEMPLATES_COLLECTION, workoutId);
            const snap = await getDoc(docRef);
            if (!snap.exists()) return null;
            return { id: snap.id, ...snap.data() };
        } catch (error) {
            console.error("Error fetching workout by ID:", error);
            return null;
        }
    },

    /**
     * Inscrever-se em atualizações em tempo real para templates de treino.
     * @param {string} userId
     * @param {function} onUpdate - Callback com nova lista de templates
     * @returns {function} Função unsubscribe
     */
    async subscribeToTemplates(userId, onUpdate) {
        const { db, collection, query, where, onSnapshot } = await getFirestoreDeps();
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(templatesRef, where('userId', '==', userId));

        // onSnapshot retorna uma função de cancelamento
        return onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sorted = sortWorkoutTemplates(list);

            // Também atualizar cache silenciosamente para mantê-lo fresco
            templatesCache = {
                userId,
                data: sorted,
                timestamp: Date.now()
            };

            onUpdate(sorted);
        }, (error) => {
            console.error("Error in template subscription:", error);
        });
    },

    /**
     * Limpar Cache de Templates (ex: após criar novo treino)
     */
    clearCache() {
        templatesCache = { userId: null, data: null, timestamp: 0 };
    },

    async saveTemplateOrder(templates) {
        const orderedTemplates = templates.filter(template => template?.id);
        if (orderedTemplates.length === 0) return;

        const { db, doc, writeBatch } = await getFirestoreDeps();
        const batch = writeBatch(db);

        orderedTemplates.forEach((template, displayOrder) => {
            batch.update(doc(db, TEMPLATES_COLLECTION, template.id), { displayOrder });
        });

        await batch.commit();
        templatesCache = { userId: null, data: null, timestamp: 0 };
    },

    /**
     * Cria uma ficha de treino (template) no Firestore.
     * Caminho de escrita único, reutilizado por CreateWorkoutPage, pela biblioteca
     * de modelos prontos e pela importação por PDF.
     *
     * @param {Object} params
     * @param {string} params.name - Nome da ficha.
     * @param {Array} params.exercises - Exercícios já sanitizados (sem Proxies/undefined).
     * @param {string} params.targetUserId - Dono da ficha (aluno ou o próprio usuário).
     * @param {string} params.createdBy - UID de quem está criando (sempre o autenticado).
     * @param {Object} [extra] - Campos opcionais permitidos (category, muscleGroups, displayOrder...).
     * @returns {Promise<string>} ID do documento criado.
     */
    async createTemplate({ name, exercises, targetUserId, createdBy }, extra = {}) {
        const { db, collection, addDoc, serverTimestamp } = await getFirestoreDeps();
        const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
            ...extra,
            name,
            exercises,
            createdBy,
            userId: targetUserId,
            assignedByTrainer: targetUserId !== createdBy,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        this.clearCache();
        return docRef.id;
    },

    /**
     * Atualiza nome e exercícios de uma ficha existente.
     * @param {string} templateId
     * @param {{ name: string, exercises: Array }} data
     */
    async updateTemplate(templateId, { name, exercises }) {
        const { db, doc, updateDoc, serverTimestamp } = await getFirestoreDeps();
        await updateDoc(doc(db, TEMPLATES_COLLECTION, templateId), {
            name,
            exercises,
            updatedAt: serverTimestamp()
        });
        this.clearCache();
    },

    /**
     * Arquiva ou desarquiva uma ficha.
     * @param {string} templateId
     * @param {boolean} isArchived
     */
    async setTemplateArchived(templateId, isArchived) {
        const { db, doc, updateDoc } = await getFirestoreDeps();
        await updateDoc(doc(db, TEMPLATES_COLLECTION, templateId), { isArchived });
        this.clearCache();
    },

    /**
     * Remove uma ficha. Não altera sessões já concluídas.
     * @param {string} templateId
     */
    async deleteTemplate(templateId) {
        const { db, doc, deleteDoc } = await getFirestoreDeps();
        await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
        this.clearCache();
    },

    /**
     * Obter a ÚLTIMA sessão CONCLUÍDA do usuário (Limit 1).
     * Otimizado para lógica de "Próxima Sugestão".
     * @param {string} userId 
     * @returns {Promise<Object|null>}
     */
    async getLatestSession(userId) {
        try {
            const { db, collection, query, where, orderBy, limit, getDocs } = await getFirestoreDeps();
            const sessionsRef = collection(db, SESSIONS_COLLECTION);
            const q = query(
                sessionsRef,
                where('userId', '==', userId),
                orderBy('completedAt', 'desc'),
                limit(1)
            );

            const snap = await getDocs(q);
            if (snap.empty) return null;

            const doc = snap.docs[0];
            return {
                id: doc.id,
                ...doc.data(),
                date: doc.data().completedAt?.toDate()
            };
        } catch (err) {
            console.error("Error fetching latest session:", err);
            // Silent fail is acceptable here for UI, but logging is good.
            return null; // Fail gracefully
        }
    },

    /**
     * Busca sessões de histórico de treino com paginação.
     * @param {string} userId - O UID do usuário.
     * @param {string} templateName - Filtro por nome de template ou ID (Legado usa templateName).
     * @param {string} exerciseName - Filtro opcional por exercício (geralmente client-side, mas podemos tentar server-side se estrutura permitir).
     * @param {Object} lastDoc - O último snapshot de documento da busca anterior (para paginação).
     * @param {number} pageSize - Número de itens para buscar.
     * @returns {Promise<{data: Array, lastDoc: Object, hasMore: boolean}>}
     */
    async getHistory(userId, templateName, lastDoc = null, pageSize = 10) {
        try {
            const { db, collection, query, where, orderBy, startAfter, limit, getDocs } = await getFirestoreDeps();
            const sessionsRef = collection(db, SESSIONS_COLLECTION);

            // Restrições base
            const constraints = [
                where('userId', '==', userId),
            ];

            if (templateName) {
                constraints.push(where('templateName', '==', templateName));
            }

            // Nota: Se filtrar por templateName, idealmente precisamos de um índice composto com completedAt.
            // Se apenas userId, precisamos de índice em userId + completedAt.

            // Nota: Se usarmos 'where' na igualdade (userId, templateName) e sort por completedAt,
            // Firestore requer um Índice Composto.
            // "userId Asc, templateName Asc, completedAt Desc"

            // Se quisermos evitar criação de índice AGORA MESMO para a demo do usuário, talvez tenhamos que buscar mais e fatiar?
            // Mas o objetivo É otimização. Então DEVEMOS solicitar o índice.
            // Contudo, para manter "funcionalidade existente" sem quebrar fluxo atual (que removeu orderBy), 
            // talvez não possamos paginar totalmente server-side sem esse índice.

            // Estratégia: Ordenação Server-side para garantir paginação consistente.
            // Isso requer um Índice Composto (userId + completedAt) no Firestore.
            // Se o índice faltar, a query lançará erro (monitorado no console/toast).
            // Otimização: Ordenação Server-side (Requer índice composto [userId, completedAt] no Firebase Console)
            constraints.push(orderBy('completedAt', 'desc'));

            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            constraints.push(limit(pageSize));

            const q = query(sessionsRef, ...constraints);
            const snap = await getDocs(q);

            const data = snap.docs.map(mapSessionDoc);
            const newLastDoc = snap.docs[snap.docs.length - 1];

            return {
                data,
                // Na ordenação server-side, a ordem já vem correta
                lastDoc: newLastDoc,
                hasMore: snap.docs.length === pageSize
            };

        } catch (error) {
            console.error("Error fetching history:", error);
            if (error.code === 'failed-precondition') {
                console.warn("🔥 FIRESTORE INDEX MISSING! Open this link to create it:", error.message);
                notify.error("Erro de índice. Verifique o console.");
            } else {
                notify.error("Erro ao carregar histórico.");
            }
            throw error;
        }
    },

    /**
     * Busca as sessões concluídas mais recentes com limite explícito.
     * Use este método para dashboards, estatísticas recentes e telas que não precisam
     * materializar todo o histórico do usuário.
     * @param {string} userId
     * @param {number} limitCount
     * @returns {Promise<Array>}
     */
    async getRecentSessions(userId, limitCount = SESSION_LIMITS.dashboardRecent) {
        const deps = await getFirestoreDeps();
        const { db, collection, query, where, orderBy, limit, getDocs } = deps;
        const safeLimit = Math.max(1, Math.min(Number(limitCount) || SESSION_LIMITS.dashboardRecent, 500));
        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const q = query(
            sessionsRef,
            where('userId', '==', userId),
            orderBy('completedAt', 'desc'),
            limit(safeLimit)
        );

        try {
            const snap = await getDocs(q);
            const sessions = snap.docs.map(mapSessionDoc);
            if (sessions.length > 0) return sessions;
        } catch (error) {
            console.warn('Falling back to legacy recent sessions query.', error);
        }

        return getLegacyRecentSessions(deps, userId, safeLimit);
    },

    /**
     * Buscar todas as sessões para análise (sem paginação)
     * @param {string} userId 
     * @returns {Promise<Array>}
     */
    async getAllSessions(userId) {
        const { db, collection, query, where, getDocs } = await getFirestoreDeps();
        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const q = query(
            sessionsRef,
            where('userId', '==', userId)
            // Sem limite, talvez orderBy dependendo da necessidade, mas para stats apenas precisamos dos dados.
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    /**
     * Inscrever-se nas sessões recentes do usuário.
     * Mantém o dashboard em tempo real sem abrir stream sobre todo o histórico.
     * @param {string} userId
     * @param {function} callback
     * @param {number} limitCount
     * @returns {function} unsubscribe
     */
    async subscribeToRecentSessions(userId, callback, limitCount = SESSION_LIMITS.dashboardRecent) {
        const { db, collection, query, where, orderBy, limit, onSnapshot } = await getFirestoreDeps();
        const safeLimit = Math.max(1, Math.min(Number(limitCount) || SESSION_LIMITS.dashboardRecent, 500));
        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const q = query(
            sessionsRef,
            where('userId', '==', userId),
            orderBy('completedAt', 'desc'),
            limit(safeLimit)
        );
        return onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(mapSessionDoc);
            callback(sessions);
        }, (error) => {
            console.error("Error subscribing to recent sessions:", error);
        });
    },

    /**
     * Inscrever-se em sessões do usuário (histórico em tempo real)
     * @param {string} userId
     * @param {function} callback
     * @returns {function} unsubscribe
     */
    async subscribeToSessions(userId, callback) {
        const { db, collection, query, where, onSnapshot } = await getFirestoreDeps();
        const sessionsRef = collection(db, SESSIONS_COLLECTION);
        const q = query(
            sessionsRef,
            where('userId', '==', userId)
        );
        return onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(sessions);
        }, (error) => {
            console.error("Error subscribing to sessions:", error);
        });
    },

    /**
     * Buscar exercícios no catálogo global.
     * @param {string} searchTerm
     * @param {string|null} muscleFilter (Opcional)
     * @param {number} limitCount
     * @returns {Promise<Array>}
     */
    async searchExercises(searchTerm, muscleFilter = null, limitCount = 20) {
        try {
            const { db, collection, query, where, limit, getDocs } = await getFirestoreDeps();
            const catalogRef = collection(db, 'exercises_catalog');
            const term = searchTerm ? searchTerm.toLowerCase().trim() : '';

            // ESTRATÉGIA:
            // 1. Se Filtro Muscular ON: Query por Grupo Muscular -> Filtro por Nome client-side.
            //    Razão: Evita necessidade de Índice Composto (Músculo + ChaveBusca) que quebra se ausente.
            // 2. Se Filtro Muscular OFF: Query por ChaveBusca (Range) -> Busca prefixo padrão.

            let results;

            if (muscleFilter) {
                // O catálogo grava o vocabulário do dataset de origem ("Isquiotibiais",
                // "Meio-das-costas", "Biceps"), não o rótulo desta tela. Comparar por
                // igualdade só acertava "Peito" e "Ombros"; daí o `in` com os aliases.
                // Ver src/data/muscleGroups.js.
                results = catalogByMuscleCache.get(muscleFilter);
                if (!results) {
                    const q = query(
                        catalogRef,
                        where('muscleGroup', 'in', catalogValuesFor(muscleFilter)),
                        limit(CATALOG_GROUP_FETCH_LIMIT)
                    );
                    const snap = await getDocs(q);
                    results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    catalogByMuscleCache.set(muscleFilter, results);
                }
            } else {
                const constraints = term
                    // Busca Global (Prefixo)
                    ? [
                        where('searchKey', '>=', term),
                        where('searchKey', '<=', term + '\uf8ff'),
                        limit(limitCount)
                    ]
                    // Sem filtro e sem termo: devolve só alguns, para não varrer o catálogo.
                    : [limit(limitCount)];

                const snap = await getDocs(query(catalogRef, ...constraints));
                results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }

            // Filtragem no cliente se usamos estratégia de filtro muscular com um termo
            if (muscleFilter && term) {
                results = results.filter(r => {
                    const name = r.name?.toLowerCase() || '';
                    const searchKey = r.searchKey || '';
                    return name.includes(term) || searchKey.includes(term);
                });
                // Re-aplicar limite após filtragem
                results = results.slice(0, limitCount);
            }

            return results;

        } catch (error) {
            console.error("Error searching exercises:", error);
            notify.error("Erro ao buscar exercícios. Verifique sua conexão.");
            return [];
        }
    },

    /**
     * Salva uma sessão manual de Cardio no histórico do usuário.
     * @param {string} userId
     * @param {Object} cardioData
     * @returns {Promise<string>} O ID do documento criado
     */
    async saveCardioSession(userId, cardioData) {
        try {
            const { db, collection, addDoc, serverTimestamp } = await getFirestoreDeps();
            const sessionsRef = collection(db, SESSIONS_COLLECTION);
            
            const sessionDoc = {
                userId,
                isCardio: true,
                workoutName: `Cardio: ${cardioData.activityType}`,
                activityType: cardioData.activityType,
                durationMin: Number(cardioData.durationMin) || 0,
                distanceKm: Number(cardioData.distanceKm) || 0,
                intensity: cardioData.intensity,
                calories: Number(cardioData.calories) || 0,
                notes: cardioData.notes || '',
                createdAt: serverTimestamp(),
                completedAt: serverTimestamp(),
                completedAtClient: new Date().toISOString(),
                // Arrays vazios para garantir retrocompatibilidade com componentes que esperam treinos de força
                exercises: [],
                results: {} 
            };

            const docRef = await addDoc(sessionsRef, sessionDoc);
            return docRef.id;
        } catch (error) {
            console.error("Error saving cardio session:", error);
            notify.error("Erro ao salvar sessão de cardio.");
            throw error;
        }
    }
};
