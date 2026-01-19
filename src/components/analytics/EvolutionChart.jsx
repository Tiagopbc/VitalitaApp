
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';

// Tooltip Personalizado
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#020617]/90 border border-slate-700/50 p-3 rounded-xl shadow-xl backdrop-blur-md">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-cyan-400 font-bold text-lg">
                    {payload[0].value} kg
                </p>
            </div>
        );
    }
    return null;
};

export function EvolutionChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <p className="text-slate-500 text-sm">Sem dados suficientes neste período</p>
            </div>
        );
    }



    return (
        <div className="w-full h-72 bg-slate-900/20 border border-slate-800/50 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="dateStr"
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorWeight)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
