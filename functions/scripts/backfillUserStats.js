import { pathToFileURL } from "node:url";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { FieldPath, FieldValue, getFirestore } from "firebase-admin/firestore";
import { buildUserStatsFromSessions } from "../src/userStatsCalculator.js";

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_SESSIONS = 2000;

export function parseBackfillOptions(argv = []) {
    const options = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || null,
        batchSize: DEFAULT_BATCH_SIZE,
        maxSessions: DEFAULT_MAX_SESSIONS,
        limitUsers: null,
        userId: null,
        write: false
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        const next = argv[index + 1];

        switch (arg) {
            case "--project":
                options.projectId = requireValue(arg, next);
                index += 1;
                break;
            case "--batch-size":
                options.batchSize = parsePositiveInteger(arg, next);
                index += 1;
                break;
            case "--max-sessions":
                options.maxSessions = parsePositiveInteger(arg, next);
                index += 1;
                break;
            case "--limit-users":
                options.limitUsers = parsePositiveInteger(arg, next);
                index += 1;
                break;
            case "--user":
                options.userId = requireValue(arg, next);
                index += 1;
                break;
            case "--write":
                options.write = true;
                break;
            case "--dry-run":
                options.write = false;
                break;
            case "--help":
                options.help = true;
                break;
            default:
                throw new Error(`Argumento desconhecido: ${arg}`);
        }
    }

    return options;
}

export function printUsage() {
    console.log(`Uso:
  npm run backfill:user-stats -- --project <firebase-project-id> [opcoes]

Opcoes:
  --write                  Grava user_stats. Sem isto, roda em dry-run.
  --user <uid>             Processa apenas um usuário.
  --limit-users <numero>   Limita quantos usuários serão processados.
  --batch-size <numero>    Tamanho da paginação de users. Padrão: ${DEFAULT_BATCH_SIZE}.
  --max-sessions <numero>  Máximo de sessões lidas por usuário. Padrão: ${DEFAULT_MAX_SESSIONS}.
  --dry-run                Força modo simulação.
  --help                   Mostra esta ajuda.

Autenticacao:
  Use GOOGLE_APPLICATION_CREDENTIALS com uma service account de admin,
  ou Application Default Credentials com permissao de leitura/escrita no Firestore.
`);
}

export async function backfillUserStats(db, options, log = console) {
    const startedAt = new Date();
    const summary = {
        processedUsers: 0,
        writtenUsers: 0,
        skippedUsers: 0,
        failedUsers: 0,
        dryRun: !options.write
    };

    if (options.userId) {
        await processUser(db, options.userId, options, summary, log, startedAt);
        return summary;
    }

    let lastDoc = null;
    let shouldContinue = true;

    while (shouldContinue) {
        let query = db.collection("users")
            .orderBy(FieldPath.documentId())
            .limit(options.batchSize);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const usersSnap = await query.get();
        if (usersSnap.empty) break;

        for (const userDoc of usersSnap.docs) {
            await processUser(db, userDoc.id, options, summary, log, startedAt, userDoc.data());

            if (options.limitUsers && summary.processedUsers >= options.limitUsers) {
                shouldContinue = false;
                break;
            }
        }

        lastDoc = usersSnap.docs[usersSnap.docs.length - 1];
        if (usersSnap.size < options.batchSize) shouldContinue = false;
    }

    return summary;
}

async function processUser(db, userId, options, summary, log, startedAt, userData = null) {
    try {
        const resolvedUserData = userData || (await db.doc(`users/${userId}`).get()).data();
        if (!resolvedUserData) {
            summary.skippedUsers += 1;
            log.warn(`[skip] user ${userId} nao encontrado`);
            return;
        }

        const sessionsSnap = await db.collection("workout_sessions")
            .where("userId", "==", userId)
            .orderBy("completedAt", "desc")
            .limit(options.maxSessions)
            .get();

        const sessions = sessionsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        const stats = buildUserStatsFromSessions(sessions, {
            userId,
            weeklyGoal: Number(resolvedUserData.weeklyGoal) || 4,
            now: startedAt
        });

        summary.processedUsers += 1;

        if (!options.write) {
            log.info(`[dry-run] ${userId}: ${stats.totalWorkouts} treinos, ${stats.totalTonnageKg}kg volume`);
            return;
        }

        await db.doc(`user_stats/${userId}`).set({
            ...stats,
            source: "backfill_script",
            backfillLimit: options.maxSessions,
            backfillTruncated: sessionsSnap.size >= options.maxSessions,
            backfilledAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: false });

        summary.writtenUsers += 1;
        log.info(`[write] ${userId}: ${stats.totalWorkouts} treinos, ${stats.totalTonnageKg}kg volume`);
    } catch (error) {
        summary.failedUsers += 1;
        log.error(`[error] ${userId}: ${error.message}`);
    }
}

function requireValue(arg, value) {
    if (!value || value.startsWith("--")) {
        throw new Error(`${arg} exige um valor`);
    }
    return value;
}

function parsePositiveInteger(arg, value) {
    const parsed = Number.parseInt(requireValue(arg, value), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`${arg} precisa ser um inteiro positivo`);
    }
    return parsed;
}

async function main() {
    const options = parseBackfillOptions(process.argv.slice(2));

    if (options.help) {
        printUsage();
        return;
    }

    if (!options.projectId) {
        throw new Error("Informe --project <firebase-project-id> ou GOOGLE_CLOUD_PROJECT.");
    }

    initializeApp({
        credential: applicationDefault(),
        projectId: options.projectId
    });

    const db = getFirestore();
    const mode = options.write ? "WRITE" : "DRY-RUN";
    console.log(`[start] user_stats backfill (${mode}) project=${options.projectId}`);

    const summary = await backfillUserStats(db, options);
    console.log(`[done] ${JSON.stringify(summary)}`);

    if (summary.failedUsers > 0) {
        process.exitCode = 1;
    }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(`[fatal] ${error.message}`);
        process.exitCode = 1;
    });
}
