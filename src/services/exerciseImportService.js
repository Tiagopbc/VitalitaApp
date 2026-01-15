import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Using JSDelivr to bypass CORS issues with raw.githubusercontent.com in browser
const EXERCISES_URL = "https://cdn.jsdelivr.net/gh/joao-gugel/exercicios-bd-ptbr@main/exercises/exercises-ptbr-full-translation.json";
const COLLECTION_NAME = "exercises_catalog";

export const exerciseImportService = {
    async importExercises() {
        try {
            console.log(`Starting import from ${EXERCISES_URL}...`);
            const response = await fetch(EXERCISES_URL);
            if (!response.ok) throw new Error("Failed to fetch JSON");

            const exercises = await response.json();
            console.log(`Fetched ${exercises.length} exercises.`);

            const BATCH_SIZE = 400;
            let batch = writeBatch(db);
            let counter = 0;
            let totalProcessed = 0;

            for (const ex of exercises) {
                // Use original ID as doc ID to prevent duplicates
                const docId = ex.id;
                const docRef = doc(db, COLLECTION_NAME, docId);

                // Normalize muscle group (Title Case)
                const muscleGroup = (ex.primaryMuscles && ex.primaryMuscles.length > 0)
                    ? ex.primaryMuscles[0].charAt(0).toUpperCase() + ex.primaryMuscles[0].slice(1)
                    : "Geral";

                const primaryMuscles = ex.primaryMuscles || [];
                const secondaryMuscles = ex.secondaryMuscles || [];
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
                    updatedAt: new Date()
                };

                batch.set(docRef, data, { merge: true });
                counter++;
                totalProcessed++;

                if (counter >= BATCH_SIZE) {
                    console.log(`Committing batch of ${counter} items... (Total: ${totalProcessed})`);
                    await batch.commit();
                    batch = writeBatch(db);
                    counter = 0;
                }
            }

            if (counter > 0) {
                console.log(`Committing final batch of ${counter} items...`);
                await batch.commit();
            }

            console.log(`✅ Import finished! Total processed: ${totalProcessed}`);
            return totalProcessed;

        } catch (error) {
            console.error("❌ Import failed:", error);
            throw error;
        }
    }
};
