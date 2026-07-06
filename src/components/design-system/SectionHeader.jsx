import React from 'react';

export function SectionHeader({ icon, title, action, className = '' }) {
    return (
        <div className={`mb-4 flex items-center justify-between gap-3 ${className}`}>
            <div className="flex min-w-0 items-center gap-2">
                {icon && <span className="shrink-0 text-cyan-300">{icon}</span>}
                <h2 className="truncate text-base font-bold text-white">{title}</h2>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
