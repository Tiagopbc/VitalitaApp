/**
 * workoutPdfImport.js
 * Cliente da importação de treino por PDF. Lê o arquivo, anexa o Firebase ID token
 * e chama /api/parse-workout-pdf, que devolve a ficha estruturada para revisão.
 * A escrita no Firestore continua sendo feita pelo cliente (via workoutService).
 */

import { auth } from '../firebaseAuth';

// ~3 MB de PDF (o servidor limita o base64 a ~3,3 MB). Fichas de treino são pequenas.
const MAX_PDF_BYTES = 3 * 1024 * 1024;

/**
 * A feature depende de configuração de servidor (`ANTHROPIC_API_KEY`), que o cliente
 * não tem como inspecionar sem gastar uma requisição. Usamos a mesma convenção de
 * flag do projeto (ver `VITE_ENABLE_SERVER_USER_STATS`) para não exibir um botão que
 * só falharia ao ser clicado em ambientes sem a chave configurada.
 */
export function isPdfImportEnabled() {
    return import.meta.env.VITE_ENABLE_PDF_IMPORT === 'true';
}

/**
 * Converte a marca `groupedWithPrevious` (vinda da API) no `groupId` que o app
 * usa para ligar exercícios de um bi-set/tri-set. Exercícios consecutivos
 * marcados compartilham o mesmo id — é o que `exerciseGroups.js` espera.
 */
export function assignGroupIds(exercises = []) {
    const out = exercises.map(ex => {
        const { groupedWithPrevious, ...rest } = ex;
        return { rest, grouped: Boolean(groupedWithPrevious) };
    });
    for (let i = 1; i < out.length; i++) {
        if (out[i].grouped) {
            const gid = out[i - 1].rest.groupId
                || `grp_${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 5)}`;
            out[i - 1].rest.groupId = gid;
            out[i].rest.groupId = gid;
        }
    }
    return out.map(o => o.rest);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const comma = result.indexOf(',');
            resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(reader.error || new Error('read_failed'));
        reader.readAsDataURL(file);
    });
}

/**
 * @param {File} file - PDF selecionado pelo usuário.
 * @returns {Promise<{ workouts: Array<{ name: string, exercises: Array }> }>}
 *          uma ficha por treino do PDF (Treino A, B, C...), para revisão em fila.
 */
export async function importWorkoutFromPdf(file) {
    if (!file) throw new Error('Selecione um arquivo PDF.');
    if (file.type !== 'application/pdf') throw new Error('O arquivo precisa ser um PDF.');
    if (file.size > MAX_PDF_BYTES) throw new Error('PDF muito grande (máximo 3 MB).');

    // Usa o módulo de auth já inicializado do projeto. NÃO troque por
    // `await import('firebase/auth')`: como todo o resto do app importa esse
    // pacote de forma estática, misturar import dinâmico faz o manualChunks do
    // vite.config.js emitir o vendor-firebase-app com dependência circular, e o
    // app quebra em produção com "Cannot access 're' before initialization".
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Sessão expirada. Entre novamente.');
    const idToken = await currentUser.getIdToken();

    const pdfBase64 = await fileToBase64(file);

    let res;
    try {
        res = await fetch('/api/parse-workout-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify({ pdfBase64 })
        });
    } catch {
        throw new Error('Sem conexão para importar o PDF.');
    }

    // 404 = a função serverless não está no ar. Acontece com `npm run dev`, que
    // serve só o front-end. Não é problema do arquivo do usuário — não culpe o PDF.
    if (res.status === 404) {
        throw new Error('Importação por PDF indisponível neste ambiente. Use "npx vercel dev" ou o site publicado.');
    }
    if (res.status === 503) throw new Error('Importação por PDF indisponível no momento.');
    if (res.status === 401) throw new Error('Não autorizado. Entre novamente.');
    if (res.status === 413) throw new Error('PDF muito grande (máximo 3 MB).');
    if (res.status === 422) throw new Error('Não encontramos exercícios nesse PDF. Confira se a ficha está legível.');
    // 402 = saldo esgotado no provedor de IA. Mensagem deliberadamente neutra: o
    // aluno não precisa (nem deve) saber de cobrança, só do que fazer agora.
    if (res.status === 402) {
        throw new Error('A leitura automática está indisponível. Avise o suporte do app — enquanto isso, você pode cadastrar o treino manualmente.');
    }
    if (res.status === 429) {
        throw new Error('Muitas importações ao mesmo tempo. Tente novamente em alguns minutos.');
    }
    if (!res.ok) throw new Error('Não foi possível ler esse PDF. Tente outro arquivo.');

    const data = await res.json().catch(() => ({}));
    const rawWorkouts = Array.isArray(data?.workouts) ? data.workouts : [];
    const workouts = rawWorkouts
        .map(w => ({
            name: w?.name || '',
            exercises: assignGroupIds(Array.isArray(w?.exercises) ? w.exercises : [])
        }))
        .filter(w => w.exercises.length > 0);

    if (workouts.length === 0) throw new Error('Não encontramos exercícios nesse PDF.');

    return { workouts };
}
