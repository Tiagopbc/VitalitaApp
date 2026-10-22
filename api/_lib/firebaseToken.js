/**
 * firebaseToken.js
 *
 * Verificação do ID token do Firebase nas funções serverless.
 *
 * Mora em `api/_lib/` porque a Vercel não trata como rota os arquivos cujo nome
 * começa com `_` — o módulo é empacotado junto de quem o importa, sem virar um
 * endpoint público.
 *
 * A verificação é criptográfica, não um `decode`: confere a assinatura contra
 * as chaves públicas do Google, mais o emissor e a audiência amarrados ao
 * projeto. Um token de outro projeto Firebase, ou forjado, não passa.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URL =
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwksCache;

function getJwks() {
    if (!jwksCache) {
        jwksCache = createRemoteJWKSet(new URL(JWKS_URL));
    }
    return jwksCache;
}

/**
 * Verifica o cabeçalho `Authorization: Bearer <idToken>`.
 *
 * @param {string|undefined} authHeader
 * @param {string} projectId
 * @returns {Promise<object|null>} Payload do token, ou `null` se inválido.
 */
export async function verifyFirebaseToken(authHeader, projectId) {
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
 * Guarda de autenticação para um handler.
 *
 * Responde 503 quando o projeto não está configurado e 401 quando o token falta
 * ou não vale, e devolve `null` nos dois casos para o handler sair.
 *
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @returns {Promise<object|null>} Payload do token, ou `null` se já respondeu.
 */
export async function requireFirebaseUser(req, res) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
        res.status(503).json({ error: 'auth_not_configured' });
        return null;
    }

    const payload = await verifyFirebaseToken(req.headers?.authorization, projectId);
    if (!payload) {
        res.status(401).json({ error: 'unauthorized' });
        return null;
    }

    return payload;
}
