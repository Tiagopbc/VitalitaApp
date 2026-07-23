/**
 * /api/parse-workout-pdf
 * Lê um PDF de treino com IA (Anthropic) e devolve a ficha estruturada em JSON.
 *
 * NÃO grava no Firestore: o cliente autenticado faz a escrita respeitando as
 * firestore.rules vigentes (inclusive personal → aluno). Esta função só parseia.
 *
 * Corpo:   { pdfBase64: string }
 * Header:  Authorization: Bearer <Firebase ID token>   (controle de abuso do endpoint pago)
 * Resposta: { name: string, exercises: Array<{ muscleGroup, name, sets, reps, method, rest, notes, targetWeight }> }
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

const WORKOUT_TOOL = {
    name: 'registrar_treino',
    description: 'Registra a ficha de treino extraída do PDF, preservando a ordem dos exercícios.',
    input_schema: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Nome da ficha (ex.: "Treino A - Peito e Tríceps").' },
            exercises: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        muscleGroup: { type: 'string', enum: MUSCLE_GROUPS },
                        name: { type: 'string' },
                        sets: { type: 'string', description: 'Número de séries (ex.: "3").' },
                        reps: { type: 'string', description: 'Faixa de repetições (ex.: "8-12").' },
                        method: { type: 'string', enum: METHODS },
                        rest: { type: 'string', description: 'Descanso (ex.: "60s").' },
                        notes: { type: 'string' },
                        targetWeight: { type: 'string', description: 'Carga em kg, se prescrita. Apenas o número.' }
                    },
                    required: ['name', 'sets', 'reps']
                }
            }
        },
        required: ['name', 'exercises']
    }
};

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

function cleanShort(value, fallback) {
    if (value === null || value === undefined) return fallback;
    const str = String(value).trim();
    return str ? str.slice(0, 20) : fallback;
}

function sanitizeWorkout(input) {
    const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 120) : '';
    const list = Array.isArray(input?.exercises) ? input.exercises : [];
    const exercises = list
        .filter(ex => ex && typeof ex.name === 'string' && ex.name.trim())
        .slice(0, 40)
        .map(ex => ({
            muscleGroup: MUSCLE_GROUPS.includes(ex.muscleGroup) ? ex.muscleGroup : 'Geral',
            name: String(ex.name).trim().slice(0, 80),
            sets: cleanShort(ex.sets, '3'),
            reps: cleanShort(ex.reps, '12'),
            method: METHODS.includes(ex.method) ? ex.method : 'Convencional',
            rest: cleanShort(ex.rest, ''),
            notes: typeof ex.notes === 'string' ? ex.notes.trim().slice(0, 200) : '',
            targetWeight: cleanShort(ex.targetWeight, '')
        }));
    return { name, exercises };
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
            max_tokens: 4096,
            tools: [WORKOUT_TOOL],
            tool_choice: { type: 'tool', name: WORKOUT_TOOL.name },
            messages: [{
                role: 'user',
                content: [
                    { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
                    {
                        type: 'text',
                        text: 'Extraia a ficha de treino de musculação deste PDF e registre-a com a ferramenta. '
                            + 'Preserve a ordem dos exercícios. Quando a carga (kg) estiver prescrita, coloque-a em targetWeight (apenas o número). '
                            + 'Não invente exercícios que não estejam no documento.'
                    }
                ]
            }]
        });

        const toolUse = Array.isArray(message?.content)
            ? message.content.find(c => c.type === 'tool_use' && c.name === WORKOUT_TOOL.name)
            : null;
        if (!toolUse?.input) {
            return res.status(422).json({ error: 'parse_failed' });
        }

        const parsed = sanitizeWorkout(toolUse.input);
        if (parsed.exercises.length === 0) {
            return res.status(422).json({ error: 'no_exercises_found' });
        }
        return res.status(200).json(parsed);
    } catch (err) {
        console.error('pdf_import_failed', { message: String(err?.message || err) });
        return res.status(502).json({ error: 'ai_unavailable' });
    }
}
