import { useState } from 'react';
import { runPrediction } from '../api/client';
import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import MetricsCard from '../components/MetricsCard';
import ThreatBadge from '../components/ThreatBadge';
import type { AppState } from '../App';

interface Props {
    state: AppState;
    updateState: (u: Partial<AppState>) => void;
}

export default function Detection({ state, updateState }: Props) {
    const [baseThreshold, setBaseThreshold] = useState(0.5);
    const [alpha, setAlpha] = useState(0.3);
    const [d, setD] = useState(1.0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [filterLevel, setFilterLevel] = useState('ALL');
    const perPage = 50;

    const handleDetect = async () => {
        if (!state.sessionId || !state.modelId) { setError('Train a model first.'); return; }
        setLoading(true); setError('');
        try {
            const res = await runPrediction({
                session_id: state.sessionId, model_id: state.modelId,
                qtta_params: { base_threshold: baseThreshold, alpha, d },
            });
            updateState({ predictions: res.data.predictions, qttaSummary: res.data.qtta_summary });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Detection failed');
        } finally { setLoading(false); }
    };

    const predictions = state.predictions || [];
    const summary = state.qttaSummary;

    const chartData = predictions.map((p: any, i: number) => ({
        index: i,
        score: p.anomaly_score,
        threshold: p.qtta_threshold,
        isAnomaly: p.anomaly_score > p.qtta_threshold ? p.anomaly_score : null,
    }));

    const filtered = filterLevel === 'ALL' ? predictions : predictions.filter((p: any) => p.threat_level === filterLevel);
    const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    const lastState = predictions.length > 0 ? predictions[predictions.length - 1] : null;

    const rowBg = (level: string) => {
        const m: Record<string, string> = {
            CRITICAL: 'bg-red-950/40', HIGH: 'bg-orange-950/40',
            MEDIUM: 'bg-yellow-950/40', LOW: 'bg-blue-950/40', NORMAL: '',
        };
        return m[level] || '';
    };

    const exportCSV = () => {
        const headers = ['Index', 'Anomaly Score', 'QTTA Threshold', 'Threat Level', 'Tunneling Prob'];
        const rows = predictions.map((p: any) =>
            [p.index, p.anomaly_score, p.qtta_threshold, p.threat_level, p.tunneling_prob].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'qsand_detections.csv'; a.click();
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold text-white mb-8">Anomaly Detection</h1>

            {/* QTTA Controls */}
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
                <h2 className="text-xl font-semibold text-teal mb-4">QTTA Parameters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Base Threshold κ₀', value: baseThreshold, set: setBaseThreshold, min: 0.3, max: 0.8, step: 0.01 },
                        { label: 'Sensitivity α', value: alpha, set: setAlpha, min: 0.1, max: 0.5, step: 0.01 },
                        { label: 'Tunneling Width d', value: d, set: setD, min: 0.5, max: 3.0, step: 0.1 },
                    ].map(s => (
                        <div key={s.label}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">{s.label}</span>
                                <span className="text-teal-light font-mono">{s.value.toFixed(2)}</span>
                            </div>
                            <input type="range" min={s.min} max={s.max} step={s.step}
                                value={s.value} className="w-full accent-teal"
                                onChange={e => s.set(parseFloat(e.target.value))} />
                        </div>
                    ))}
                </div>
                <button onClick={handleDetect} disabled={loading || !state.modelId}
                    className="mt-4 px-8 py-3 rounded-xl bg-teal hover:bg-teal/80 text-white font-semibold transition-all disabled:opacity-50 flex items-center gap-2">
                    {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</> : '⚛ Run Detection'}
                </button>
                {error && <p className="mt-2 text-red-400 text-sm">❌ {error}</p>}
            </div>

            {predictions.length > 0 && (
                <div className="space-y-8 animate-fade-in">
                    {/* QTTA Chart */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold text-teal mb-4">Quantum Tunneling Threshold Evolution</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                                <XAxis dataKey="index" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} label={{ value: 'Packet Index', position: 'bottom', fill: '#64748B' }} />
                                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} domain={[0, 1]} />
                                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, color: '#E2E8F0' }} />
                                <Legend />
                                <Area type="monotone" dataKey="isAnomaly" fill="#EF4444" fillOpacity={0.15} stroke="none" name="Anomaly Zone" />
                                <Line type="monotone" dataKey="score" stroke="#F9A825" strokeWidth={1.5} dot={false} name="Anomaly Score" />
                                <Line type="monotone" dataKey="threshold" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="QTTA Threshold" />
                                <ReferenceLine y={baseThreshold} stroke="#6B7280" strokeDasharray="3 3" label={{ value: 'κ₀', fill: '#6B7280' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-4 gap-4">
                            <MetricsCard label="Static Anomalies" value={summary.static_anomaly_count} format="raw" icon="📊" />
                            <MetricsCard label="QTTA Anomalies" value={summary.qtta_anomaly_count} format="raw" icon="⚛" />
                            <MetricsCard label="Extra Caught by QTTA" value={summary.additional_caught_by_qtta} format="raw" icon="🎯" />
                            <MetricsCard label="Avg Tunneling P" value={
                                predictions.reduce((s: number, p: any) => s + p.tunneling_prob, 0) / predictions.length
                            } icon="🌀" />
                        </div>
                    )}

                    {/* QTTA State Panel */}
                    {lastState && (
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: 'E (Alert Pressure)', value: lastState.alert_pressure, color: 'text-yellow-400' },
                                { label: 'V₀ (Noise Floor)', value: lastState.noise_floor, color: 'text-blue-400' },
                                { label: 'T (Tunneling Prob)', value: lastState.tunneling_prob, color: 'text-purple-400' },
                                { label: 'κ (Threshold)', value: lastState.qtta_threshold, color: 'text-teal-light' },
                            ].map(s => (
                                <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
                                    <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                                    <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value.toFixed(4)}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results Table */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-teal">Packet Results</h3>
                            <div className="flex items-center gap-3">
                                <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(0); }}
                                    className="bg-dark border border-border rounded-lg px-3 py-1.5 text-sm text-slate-300">
                                    {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NORMAL'].map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                                <button onClick={exportCSV} className="px-4 py-1.5 rounded-lg bg-teal/20 text-teal text-sm hover:bg-teal/30 transition">
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-slate-500 text-xs uppercase">
                                        {['Index', 'Anomaly Score', 'QTTA Threshold', 'Tunneling P', 'Alert Pressure', 'Threat Level'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map((p: any) => (
                                        <tr key={p.index} className={`border-b border-border/30 hover:bg-white/5 ${rowBg(p.threat_level)}`}>
                                            <td className="px-4 py-2 font-mono">{p.index}</td>
                                            <td className="px-4 py-2 font-mono">{p.anomaly_score.toFixed(4)}</td>
                                            <td className="px-4 py-2 font-mono">{p.qtta_threshold.toFixed(4)}</td>
                                            <td className="px-4 py-2 font-mono">{p.tunneling_prob.toFixed(4)}</td>
                                            <td className="px-4 py-2 font-mono">{p.alert_pressure.toFixed(4)}</td>
                                            <td className="px-4 py-2"><ThreatBadge level={p.threat_level} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                        className="px-3 py-1 rounded bg-dark border border-border text-sm disabled:opacity-30">Prev</button>
                                    <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                                        className="px-3 py-1 rounded bg-dark border border-border text-sm disabled:opacity-30">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
