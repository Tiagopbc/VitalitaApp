
import React from 'react';
import { LineChart } from 'lucide-react';

let rechartsPromise;
const loadRecharts = () => {
    if (!rechartsPromise) {
        rechartsPromise = import('recharts');
    }
    return rechartsPromise;
};

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
    const [recharts, setRecharts] = React.useState(null);

    React.useEffect(() => {
        let active = true;
        loadRecharts()
            .then((mod) => {
                if (active) setRecharts(mod);
            })
            .catch(() => {
                if (active) setRecharts(null);
            });
        return () => {
            active = false;
        };
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 px-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/20">
                    <LineChart size={24} />
                </div>
                <p className="text-sm font-bold text-slate-200">Sem evolução neste período</p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                    Finalize treinos com carga e repetições para montar o gráfico automaticamente.
                </p>
            </div>
        );
    }

    if (!recharts) {
        return (
            <div className="w-full h-72 bg-slate-900/20 border border-slate-800/50 rounded-2xl p-4 animate-pulse" />
        );
    }

    const {
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
        Area,
        AreaChart
    } = recharts;

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
