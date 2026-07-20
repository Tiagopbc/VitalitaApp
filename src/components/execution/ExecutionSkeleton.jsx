import { Skeleton } from '../design-system/Skeleton';

/**
 * Esqueleto de carregamento da página de execução (barra superior + cards).
 */
export function ExecutionSkeleton() {
    return (
        <div className="min-h-screen bg-[#020617] p-4 font-sans max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center py-4">
                <Skeleton className="h-8 w-20 rounded-full" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                </div>
            </div>
            <div className="h-10"></div>
            <Skeleton className="h-32 w-full rounded-3xl" />
            <div className="space-y-4">
                <Skeleton className="h-64 w-full rounded-3xl" />
                <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
        </div>
    );
}
