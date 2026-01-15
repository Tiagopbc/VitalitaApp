
import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../serviceAccountKey.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const EXERCISES_URL = "https://github.com/joao-gugel/exercicios-bd-ptbr/raw/refs/heads/main/exercises/exercises-ptbr-full-translation.json";
const COLLECTION_NAME = "exercises_catalog";

async function importExercises() {
    try {
        console.log(`Starting import from ${EXERCISES_URL}...`);

        // 1. Fetch JSON
        const response = await axios.get(EXERCISES_URL);
        const exercises = response.data;
        console.log(`Fetched ${exercises.length} exercises.`);

        // 2. Prepare Batches
        // Firestore batch limit is 500
        const BATCH_SIZE = 400;
        let batch = db.batch();
        let counter = 0;
        let totalProcessed = 0;

        for (const ex of exercises) {
            const docId = ex.id; // use original ID as doc ID to prevent duplicates
            const docRef = db.collection(COLLECTION_NAME).doc(docId);

            // Normalize muscle group
            const muscleGroup = (ex.primaryMuscles && ex.primaryMuscles.length > 0)
                ? ex.primaryMuscles[0].charAt(0).toUpperCase() + ex.primaryMuscles[0].slice(1)
                : "Geral";

            const primaryMuscles = ex.primaryMuscles || [];
            const secondaryMuscles = ex.secondaryMuscles || [];

            // Search Key: lowercase for easier search
            const searchKey = ex.name.toLowerCase();

            const data = {
                name: ex.name,
                originalId: ex.id,
                muscleGroup: muscleGroup,
                primaryMuscles: primaryMuscles,
                secondaryMuscles: secondaryMuscles,
                equipment: ex.equipment || 'outro',
                difficulty: ex.level || 'iniciante',
                mechanic: ex.mechanic || null,
                force: ex.force || null,
                instructions: ex.instructions || [],
                category: ex.category || 'geral',
                images: ex.images || [],
                searchKey: searchKey,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            batch.set(docRef, data, { merge: true });
            counter++;
            totalProcessed++;

            if (counter >= BATCH_SIZE) {
                console.log(`Committing batch of ${counter} items... (Total so far: ${totalProcessed})`);
                await batch.commit();
                batch = db.batch();
                counter = 0;
            }
        }

        // Commit final batch
        if (counter > 0) {
            console.log(`Committing final batch of ${counter} items...`);
            await batch.commit();
        }

        console.log(`✅ Import finished! Total processed: ${totalProcessed}`);
        process.exit(0);

    } catch (error) {
        console.error("❌ Import failed:", error);
        process.exit(1);
    }
}

importExercises();
