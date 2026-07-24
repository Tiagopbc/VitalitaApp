/**
 * /api/parse-workout-pdf
 * Lê um PDF de treino com IA (Anthropic) e devolve a ficha estruturada em JSON.
 *
 * NÃO grava no Firestore: o cliente autenticado faz a escrita respeitando as
 * firestore.rules vigentes (inclusive personal → aluno). Esta função só parseia.
 *
 * Corpo:   { pdfBase64: string }
 * Header:  Authorization: Bearer <Firebase ID token>   (controle de abuso do endpoint pago)
 * Resposta: { workouts: Array<{ name, exercises: Array<{ muscleGroup, name, sets, reps,
 *            method, rest, notes, targetWeight, groupedWithPrevious }> }> }
 *
 * Um PDF pode ter vários treinos (Treino A, B, C...). Bi-set/tri-set são
 * DECOMPOSTOS em exercícios separados e consecutivos, marcados com
 * `groupedWithPrevious` — o cliente converte isso no `groupId` que liga a dupla.
 */
import Anthropic from '@anthropic-ai/sdk';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Modelo com suporte nativo a PDF. Opus 4.8 pela precisão de extração —
// erro de leitura vira série/repetição errada na ficha do aluno.
const MODEL = 'claude-opus-4-8';
// ~3,3 MB de PDF em base64. Protege o limite de corpo das funções da Vercel.
const MAX_PDF_BASE64 = 4_400_000;

// Devem espelhar as listas de CreateWorkoutPage.jsx.
const MUSCLE_GROUPS = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen'];
const METHODS = ['Convencional', 'Drop-set', 'Pirâmide Crescente', 'Pirâmide Decrescente', 'Cluster set', 'Bi-set', 'Pico de contração', 'Falha total', 'Negativa', 'Rest-Pause', 'Cardio 140 bpm'];

const EXERCISE_SCHEMA = {
    type: 'object',
    properties: {
        muscleGroup: { type: 'string', enum: MUSCLE_GROUPS },
        name: { type: 'string', description: 'Nome de UM exercício. Em bi-set/tri-set, NÃO junte os nomes com "+".' },
        sets: { type: 'string', description: 'Número de séries (ex.: "4").' },
        reps: { type: 'string', description: 'Repetições. Faixas "8-12" e séries de drop-set "10+12+15" preservadas.' },
        method: { type: 'string', enum: METHODS },
        rest: { type: 'string', description: 'Descanso (ex.: "60s").' },
        notes: { type: 'string' },
        targetWeight: { type: 'string', description: 'Carga em kg, se prescrita. Apenas o número.' },
        groupedWithPrevious: {
            type: 'boolean',
            description: 'true se este exercício é executado em conjunto (bi-set/tri-set) com o exercício IMEDIATAMENTE anterior desta ficha. O primeiro exercício de um bi-set fica false; o segundo (e o terceiro, num tri-set) fica true.'
        }
    },
    required: ['name', 'sets', 'reps']
};

const WORKOUT_TOOL = {
    name: 'registrar_treinos',
    description: 'Registra TODOS os treinos/fichas encontrados no PDF (ex.: Treino A, B e C), preservando a ordem dos exercícios de cada um.',
    input_schema: {
        type: 'object',
        properties: {
            workouts: {
                type: 'array',
                description: 'Um item por ficha do documento. Leia todas as páginas.',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Nome da ficha, com o foco. Ex.: "Treino A - Costas, bíceps e abdômen".' },
                        exercises: { type: 'array', items: EXERCISE_SCHEMA }
                    },
                    required: ['name', 'exercises']
                }
            }
        },
        required: ['workouts']
    }
};

const PROMPT = [
    'Extraia TODAS as fichas de treino de musculação deste PDF e registre-as com a ferramenta.',
    'O documento costuma ter vários treinos (ex.: "Treino A", "Treino B", "Treino C") — cada cabeçalho de treino é uma ficha separada em `workouts`, na ordem. Leia todas as páginas.',
    '',
    'Regras:',
    '- Nome da ficha: use o cabeçalho com o foco entre parênteses. Ex.: "Treino A - Costas, bíceps e abdômen".',
    '- BI-SET / TRI-SET: quando dois (ou três) exercícios são feitos em conjunto — indicado por "bi-set", "tri-set" ou por "Exercício A + Exercício B" — registre-os como exercícios SEPARADOS e consecutivos. O primeiro com groupedWithPrevious=false; cada exercício seguinte do mesmo conjunto com groupedWithPrevious=true. Use method "Bi-set" em todos eles. NUNCA junte os dois nomes com "+".',
    '- DROP-SET: é UM único exercício, method "Drop-set". As repetições em cascata (ex.: "10+12+15") vão inteiras no campo reps.',
    '- Séries e repetições: "4 x 15" → sets "4", reps "15". Preserve faixas como "8-12".',
    '- Descanso: "1m inter." → rest "60s".',
    '- Grupo muscular: infira pelo foco do treino e pelo exercício.',
    '- Carga (kg), se prescrita, vai em targetWeight (apenas o número).',
    '- Não invente exercícios que não estejam no documento.'
].join('\n');

let jwksCache;
function getJwks() {
    if (!jwksCache) {
        jwksCache = createRemoteJWKSet(
            new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
        );
    }
    return jwksCache;
}

async function verifyFirebaseToken(authHeader, projectId) {
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getJwks(), {
            issuer: `https://securetoken.google.com/${projectId}`,
            audience: projectId
        });
        return payload.sub ? payload : null;
    } catch {
        return null;
    }
}

/**
 * Identifica falta de saldo/problema de cobrança na Anthropic.
 * A API sinaliza isso de formas diferentes conforme o caso (402, 403 com
 * `type: billing_error`, ou 400 citando o saldo), então checamos status, type e
 * mensagem em vez de depender de um formato único.
 */
function isBillingError(err) {
    const status = err?.status;
    const type = err?.type || err?.error?.type;

    if (status === 402) return true;
    if (type === 'billing_error') return true;

    const message = String(err?.message || '').toLowerCase();
    return status === 400 && /credit balance|billing|insufficient|quota/.test(message);
}

function cleanShort(value, fallback) {
    if (value === null || value === undefined) return fallback;
    const str = String(value).trim();
    return str ? str.slice(0, 20) : fallback;
}

// Prefixo "Bi-set:" / "Bi- set -" / "Tri-set —" no início do nome.
const GROUP_PREFIX_RE = /^\s*(bi-?\s*set|tri-?\s*set)\b\s*[:\-–—]?\s*/i;
const GROUP_HINT_RE = /bi-?\s*set|tri-?\s*set/i;

/**
 * Decompõe um bi-set/tri-set num array de exercícios separados e ligados.
 * Rede de segurança determinística: mesmo que a IA devolva "A + B" num único
 * exercício, aqui ele vira dois, com groupedWithPrevious marcando a ligação.
 * Exercícios avulsos (e drop-sets, cujas reps têm "+") passam intactos.
 */
function decomposeExercise(ex) {
    const rawName = String(ex.name).trim();
    const looksGrouped = GROUP_HINT_RE.test(rawName) || GROUP_HINT_RE.test(String(ex.method || ''));
    const nameNoPrefix = rawName.replace(GROUP_PREFIX_RE, '').trim();
    const parts = nameNoPrefix.split(/\s*\+\s*/).map(p => p.trim()).filter(Boolean);

    if (looksGrouped && parts.length >= 2) {
        return parts.map((partName, idx) => ({
            ...ex,
            name: partName,
            method: 'Bi-set',
            groupedWithPrevious: idx > 0
        }));
    }
    // Avulso: mantém o nome sem o prefixo de grupo (se houver) e honra a marca da IA.
    return [{ ...ex, name: nameNoPrefix || rawName, groupedWithPrevious: Boolean(ex.groupedWithPrevious) }];
}

function sanitizeExerciseFields(ex) {
    return {
        muscleGroup: MUSCLE_GROUPS.includes(ex.muscleGroup) ? ex.muscleGroup : 'Geral',
        name: String(ex.name).trim().slice(0, 80),
        sets: cleanShort(ex.sets, '3'),
        reps: cleanShort(ex.reps, '12'),
        method: METHODS.includes(ex.method) ? ex.method : 'Convencional',
        rest: cleanShort(ex.rest, ''),
        notes: typeof ex.notes === 'string' ? ex.notes.trim().slice(0, 200) : '',
        targetWeight: cleanShort(ex.targetWeight, ''),
        groupedWithPrevious: Boolean(ex.groupedWithPrevious)
    };
}

function sanitizeWorkout(input) {
    const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 120) : '';
    const rawList = Array.isArray(input?.exercises) ? input.exercises : [];
    const exercises = rawList
        .filter(ex => ex && typeof ex.name === 'string' && ex.name.trim())
        .flatMap(decomposeExercise)
        .slice(0, 60)
        .map(sanitizeExerciseFields);

    // O primeiro exercício de uma ficha nunca está ligado a um anterior.
    if (exercises[0]) exercises[0].groupedWithPrevious = false;
    return { name, exercises };
}

function sanitizeResult(input) {
    const list = Array.isArray(input?.workouts) ? input.workouts : [];
    const workouts = list
        .map(sanitizeWorkout)
        .filter(w => w.exercises.length > 0)
        .slice(0, 10);
    return { workouts };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method_not_allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!apiKey || !projectId) {
        return res.status(503).json({ error: 'pdf_import_not_configured' });
    }

    const user = await verifyFirebaseToken(req.headers?.authorization, projectId);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const { pdfBase64 } = req.body ?? {};
    if (typeof pdfBase64 !== 'string' || pdfBase64.length === 0) {
        return res.status(400).json({ error: 'invalid_pdf' });
    }
    if (pdfBase64.length > MAX_PDF_BASE64) {
        return res.status(413).json({ error: 'pdf_too_large' });
    }

    try {
        const client = new Anthropic({ apiKey });
        const message = await client.messages.create({
            model: MODEL,
            max_tokens: 8192,
            tools: [WORKOUT_TOOL],
            tool_choice: { type: 'tool', name: WORKOUT_TOOL.name },
            messages: [{
                role: 'user',
                content: [
                    { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
                    { type: 'text', text: PROMPT }
                ]
            }]
        });

        const toolUse = Array.isArray(message?.content)
            ? message.content.find(c => c.type === 'tool_use' && c.name === WORKOUT_TOOL.name)
            : null;
        if (!toolUse?.input) {
            return res.status(422).json({ error: 'parse_failed' });
        }

        const parsed = sanitizeResult(toolUse.input);
        if (parsed.workouts.length === 0) {
            return res.status(422).json({ error: 'no_exercises_found' });
        }
        return res.status(200).json(parsed);
    } catch (err) {
        // Saldo esgotado: 402 é traduzido pelo cliente numa mensagem neutra pedindo
        // contato com o suporte. O aluno não deve ver detalhe de cobrança — quem
        // precisa saber que é saldo é o operador, e para isso serve este log.
        if (isBillingError(err)) {
            console.error('pdf_import_sem_saldo', {
                status: err?.status,
                type: err?.type,
                message: String(err?.message || err),
                acao: 'adicionar fundos em platform.claude.com (Créditos da organização)'
            });
            return res.status(402).json({ error: 'ai_billing' });
        }

        if (err?.status === 429) {
            console.error('pdf_import_rate_limited', { message: String(err?.message || err) });
            return res.status(429).json({ error: 'ai_rate_limited' });
        }

        console.error('pdf_import_failed', { status: err?.status, message: String(err?.message || err) });
        return res.status(502).json({ error: 'ai_unavailable' });
    }
}
