import { useState, useEffect } from 'react';
import { getExplanation } from '../api/client';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import type { AppState } from '../App';

interface Props {
    state: AppState;
    updateState: (u: Partial<AppState>) => void;
}

const featureDescriptions: Record<string, string> = {
    PC1: 'Principal Component 1: Explains the highest variance in structural traffic volume and latency.',
    PC2: 'Principal Component 2: Captures secondary variance typically associated with protocol and port configurations.',
    PC3: 'Principal Component 3: Represents deeper frequency/spectral anomalies and burst variance.',
    PC4: 'Principal Component 4: Encodes non-linear network timing structures isolated by the quantum map.',
    PC5: 'Principal Component 5: Minor latent feature highlighting subtle payload variations.',
    PC6: 'Principal Component 6: Residual orthogonal variance trace.',
    PC7: 'Principal Component 7: Low-impact dense clustering parameter.',
    PC8: 'Principal Component 8: Lowest-variance orthogonal state feature.',
};

const featureColors: Record<string, string> = {
    PC1: '#9333EA', PC2: '#00897B', PC3: '#F9A825',
    PC4: '#EF4444', PC5: '#3B82F6', PC6: '#10B981',
    PC7: '#F59E0B', PC8: '#8B5CF6',
};

export default function Explainability({ state, updateState }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (state.sessionId && state.modelId && !data) {
            fetchExplanation();
        }
    }, [state.sessionId, state.modelId]);

    const fetchExplanation = async () => {
        if (!state.sessionId || !state.modelId) return;
        setLoading(true); setError('');
        try {
            const res = await getExplanation({ session_id: state.sessionId, model_id: state.modelId });
            setData(res.data);
            updateState({ shapData: res.data });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to compute explanations');
        } finally { setLoading(false); }
    };

    if (!state.modelId) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold text-white mb-8">Explainability</h1>
                <div className="flex items-center justify-center h-96 bg-card rounded-xl border border-border">
                    <p className="text-slate-500 text-lg">⚠ Train a model first to view explanations</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold text-white mb-8">Explainability</h1>

            {loading && (
                <div className="flex items-center justify-center h-48">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400">Computing SHAP values...</p>
                    </div>
                </div>
            )}
            {error && <p className="text-red-400 mb-4">❌ {error}</p>}

            {data && (
                <div className="space-y-8 animate-fade-in">
                    {/* SHAP Feature Importance */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-xl font-semibold text-teal mb-4">SHAP Global Feature Importance</h2>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data.shap_importance} layout="vertical" margin={{ left: 140 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                                <XAxis type="number" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                <YAxis type="category" dataKey="feature" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} width={130} />
                                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, color: '#E2E8F0' }}
                                    formatter={(v: number | undefined) => v !== undefined ? v.toFixed(6) : ''} />
                                <Bar dataKey="shap_importance" radius={[0, 4, 4, 0]}>
                                    {data.shap_importance.map((item: any, i: number) => (
                                        <Cell key={i} fill={featureColors[item.feature] || '#00897B'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-4 justify-center text-xs">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal inline-block" /> Traffic Volume</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold inline-block" /> Port/Protocol</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-600 inline-block" /> Spectral</span>
                        </div>
                    </div>

                    {/* SHAP Heatmap */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-xl font-semibold text-teal mb-4">SHAP Value Matrix (50 sample packets)</h2>
                        <div className="overflow-x-auto">
                            <div className="inline-block min-w-full">
                                <div className="flex mb-2 ml-8">
                                    {data.feature_names.map((f: string) => (
                                        <div key={f} className="w-16 text-center text-[9px] text-slate-500 transform -rotate-45 origin-bottom-left whitespace-nowrap" style={{ minWidth: 40 }}>
                                            {f.slice(0, 12)}
                                        </div>
                                    ))}
                                </div>
                                {data.shap_matrix_sample.slice(0, 30).map((row: number[], ri: number) => (
                                    <div key={ri} className="flex items-center">
                                        <span className="w-8 text-[9px] text-slate-500 text-right pr-1">{ri}</span>
                                        {row.map((val: number, ci: number) => {
                                            const intensity = Math.min(1, Math.abs(val) * 5);
                                            const bg = val > 0
                                                ? `rgba(239, 68, 68, ${intensity})`
                                                : `rgba(59, 130, 246, ${intensity})`;
                                            return <div key={ci} className="h-4 border border-dark/30" style={{ background: bg, minWidth: 40 }} title={`${data.feature_names[ci]}: ${val.toFixed(4)}`} />;
                                        })}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-8 h-3 rounded" style={{ background: 'rgba(59, 130, 246, 0.7)' }} /> Reduces anomaly</span>
                                <span className="flex items-center gap-1"><span className="w-8 h-3 rounded" style={{ background: 'rgba(239, 68, 68, 0.7)' }} /> Increases anomaly</span>
                            </div>
                        </div>
                    </div>

                    {/* PDP */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-xl font-semibold text-teal mb-4">Partial Dependence Plots</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.pdp.map((pdp: any) => (
                                <div key={pdp.feature} className="bg-dark rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-slate-300 mb-3">Effect of <span className="text-gold">{pdp.feature}</span> on Anomaly Probability</h4>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={pdp.grid_values.map((v: number, i: number) => ({
                                            x: v, y: pdp.avg_predictions[i],
                                            upper: pdp.avg_predictions[i] + 0.05,
                                            lower: pdp.avg_predictions[i] - 0.05,
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                                            <XAxis dataKey="x" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                            <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, color: '#E2E8F0' }} />
                                            <Line type="monotone" dataKey="y" stroke="#00897B" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Descriptions */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-xl font-semibold text-teal mb-4">Feature Descriptions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(featureDescriptions).map(([f, desc]) => (
                                <div key={f} className="p-3 bg-dark rounded-lg border border-border/50">
                                    <p className="text-sm font-semibold text-gold mb-1 font-mono">{f}</p>
                                    <p className="text-xs text-slate-400">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
