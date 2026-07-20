/**
 * Loader do card compartilhável, isolado num módulo próprio para que tanto o
 * WorkoutFinishModal (React.lazy) quanto o warmup do useWorkoutShare possam
 * importá-lo sem violar a regra react-refresh/only-export-components.
 */
export const loadShareableWorkoutCard = () =>
    import('../sharing/ShareableWorkoutCard').then(module => ({ default: module.ShareableWorkoutCard }));
