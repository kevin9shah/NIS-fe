import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainModel } from '../api/client';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import MetricsCard from '../components/MetricsCard';
import type { AppState } from '../App';

interface Props {
    state: AppState;
    updateState: (u: Partial<AppState>) => void;
}

const algorithms = [
    { id: 'random_forest', label: 'Random Forest', icon: '🌲' },
    { id: 'xgboost', label: 'XGBoost', icon: '⚡' },
    { id: 'gradient_boosting', label: 'Gradient Boosting', icon: '📈' },
];

export default function Training({ state, updateState }: Props) {
    const navigate = useNavigate();
    const [algorithm, setAlgorithm] = useState('xgboost');
    const [testSize, setTestSize] = useState(0.2);
    const [hyperparams, setHyperparams] = useState<Record<string, number>>({
        n_estimators: 200, max_depth: 6, learning_rate: 0.1, subsample: 0.8,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);

    const handleTrain = async () => {
        if (!state.sessionId) { setError('Please upload a dataset first.'); return; }
        setLoading(true); setError('');
        try {
            const res = await trainModel({
                session_id: state.sessionId, algorithm, test_size: testSize, hyperparams,
            });
            setResult(res.data);
            updateState({ modelId: res.data.model_id });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Training failed');
        } finally { setLoading(false); }
    };

    const hp = (key: string, min: number, max: number, step: number, label: string) => (
        <div key={key} className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-teal-light font-mono">{hyperparams[key]}</span>
            </div>
            <input type="range" min={min} max={max} step={step}
                value={hyperparams[key]} className="w-full accent-teal"
                onChange={e => setHyperparams(p => ({ ...p, [key]: parseFloat(e.target.value) }))} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold text-white mb-8">Model Training</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-xl font-semibold text-teal mb-6">Configuration</h2>

                    <div className="mb-6">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Algorithm</p>
                        <div className="space-y-2">
                            {algorithms.map(a => (
                                <button key={a.id} onClick={() => setAlgorithm(a.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${algorithm === a.id ? 'border-teal bg-teal/10 text-white' : 'border-border text-slate-400 hover:border-teal/30'
                                        }`}>
                                    <span className="mr-2">{a.icon}</span>{a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Test Size</span>
                            <span className="text-teal-light font-mono">{(testSize * 100).toFixed(0)}%</span>
                        </div>
                        <input type="range" min={0.1} max={0.4} step={0.05} value={testSize}
                            className="w-full accent-teal" onChange={e => setTestSize(parseFloat(e.target.value))} />
                    </div>

                    <div className="mb-6">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Hyperparameters</p>
                        {hp('n_estimators', 50, 500, 10, 'N Estimators')}
                        {hp('max_depth', 2, 20, 1, 'Max Depth')}
                        {hp('learning_rate', 0.01, 0.5, 0.01, 'Learning Rate')}
                        {hp('subsample', 0.5, 1.0, 0.05, 'Subsample')}
                    </div>

                    <button onClick={handleTrain} disabled={loading || !state.sessionId}
                        className="w-full py-3 rounded-xl bg-teal hover:bg-teal/80 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {loading ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Training...</>
                        ) : '🚀 Train Model'}
                    </button>

                    {error && <p className="mt-3 text-red-400 text-sm">❌ {error}</p>}
                    {!state.sessionId && <p className="mt-3 text-yellow-400 text-sm">⚠ Upload a dataset first</p>}
                </div>

                {/* Results */}
                <div className="lg:col-span-2">
                    {result ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Metrics */}
                            <div className="grid grid-cols-5 gap-4">
                                {[
                                    { label: 'Accuracy', value: result.metrics.accuracy, icon: '🎯' },
                                    { label: 'Precision', value: result.metrics.precision, icon: '🔬' },
                                    { label: 'Recall', value: result.metrics.recall, icon: '📡' },
                                    { label: 'F1 Score', value: result.metrics.f1, icon: '⚖' },
                                    { label: 'ROC-AUC', value: result.metrics.roc_auc, icon: '📊' },
                                ].map(m => <MetricsCard key={m.label} {...m} />)}
                            </div>

                            {/* Confusion Matrix */}
                            <div className="bg-card rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-teal mb-4">Confusion Matrix</h3>
                                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                                    {[
                                        { v: result.confusion_matrix[0][0], label: 'True Neg', color: 'bg-green-900/50 text-green-400 border-green-700' },
                                        { v: result.confusion_matrix[0][1], label: 'False Pos', color: 'bg-red-900/50 text-red-400 border-red-700' },
                                        { v: result.confusion_matrix[1][0], label: 'False Neg', color: 'bg-orange-900/50 text-orange-400 border-orange-700' },
                                        { v: result.confusion_matrix[1][1], label: 'True Pos', color: 'bg-green-900/50 text-green-400 border-green-700' },
                                    ].map((c, i) => (
                                        <div key={i} className={`p-4 rounded-lg border text-center ${c.color}`}>
                                            <p className="text-2xl font-bold">{c.v}</p>
                                            <p className="text-xs mt-1 opacity-80">{c.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Feature Importance */}
                            <div className="bg-card rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-teal mb-4">Feature Importance</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={result.feature_importances.slice(0, 10)} layout="vertical" margin={{ left: 120 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                                        <XAxis type="number" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                        <YAxis type="category" dataKey="feature" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} width={110} />
                                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 8, color: '#E2E8F0' }} />
                                        <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                                            {result.feature_importances.slice(0, 10).map((_: any, i: number) => (
                                                <Cell key={i} fill={`hsl(${170 + i * 10}, 60%, ${50 - i * 3}%)`} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Training Summary */}
                            <div className="bg-card rounded-xl border border-border p-6">
                                <h3 className="text-lg font-semibold text-teal mb-3">Training Summary</h3>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                    <div><span className="text-slate-500">Time:</span> <span className="text-gold font-mono">{result.training_time_seconds}s</span></div>
                                    <div><span className="text-slate-500">Train Normal:</span> <span className="font-mono">{result.class_distribution.train_normal}</span></div>
                                    <div><span className="text-slate-500">Train Anomaly:</span> <span className="font-mono">{result.class_distribution.train_anomaly}</span></div>
                                    <div><span className="text-slate-500">Test Total:</span> <span className="font-mono">{result.class_distribution.test_normal + result.class_distribution.test_anomaly}</span></div>
                                </div>
                            </div>

                            <button onClick={() => navigate('/detection')}
                                className="w-full py-3 rounded-xl bg-teal hover:bg-teal/80 text-white font-semibold transition-all">
                                Proceed to Detection →
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-96 bg-card rounded-xl border border-border">
                            <div className="text-center">
                                <p className="text-5xl mb-4">🧠</p>
                                <p className="text-lg text-slate-500">Configure and train a model</p>
                                <p className="text-sm text-slate-600 mt-1">Results will appear here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
