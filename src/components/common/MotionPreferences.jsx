/**
 * MotionPreferences.jsx
 * Propaga a preferência de movimento reduzido do sistema para todas as
 * animações do framer-motion (reducedMotion="user").
 */
import React from 'react';
import { MotionConfig } from 'framer-motion';

export function MotionPreferences({ children }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
