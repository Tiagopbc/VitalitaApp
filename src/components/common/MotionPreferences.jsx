/**
 * MotionPreferences.jsx
 * Propaga a preferência de movimento reduzido do sistema para as animações do
 * framer-motion (reducedMotion="user"). Desde o R06 o framer só existe no
 * arrasto de exercícios (create-workout/ExerciseList), e é lá que isto envolve;
 * o resto do app anima em CSS e respeita a mesma preferência pelo index.css.
 */
import React from 'react';
import { MotionConfig } from 'framer-motion';

export function MotionPreferences({ children }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
