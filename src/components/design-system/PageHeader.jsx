import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from './Button';

export function PageHeader({
    title,
    description,
    icon,
    onBack,
    backLabel = 'Voltar',
    action,
    className = ''
}) {
    return (
        <header className={`mb-6 ${className}`}>
            {onBack && (
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onBack}
                    className="mb-5 rounded-full uppercase"
                    leftIcon={<ChevronLeft size={16} />}
                >
                    {backLabel}
                </Button>
            )}
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    {icon && (
                        <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/25">
                            {icon}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-white lg:text-3xl">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-1 text-sm leading-relaxed text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </header>
    );
}
