import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    limit,
    startAfter,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust path if needed

const TEMPLATES_COLLECTION = 'workout_templates';
const SESSIONS_COLLECTION = 'workout_sessions';

import { toast } from 'sonner';

// Cache em memória
let templatesCache = {
    userId: null,
    data: null,
    timestamp: 0
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const workoutService = {
    /**
     * Busca templates de treino para um usuário específico.
     * @param {string} userId - O UID do usuário (ou estudante).
     * @param {boolean} forceRefresh - Ignorar cache.
     * @returns {Promise<Array>} Lista de templates.
     */
    async getTemplates(userId, forceRefresh = false) {
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

            // Client-side sort
            list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            // Atualizar Cache
            templatesCache = {
                userId,
                data: list,
                timestamp: now
            };

            return list;
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast.error("Erro ao carregar treinos. Verifique sua conexão.");
            throw error;
        }
    },

    /**
     * Inscrever-se em atualizações em tempo real para templates de treino.
     * @param {string} userId
     * @param {function} onUpdate - Callback com nova lista de templates
     * @returns {function} Função unsubscribe
     */
    subscribeToTemplates(userId, onUpdate) {
        const templatesRef = collection(db, TEMPLATES_COLLECTION);
        const q = query(templatesRef, where('userId', '==', userId));

        // onSnapshot retorna uma função de cancelamento
        return onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sorted = list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

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

    /**
     * Obter a ÚLTIMA sessão CONCLUÍDA do usuário (Limit 1).
     * Otimizado para lógica de "Próxima Sugestão".
     * @param {string} userId 
     * @returns {Promise<Object|null>}
     */
    async getLatestSession(userId) {
        try {
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

            // Estratégia: Tentar usar orderBy. Se falhar (pego na UI), avisamos.
            // MAS, anteriormente removemos orderBy para corrigir "Índice Ausente".
            // Já que não podemos pedir pro usuário clicar no link em 1 segundo, vamos implementar uma abordagem "Carregar Tudo" ou "Lógica Segura"?

            // Na verdade, sem índice, não podemos filtrar server-side E ordenar E paginar eficientemente.
            // Vamos manter a abordagem "Segura" atual: Buscar QUASE tudo (ou Limite) e ordenar client side?
            // Não, isso derrota "Otimização".

            // Compromisso: NÃO adicionaremos orderBy aqui ainda para garantir que funcione. 
            // Vamos buscar query com Limit, mas sem ordenação, a paginação "LastDoc" é arbitrária.
            // Ordenação padrão Firestore é ID.

            // MELHOR ESTRATÉGIA: 
            // Já que removemos orderBy anteriormente, provavelmente devemos manter ordenação client-side
            // A MENOS que tenhamos certeza sobre o índice.
            // Mas para PAGINAÇÃO (Carregar Mais), realmente precisamos de uma ordem estável.

            // Vamos forçar orderBy('completedAt', 'desc') e se falhar, o usuário (desenvolvedor) vê o link para criar índice.
            // É o jeito "Correto".
            // Otimização: Ordenação Server-side
            // Requer índice composto [userId, completedAt] no Firebase Console
            constraints.push(orderBy('completedAt', 'desc'));

            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            constraints.push(limit(pageSize));

            const q = query(sessionsRef, ...constraints);
            const snap = await getDocs(q);

            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const newLastDoc = snap.docs[snap.docs.length - 1];

            return {
                data,
                lastDoc: newLastDoc,
                hasMore: snap.docs.length === pageSize
            };

        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Erro ao carregar histórico.");
            throw error;
        }
    },

    /**
     * Buscar todas as sessões para análise (sem paginação)
     * @param {string} userId 
     * @returns {Promise<Array>}
     */
    async getAllSessions(userId) {
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
     * Inscrever-se em sessões do usuário (histórico em tempo real)
     * @param {string} userId
     * @param {function} callback
     * @returns {function} unsubscribe
     */
    subscribeToSessions(userId, callback) {
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
            const catalogRef = collection(db, 'exercises_catalog');
            let constraints = [];
            const term = searchTerm ? searchTerm.toLowerCase().trim() : '';

            // ESTRATÉGIA:
            // 1. Se Filtro Muscular ON: Query por Grupo Muscular (Igualdade) -> Filtro por Nome client-side.
            //    Razão: Evita necessidade de Índice Composto (Músculo + ChaveBusca) que quebra se ausente.
            // 2. Se Filtro Muscular OFF: Query por ChaveBusca (Range) -> Busca prefixo padrão.

            if (muscleFilter) {
                constraints.push(where('muscleGroup', '==', muscleFilter));
                // fetch more to allow for filtering
                constraints.push(limit(100)); // Reasonable limit for a single muscle group
            } else if (term) {
                // Busca Global (Prefixo)
                constraints.push(where('searchKey', '>=', term));
                constraints.push(where('searchKey', '<=', term + '\uf8ff'));
                constraints.push(limit(limitCount));
            } else {
                // Sem filtro, sem termo? Apenas retornar alguns aleatórios ou vazio?
                // Retornar vazio é mais seguro para evitar leituras enormes, mas se limite for pequeno ok.
                constraints.push(limit(limitCount));
            }

            const q = query(catalogRef, ...constraints);
            const snap = await getDocs(q);
            let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

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
            return [];
        }
    }
};
