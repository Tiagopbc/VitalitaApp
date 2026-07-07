import React from 'react';

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = ''
}) {
    return (
        <div className={`rounded-3xl border border-dashed border-slate-700/70 bg-slate-900/35 px-5 py-8 text-center ${className}`}>
            {icon && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/20">
                    {icon}
                </div>
            )}
            <h3 className="text-base font-bold text-white">{title}</h3>
            {description && (
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                    {description}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
