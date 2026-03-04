import { useState } from 'react';
import { runSimulation } from '../api/client';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import type { AppState } from '../App';

interface Props {
    state: AppState;
    updateState: (u: Partial<AppState>) => void;
}

const defaultPktCounts = [5, 10, 20, 50, 100, 200, 500];
const defaultPktSizes = [64, 128, 256, 512, 1024, 1500];

export default function Simulation({ state }: Props) {
    const [pktCounts, setPktCounts] = useState<number[]>([...defaultPktCounts]);
    const [pktSizes, setPktSizes] = useState<number[]>([...defaultPktSizes]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);

    const toggleValue = (arr: number[], val: number, setter: (v: number[]) => void) => {
        setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val].sort((a, b) => a - b));
    };

    const handleRun = async () => {
        if (!state.sessionId || !state.modelId) { setError('Train a model first.'); return; }
        if (pktCounts.length === 0 || pktSizes.length === 0) { setError('Select at least one value for each parameter.'); return; }
        setLoading(true); setError('');
        try {
            const res = await runSimulation({
                session_id: state.sessionId, model_id: state.modelId,
                vary_packet_count: pktCounts, vary_mean_packet_size: pktSizes,
            });
            setResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Simulation failed');
        } finally { setLoading(false); }
    };

    // Generate auto-insight
    const generateInsight = () => {
        if (!result?.results?.length) return null;
        const highProb = result.results.filter((r: any) => r.anomaly_prob > 0.5);
        if (highProb.length === 0) return 'All parameter combinations produced low anomaly probability. The model considers these conditions normal.';
        const maxResult = result.results.reduce((a: any, b: any) => a.anomaly_prob > b.anomaly_prob ? a : b);
        return `At packet_count_5s = ${maxResult.packet_count_5s}, anomaly probability reaches ${maxResult.anomaly_prob.toFixed(2)} with mean_packet_size = ${maxResult.mean_packet_size}. ${highProb.length} of ${result.results.length} combinations exceed 0.5 anomaly probability, suggesting high sensitivity in these parameter ranges.`;
    };

    // Line chart data: group by packet_count_5s
    const lineData = () => {
        if (!result?.results) return [];
        const grouped: Record<number, any[]> = {};
        result.results.forEach((r: any) => {
            if (!grouped[r.mean_packet_size]) grouped[r.mean_packet_size] = [];
            grouped[r.mean_packet_size].push(r);
        });
        const sizes = Object.keys(grouped).map(Number).sort((a, b) => a - b);
        if (sizes.length === 0) return [];

        const counts = ([...new Set(result.results.map((r: any) => r.packet_count_5s))] as number[]).sort((a: number, b: number) => a - b);
        return counts.map((count: number) => {
            const point: any = { packet_count: count };
            sizes.forEach(size => {
                const match = result.results.find((r: any) => r.packet_count_5s === count && r.mean_packet_size === size);
                point[`size_${size}`] = match?.anomaly_prob || 0;
            });
            return point;
        });
    };

    const getHeatmapColor = (v: number) => {
        if (v > 0.8) return 'bg-red-600';
        if (v > 0.6) return 'bg-orange-600';
        if (v > 0.4) return 'bg-yellow-600';
        if (v > 0.2) return 'bg-green-600';
        return 'bg-green-800';
    };

    const lineColors = ['#00897B', '#F9A825', '#9333EA', '#EF4444', '#3B82F6', '#EC4899'];

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold text-white mb-4">What-If Simulation</h1>
            <p className="text-slate-400 mb-8 max-w-3xl">
                Simulate how varying network conditions affect anomaly detection probability.
                Adjust packet volume and size parameters to see how the model responds — useful
                for stress testing detection thresholds under different attack intensities.
            </p>

            {/* Controls */}
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-semibold text-teal mb-3">Packet Count (5s window)</p>
                        <div className="flex flex-wrap gap-2">
                            {defaultPktCounts.map(v => (
                                <button key={v} onClick={() => toggleValue(pktCounts, v, setPktCounts)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${pktCounts.includes(v) ? 'bg-teal/20 text-teal border border-teal' : 'bg-dark border border-border text-slate-500'
                                        }`}>{v}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-teal mb-3">Mean Packet Size (bytes)</p>
                        <div className="flex flex-wrap gap-2">
                            {defaultPktSizes.map(v => (
                                <button key={v} onClick={() => toggleValue(pktSizes, v, setPktSizes)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${pktSizes.includes(v) ? 'bg-teal/20 text-teal border border-teal' : 'bg-dark border border-border text-slate-500'
                                        }`}>{v}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <button onClick={handleRun} disabled={loading || !state.modelId}
                    className="mt-4 px-8 py-3 rounded-xl bg-teal hover:bg-teal/80 text-white font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
                    {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</> : '🔬 Run Simulation'}
                </button>
                {error && <p className="mt-2 text-red-400 text-sm">❌ {error}</p>}
            </div>

            {result && (
                <div className="space-y-8 animate-fade-in">
                    {/* Heatmap */}
                    {result.heatmap_data?.x && (
                        <div className="bg-card rounded-xl border border-border p-6">
                            <h3 className="text-lg font-semibold text-teal mb-4">Anomaly Probability Heatmap</h3>
                            <div className="overflow-x-auto">
                                <table className="mx-auto">
                                    <thead>
                                        <tr>
                                            <th className="px-2 py-1 text-xs text-slate-500"></th>
                                            {result.heatmap_data.x.map((x: number) => (
                                                <th key={x} className="px-2 py-1 text-xs text-slate-400 font-mono">{x}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.heatmap_data.y.map((y: number, yi: number) => (
                                            <tr key={y}>
                                                <td className="px-2 py-1 text-xs text-slate-400 font-mono text-right">{y}</td>
                                                {result.heatmap_data.z[yi].map((v: number, xi: number) => (
                                                    <td key={xi} className={`w-16 h-10 text-center text-xs font-mono text-white ${getHeatmapColor(v)}`} title={`pkt_count=${y}, pkt_size=${result.heatmap_data.x[xi]}, prob=${v.toFixed(4)}`}>
                                                        {v.toFixed(2)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="flex items-center justify-between mt-3 text-xs text-slate-500 max-w-lg mx-auto">
                                    <span>← mean_packet_size →</span>
                                    <span>↑ packet_count_5s ↓</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Line Chart */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold text-teal mb-4">Anomaly Probability by Traffic Volume</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={lineData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                                <XAxis dataKey="packet_count" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} label={{ value: 'Packet Count (5s)', position: 'bottom', fill: '#64748B' }} />
                                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} domain={[0, 1]} />
                                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, color: '#E2E8F0' }} />
                                <Legend />
                                {pktSizes.map((size, i) => (
                                    <Line key={size} type="monotone" dataKey={`size_${size}`}
                                        stroke={lineColors[i % lineColors.length]} strokeWidth={2}
                                        dot={{ fill: lineColors[i % lineColors.length], r: 3 }}
                                        name={`Size ${size}`} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Insight */}
                    <div className="bg-card rounded-xl border border-teal/30 p-6">
                        <h3 className="text-lg font-semibold text-gold mb-2">💡 Auto-Generated Insight</h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{generateInsight()}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
