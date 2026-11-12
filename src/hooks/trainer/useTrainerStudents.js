/**
 * useTrainerStudents.js
 * Alunos vinculados ao personal (trainer_students + perfil de cada um) e a
 * busca por nome ou e-mail. Lógica movida de TrainerDashboard sem mudança.
 */
import { useCallback, useEffect, useState } from 'react';
import { getFirestoreDeps } from '../../firebaseDb';

export function useTrainerStudents(user) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStudents = useCallback(async () => {
        if (!user) return;
        try {
            const { db, collection, query, where, getDocs, getDoc, doc } = await getFirestoreDeps();
            const q = query(
                collection(db, 'trainer_students'),
                where('trainerId', '==', user.uid)
            );
            const snap = await getDocs(q);
            const loadedStudents = [];

            for (const d of snap.docs) {
                const data = d.data();
                const userDoc = await getDoc(doc(db, 'users', data.studentId));
                if (userDoc.exists()) {
                    loadedStudents.push({
                        id: userDoc.id,
                        ...userDoc.data(),
                        uid: userDoc.id,
                        linkedAt: data.linkedAt?.toDate()
                    });
                }
            }
            setStudents(loadedStudents);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        // A busca começa ligando um estado de carregamento; disparada numa
        // microtarefa, isso não acontece no corpo síncrono do efeito (sem render
        // em cascata). O atraso é de uma microtarefa, invisível na tela.
        Promise.resolve().then(() => fetchStudents());
    }, [user, fetchStudents]);

    // Alunos Filtrados
    const filteredStudents = students.filter(s =>
        s.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { students, loading, searchTerm, setSearchTerm, filteredStudents, fetchStudents };
}
