export const newTemplates = [
    {
        name: "TREINO A (Costas, Bíceps e Abdômen)",
        exercises: [
            {
                id: "1",
                muscleGroup: "Costas",
                name: "Puxada pela frente pronada + puxada pegada supinada (Bi-set)",
                sets: "4", reps: "15", rest: "1m", method: "Bi-set", notes: "Realizar 4 x 15 rep. (1m inter.)"
            },
            {
                id: "2",
                muscleGroup: "Costas",
                name: "Remada cavalinho",
                sets: "4", reps: "10+12+15", rest: "1m", method: "Drop-set", notes: "Realizar 4x 10+12+15 rep. (1m inter.)"
            },
            {
                id: "3",
                muscleGroup: "Costas",
                name: "Pulldown com barra",
                sets: "4", reps: "15", rest: "1m", method: "Convencional", notes: "Realizar 4x 15 rep. (1m inter.)"
            },
            {
                id: "4",
                muscleGroup: "Ombros",
                name: "Face pull",
                sets: "4", reps: "15", rest: "1m", method: "Convencional", notes: "Realizar 4x 15 rep. (1m inter.)"
            },
            {
                id: "5",
                muscleGroup: "Bíceps",
                name: "Bíceps banco 45º",
                sets: "4", reps: "15", rest: "1m", method: "Convencional", notes: "Realizar 4 x 15 rep. (1m inter.)"
            },
            {
                id: "6",
                muscleGroup: "Bíceps",
                name: "Bíceps banco scott barra w + rosca direta barra w (Bi-set)",
                sets: "4", reps: "15", rest: "1m", method: "Bi-set", notes: "Realizar 4 x 15 rep. (1m inter.)"
            },
            {
                id: "7",
                muscleGroup: "Abdômen",
                name: "Abdominal supra solo + Abdominal infra solo (Bi-set)",
                sets: "4", reps: "15", rest: "1m", method: "Bi-set", notes: "Realizar 4 x 15 rep. (1m inter.)"
            }
        ],
        notes: "Obs: Realizar cardio de sua preferência (esteira, elíptico) após o treino de 25 a 30min."
    },
    {
        name: "TREINO B (Inferiores)",
        exercises: [
            { id: "1", muscleGroup: "Quadríceps", name: "Agachamento smith", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "2", muscleGroup: "Quadríceps", name: "Cadeira extensora", sets: "4", reps: "15+12", rest: "1m", method: "Drop-set" },
            { id: "3", muscleGroup: "Quadríceps", name: "Leg press 45º", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "4", muscleGroup: "Glúteos", name: "Elevação pélvica máquina", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "5", muscleGroup: "Posteriores", name: "Mesa flexora + stiff (Bi-set)", sets: "4", reps: "15", rest: "1m", method: "Bi-set" },
            { id: "6", muscleGroup: "Posteriores", name: "Cadeira flexora", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "7", muscleGroup: "Panturrilha", name: "Panturrilha máquina", sets: "4", reps: "15", rest: "1m", method: "Convencional" }
        ],
        notes: "Obs: Realizar cardio de sua preferência (esteira, elíptico) após o treino de 25 a 30min."
    },
    {
        name: "TREINO C (Peito, Ombro e Tríceps)",
        exercises: [
            { id: "1", muscleGroup: "Peito", name: "Supino reto com barra", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "2", muscleGroup: "Peito", name: "Crucifixo no voador", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "3", muscleGroup: "Peito", name: "Crossover polia alta", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "4", muscleGroup: "Ombros", name: "Desenvolvimento barra + elevação lateral (Bi-set)", sets: "4", reps: "15", rest: "1m", method: "Bi-set" },
            { id: "5", muscleGroup: "Ombros", name: "Elevação frontal no Cross corda", sets: "4", reps: "15", rest: "1m", method: "Convencional" },
            { id: "6", muscleGroup: "Tríceps", name: "Tríceps barra V", sets: "4", reps: "10+12+15", rest: "1m", method: "Drop-set" },
            { id: "7", muscleGroup: "Tríceps", name: "Tríceps testa Cross corda", sets: "4", reps: "15", rest: "1m", method: "Convencional" }
        ],
        notes: "Obs: Realizar cardio de sua preferência (esteira, elíptico) após o treino de 25 a 30min."
    }
];

export const seedWorkoutData = async (user) => {
    if (!user) return;
    try {
        const { getFirestoreDeps } = await import('../firebaseDb');
        const { db, collection, addDoc, serverTimestamp } = await getFirestoreDeps();
        for (const t of newTemplates) {
            await addDoc(collection(db, 'workout_templates'), {
                ...t,
                userId: user.uid,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        alert("Treinos (A, B, C) de Tiago adicionados com sucesso!");
    } catch(err) {
        console.error(err);
        alert("Erro ao adicionar treinos.");
    }
};
